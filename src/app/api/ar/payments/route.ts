import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { buildLedgerForOrg, postPaymentToGL } from '@/lib/financial-engine'

// POST /api/ar/payments — record customer payment + apply to invoices
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
  const { customer_id, amount_cents, payment_method, reference, deposit_account_id, payment_date, invoice_applications, currency } = body

  if (!customer_id || !amount_cents || !invoice_applications?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate total applied matches payment amount
  const totalApplied = invoice_applications.reduce((s: number, a: any) => s + a.applied_cents, 0)
  if (totalApplied > amount_cents) {
    return NextResponse.json({ error: 'Total applied exceeds payment amount' }, { status: 400 })
  }

  // Validate with Monetra
  const ledger = await buildLedgerForOrg(roleData.org_id, currency || 'USD')
  const validation = postPaymentToGL(ledger, {
    amountCents: amount_cents,
    cashAccountId: deposit_account_id || '1100',  // default to bank account
    arAccountId: '1200',
    currency: currency || 'USD',
  })

  if (!validation.valid) {
    return NextResponse.json({ error: `GL validation failed: ${validation.error}` }, { status: 400 })
  }

  // Auto-generate payment number
  const { count } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', roleData.org_id)
  const paymentNumber = `PMT-${String((count || 0) + 1).padStart(4, '0')}`

  // Create payment
  const { data: payment, error: payError } = await supabase
    .from('payments')
    .insert({
      org_id: roleData.org_id,
      payment_number: paymentNumber,
      customer_id,
      amount_cents,
      payment_method: payment_method || 'check',
      reference,
      deposit_account_id,
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      notes: `Applied to ${invoice_applications.length} invoice(s)`,
      created_by: user.id,
    })
    .select()
    .single()

  if (payError) return NextResponse.json({ error: payError.message }, { status: 500 })

  // Apply to invoices
  const applications = invoice_applications.map((a: any) => ({
    invoice_id: a.invoice_id,
    payment_id: payment.id,
    applied_cents: a.applied_cents,
  }))

  const { error: appError } = await supabase
    .from('invoice_payments')
    .insert(applications)

  if (appError) return NextResponse.json({ error: appError.message }, { status: 500 })

  // Update invoice paid amounts + statuses
  for (const app of invoice_applications) {
    const { data: inv } = await supabase
      .from('invoices')
      .select('paid_cents, total_cents')
      .eq('id', app.invoice_id)
      .single()

    if (inv) {
      const newPaid = inv.paid_cents + app.applied_cents
      const newStatus = newPaid >= inv.total_cents ? 'paid' : 'partial'
      await supabase
        .from('invoices')
        .update({ paid_cents: newPaid, status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', app.invoice_id)
    }
  }

  return NextResponse.json({ payment, validation: { valid: true } }, { status: 201 })
}

// GET /api/ar/payments — list payments
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

  const { data, error } = await supabase
    .from('payments')
    .select('*, customer:customers(id, name)')
    .eq('org_id', roleData.org_id)
    .order('payment_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ payments: data })
}