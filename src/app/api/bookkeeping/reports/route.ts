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
  const report = searchParams.get('report')
  const asOfDate = searchParams.get('as_of') || new Date().toISOString().split('T')[0]

  if (report === 'trial_balance') {
    // Trial Balance: all accounts with YTD debits and credits
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, account_number, name, type, subtype')
      .eq('org_id', roleData.org_id)
      .eq('is_active', true)
      .order('account_number')

    if (!accounts) return NextResponse.json({ error: 'No accounts' }, { status: 500 })

    const accountIds = accounts.map(a => a.id)

    // Sum all posted journal entry lines
    const { data: totals } = await supabase
      .from('journal_entry_lines')
      .select('account_id, debit, credit')
      .in('account_id', accountIds)
      .eq('journal_entry!inner(org_id, status)', roleData.org_id)

    const totalDebits = (totals || []).reduce((sum: number, l: any) => sum + parseFloat(l.debit || 0), 0)
    const totalCredits = (totals || []).reduce((sum: number, l: any) => sum + parseFloat(l.credit || 0), 0)

    const accountTotals: Record<string, { debit: number; credit: number }> = {}
    for (const line of (totals || [])) {
      if (!accountTotals[line.account_id]) accountTotals[line.account_id] = { debit: 0, credit: 0 }
      accountTotals[line.account_id].debit += parseFloat(line.debit || 0)
      accountTotals[line.account_id].credit += parseFloat(line.credit || 0)
    }

    const rows = accounts.map(a => ({
      ...a,
      debit: accountTotals[a.id]?.debit || 0,
      credit: accountTotals[a.id]?.credit || 0,
    }))

    return NextResponse.json({
      report: 'trial_balance',
      as_of: asOfDate,
      accounts: rows,
      totals: { debit: totalDebits, credit: totalCredits },
      is_balanced: Math.abs(totalDebits - totalCredits) < 0.01,
    })
  }

  return NextResponse.json({ error: 'Unknown report' }, { status: 400 })
}
