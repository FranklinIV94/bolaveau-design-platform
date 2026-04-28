import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { buildLedgerForOrg, postBillPaymentToGL } from '@/lib/financial-engine'

// POST /api/ap/payments — pay vendor bills
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
  const { vendor_id, amount_cents, payment_method, reference, payment_account_id, payment_date, bill_applications, currency } = body

  if (!vendor_id || !amount_cents || !bill_applications?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate with Monetra
  const ledger = await buildLedgerForOrg(roleData.org_id, currency || 'USD')
  const validation = postBillPaymentToGL(ledger, {
    amountCents: amount_cents,
    apAccountId: '2000',
    cashAccountId: payment_account_id || '1100',
    currency: currency || 'USD',
  })

  if (!validation.valid) {
    return NextResponse.json({ error: `GL validation failed: ${validation.error}` }, { status: 400 })
  }

  // Auto-generate payment number
  const { count } = await supabase
    .from('bill_payments')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', roleData.org_id)
  const paymentNumber = `VPM-${String((count || 0) + 1).padStart(4, '0')}`

  // Create vendor payment
  const { data: payment, error: payError } = await supabase
    .from('bill_payments')
    .insert({
      org_id: roleData.org_id,
      payment_number: paymentNumber,
      vendor_id,
      amount_cents,
      payment_method: payment_method || 'check',
      reference,
      payment_account_id,
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      created_by: user.id,
    })
    .select()
    .single()

  if (payError) return NextResponse.json({ error: payError.message }, { status: 500 })

  // Apply to bills
  const applications = bill_applications.map((a: any) => ({
    bill_id: a.bill_id,
    bill_payment_id: payment.id,
    applied_cents: a.applied_cents,
  }))

  const { error: appError } = await supabase
    .from('bill_payment_applied')
    .insert(applications)

  if (appError) return NextResponse.json({ error: appError.message }, { status: 500 })

  // Update bill paid amounts + statuses
  for (const app of bill_applications) {
    const { data: bill } = await supabase
      .from('bills')
      .select('paid_cents, total_cents')
      .eq('id', app.bill_id)
      .single()

    if (bill) {
      const newPaid = bill.paid_cents + app.applied_cents
      const newStatus = newPaid >= bill.total_cents ? 'paid' : 'partial'
      await supabase
        .from('bills')
        .update({ paid_cents: newPaid, status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', app.bill_id)
    }
  }

  return NextResponse.json({ payment, validation: { valid: true } }, { status: 201 })
}

// GET /api/ap/payments — list vendor payments
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
    .from('bill_payments')
    .select('*, vendor:vendors(id, name)')
    .eq('org_id', roleData.org_id)
    .order('payment_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ payments: data })
}