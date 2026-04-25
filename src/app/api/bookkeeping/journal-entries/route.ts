import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: roleData } = await supabase
    .from('user_org_roles')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single()

  if (!roleData) return NextResponse.json({ error: 'No org access' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const fromDate = searchParams.get('from')
  const toDate = searchParams.get('to')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = supabase
    .from('journal_entries')
    .select(`
      *,
      lines:jounal_entry_lines(
        *,
        account:accounts(id, account_number, name, type)
      )
    `)
    .eq('org_id', roleData.org_id)
    .order('date', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (fromDate) query = query.gte('date', fromDate)
  if (toDate) query = query.lte('date', toDate)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ journal_entries: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: roleData } = await supabase
    .from('user_org_roles')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single()

  if (!roleData || !['admin', 'accountant'].includes(roleData.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { date, description, lines, status = 'posted' } = body

  if (!date || !description || !lines || lines.length < 2) {
    return NextResponse.json({ error: 'Date, description, and at least 2 lines required' }, { status: 400 })
  }

  // Validate debits = credits
  const totalDebits = lines.reduce((sum: number, l: any) => sum + (l.debit || 0), 0)
  const totalCredits = lines.reduce((sum: number, l: any) => sum + (l.credit || 0), 0)
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    return NextResponse.json({ error: 'Debits must equal credits' }, { status: 400 })
  }

  // Create journal entry
  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      org_id: roleData.org_id,
      date,
      description,
      status,
      created_by: user.id,
    })
    .select()
    .single()

  if (entryError) return NextResponse.json({ error: entryError.message }, { status: 500 })

  // Insert lines
  const linesWithEntryId = lines.map((l: any) => ({
    journal_entry_id: entry.id,
    account_id: l.account_id,
    debit: l.debit || 0,
    credit: l.credit || 0,
    memo: l.memo || null,
  }))

  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert(linesWithEntryId)

  if (linesError) {
    // Rollback: delete entry
    await supabase.from('journal_entries').delete().eq('id', entry.id)
    return NextResponse.json({ error: linesError.message }, { status: 500 })
  }

  // Fetch complete entry with lines
  const { data: completeEntry } = await supabase
    .from('journal_entries')
    .select('*, lines:jounal_entry_lines(*)')
    .eq('id', entry.id)
    .single()

  return NextResponse.json({ journal_entry: completeEntry }, { status: 201 })
}
