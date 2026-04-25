import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user's org_id from user_roles
  const { data: roleData } = await supabase
    .from('user_org_roles')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single()

  if (!roleData) return NextResponse.json({ error: 'No org access' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // asset, liability, equity, revenue, expense

  let query = supabase
    .from('accounts')
    .select('*')
    .eq('org_id', roleData.org_id)
    .eq('is_active', true)
    .order('account_number')

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ accounts: data })
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
  const { account_number, name, type, subtype, description } = body

  if (!account_number || !name || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      org_id: roleData.org_id,
      account_number,
      name,
      type,
      subtype: subtype || null,
      description: description || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ account: data }, { status: 201 })
}
