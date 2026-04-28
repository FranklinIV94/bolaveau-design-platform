import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { buildLedgerForOrg, postBillToGL, postBillPaymentToGL } from '@/lib/financial-engine'

// GET /api/ap/bills — list vendor bills with aging
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: roleData } = await supabase
    .from('user_org_roles')
    .select('org_id')
    .eq('user_id', user.id)
    .single()
  if (!roleData) return NextResponse.json({ error: 'No org access' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const vendorId = searchParams.get('vendor_id')
  const overdue = searchParams.get('overdue') === 'true'

  let query = supabase
    .from('bills')
    .select('*, vendor:vendors(id, name, email), bill_lines(*)')
    .eq('org_id', roleData.org_id)
    .order('due_date', { ascending: true })

  if (status) query = query.eq('status', status)
  if (vendorId) query = query.eq('vendor_id', vendorId)
  if (overdue) query = query.lt('due_date', new Date().toISOString().split('T')[0]).neq('status', 'paid')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // AP aging summary
  const aging = { current: 0, thirty: 0, sixty: 0, ninetyPlus: 0 }
  const today = new Date()
  for (const bill of (data || [])) {
    if (bill.status === 'paid' || bill.status === 'voided' || !bill.balance_cents) continue
    const daysPastDue = Math.floor((today.getTime() - new Date(bill.due_date).getTime()) / 86400000)
    if (daysPastDue <= 0) aging.current += bill.balance_cents
    else if (daysPastDue <= 30) aging.thirty += bill.balance_cents
    else if (daysPastDue <= 60) aging.sixty += bill.balance_cents
    else aging.ninetyPlus += bill.balance_cents
  }

  return NextResponse.json({ bills: data, aging })
}

// POST /api/ap/bills — create vendor bill + validate with Monetra
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
  const { vendor_id, vendor_invoice_number, issue_date, due_date, lines, notes, currency } = body

  if (!vendor_id || !due_date || !lines?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Auto-generate bill number
  const { count } = await supabase
    .from('bills')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', roleData.org_id)
  const billNumber = `BIL-${String((count || 0) + 1).padStart(4, '0')}`

  // Calculate totals
  let subtotalCents = 0
  let taxCents = 0
  for (const line of lines) {
    const amountCents = Math.round(line.quantity * line.unit_price_cents)
    subtotalCents += amountCents
    if (line.tax_rate) taxCents += Math.round(amountCents * line.tax_rate)
  }
  const totalCents = subtotalCents + taxCents

  // Validate with Monetra
  const ledger = await buildLedgerForOrg(roleData.org_id, currency || 'USD')
  const validation = postBillToGL(ledger, {
    totalCents,
    taxCents,
    expenseAccountId: lines[0]?.account_id || '6200',
    apAccountId: '2000',
    taxAccountId: '2300',
    currency: currency || 'USD',
  })

  if (!validation.valid) {
    return NextResponse.json({ error: `GL validation failed: ${validation.error}` }, { status: 400 })
  }

  // Create bill
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .insert({
      org_id: roleData.org_id,
      bill_number: billNumber,
      vendor_id,
      vendor_invoice_number,
      status: 'draft',
      issue_date: issue_date || new Date().toISOString().split('T')[0],
      due_date,
      subtotal_cents: subtotalCents,
      tax_cents: taxCents,
      total_cents: totalCents,
      paid_cents: 0,
      currency: currency || 'USD',
      notes,
      ledger_hash: validation.hash,
      created_by: user.id,
    })
    .select()
    .single()

  if (billError) return NextResponse.json({ error: billError.message }, { status: 500 })

  // Create bill lines
  const billLines = lines.map((line: any, i: number) => ({
    bill_id: bill.id,
    line_order: i,
    description: line.description,
    quantity: line.quantity,
    unit_price_cents: line.unit_price_cents,
    amount_cents: Math.round(line.quantity * line.unit_price_cents),
    account_id: line.account_id,
    tax_rate: line.tax_rate || 0,
  }))

  const { error: linesError } = await supabase
    .from('bill_lines')
    .insert(billLines)

  if (linesError) return NextResponse.json({ error: linesError.message }, { status: 500 })

  return NextResponse.json({ bill, validation: { valid: true, hash: validation.hash } }, { status: 201 })
}