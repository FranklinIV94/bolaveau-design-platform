import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { buildLedgerForOrg, postInvoiceToGL, postPaymentToGL } from '@/lib/financial-engine'

// GET /api/ar/invoices — list invoices with optional filters
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
  const customerId = searchParams.get('customer_id')
  const overdue = searchParams.get('overdue') === 'true'

  let query = supabase
    .from('invoices')
    .select('*, customer:customers(id, name, email), invoice_lines(*)')
    .eq('org_id', roleData.org_id)
    .order('due_date', { ascending: true })

  if (status) query = query.eq('status', status)
  if (customerId) query = query.eq('customer_id', customerId)
  if (overdue) query = query.lt('due_date', new Date().toISOString().split('T')[0]).neq('status', 'paid')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // AR aging summary
  const aging = { current: 0, thirty: 0, sixty: 0, ninetyPlus: 0 }
  const today = new Date()
  for (const inv of (data || [])) {
    if (inv.status === 'paid' || inv.status === 'voided' || !inv.balance_cents) continue
    const daysPastDue = Math.floor((today.getTime() - new Date(inv.due_date).getTime()) / 86400000)
    if (daysPastDue <= 0) aging.current += inv.balance_cents
    else if (daysPastDue <= 30) aging.thirty += inv.balance_cents
    else if (daysPastDue <= 60) aging.sixty += inv.balance_cents
    else aging.ninetyPlus += inv.balance_cents
  }

  return NextResponse.json({ invoices: data, aging })
}

// POST /api/ar/invoices — create invoice + post to GL
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
  const { customer_id, issue_date, due_date, lines, notes, currency } = body

  if (!customer_id || !due_date || !lines?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Auto-generate invoice number
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', roleData.org_id)
  const invoiceNumber = `INV-${String((count || 0) + 1).padStart(4, '0')}`

  // Calculate totals (in cents)
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
  const validation = postInvoiceToGL(ledger, {
    orgId: roleData.org_id,
    invoiceId: '', // not created yet
    invoiceNumber,
    customerId: customer_id,
    totalCents,
    taxCents,
    revenueAccountId: lines[0]?.account_id || '4000',
    arAccountId: '1200',
    taxAccountId: '2300',
    currency: currency || 'USD',
  })

  if (!validation.valid) {
    return NextResponse.json({ error: `GL validation failed: ${validation.error}` }, { status: 400 })
  }

  // Create invoice in Supabase
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .insert({
      org_id: roleData.org_id,
      invoice_number: invoiceNumber,
      customer_id,
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

  if (invError) return NextResponse.json({ error: invError.message }, { status: 500 })

  // Create invoice lines
  const invoiceLines = lines.map((line: any, i: number) => ({
    invoice_id: invoice.id,
    line_order: i,
    description: line.description,
    quantity: line.quantity,
    unit_price_cents: line.unit_price_cents,
    amount_cents: Math.round(line.quantity * line.unit_price_cents),
    account_id: line.account_id,
    tax_rate: line.tax_rate || 0,
  }))

  const { error: linesError } = await supabase
    .from('invoice_lines')
    .insert(invoiceLines)

  if (linesError) return NextResponse.json({ error: linesError.message }, { status: 500 })

  return NextResponse.json({ invoice, validation: { valid: true, hash: validation.hash } }, { status: 201 })
}