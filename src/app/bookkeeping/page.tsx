'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'

type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

const TYPE_COLORS: Record<AccountType, string> = {
  asset: '#3b82f6',
  liability: '#f59e0b',
  equity: '#8b5cf6',
  revenue: '#10b981',
  expense: '#ef4444',
}

const TYPE_LABELS: Record<AccountType, string> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expense',
}

export default function BookkeepingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'accounts' | 'journal' | 'reports'>('accounts')
  const [accounts, setAccounts] = useState<any[]>([])
  const [journalEntries, setJournalEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push('/auth/signin'); return }
    fetchData()
  }, [session, status])

  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const [accRes, jeRes] = await Promise.all([
        fetch('/api/bookkeeping/accounts'),
        fetch('/api/bookkeeping/journal-entries'),
      ])
      if (accRes.ok) {
        const d = await accRes.json()
        setAccounts(d.accounts || [])
      }
      if (jeRes.ok) {
        const d = await jeRes.json()
        setJournalEntries(d.journal_entries || [])
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const totalByType = (type: AccountType) =>
    accounts.filter(a => a.type === type).length

  const totals = {
    assets: totalByType('asset'),
    liabilities: totalByType('liability'),
    equity: totalByType('equity'),
    revenue: totalByType('revenue'),
    expenses: totalByType('expense'),
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
      <Header />

      {/* Page Header */}
      <div style={{ padding: '24px 32px 0', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: '#fff', margin: 0 }}>Bookkeeping</h1>
            <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>Chart of accounts, journal entries, and financial reports</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {(['accounts', 'journal', 'reports'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #c9a84c' : '2px solid transparent',
                color: activeTab === tab ? '#c9a84c' : '#888',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'color 0.15s',
              }}
            >
              {tab === 'accounts' ? 'Chart of Accounts' : tab === 'journal' ? 'Journal Entries' : 'Reports'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24, maxWidth: 1200 }}>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* CHART OF ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
              {(Object.keys(TYPE_LABELS) as AccountType[]).map(type => (
                <div key={type} style={{ background: '#1a1a1a', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: TYPE_COLORS[type] }}>{totals[type]}</div>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{TYPE_LABELS[type]}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>#</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Account</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Type</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Subtype</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px 16px', textAlign: 'center', color: '#666', fontSize: 13 }}>
                        No accounts yet. Run the bookkeeping migration in Supabase to seed the chart of accounts.
                      </td>
                    </tr>
                  )}
                  {accounts.map(account => (
                    <tr key={account.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'monospace', color: '#888' }}>{account.account_number}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#fff' }}>{account.name}</div>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: `${TYPE_COLORS[account.type as AccountType]}20`, color: TYPE_COLORS[account.type as AccountType], fontWeight: 600 }}>
                          {TYPE_LABELS[account.type as AccountType] || account.type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#888', textTransform: 'capitalize' }}>{account.subtype || '—'}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12 }}>
                        <span style={{ color: account.is_active ? '#10b981' : '#ef4444', fontSize: 11 }}>{account.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* JOURNAL ENTRIES */}
        {activeTab === 'journal' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button
                onClick={() => alert('Journal entry form — coming next')}
                style={{ background: '#c9a84c', color: '#0a0a0a', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                + New Journal Entry
              </button>
            </div>
            <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>JE#</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Date</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Description</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Status</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Debit Total</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Credit Total</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntries.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#666', fontSize: 13 }}>
                        No journal entries yet.
                      </td>
                    </tr>
                  )}
                  {journalEntries.map(entry => {
                    const lines = entry.lines || []
                    const totalDebit = lines.reduce((s: number, l: any) => s + parseFloat(l.debit || 0), 0)
                    const totalCredit = lines.reduce((s: number, l: any) => s + parseFloat(l.credit || 0), 0)
                    return (
                      <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'monospace', color: '#c9a84c' }}>{entry.entry_number}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: '#fff' }}>{entry.date}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: '#fff', maxWidth: 300 }}>{entry.description}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 4,
                            background: entry.status === 'posted' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                            color: entry.status === 'posted' ? '#10b981' : '#f59e0b', fontWeight: 600,
                          }}>
                            {entry.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: '#3b82f6', textAlign: 'right', fontFamily: 'monospace' }}>${totalDebit.toFixed(2)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: '#ef4444', textAlign: 'right', fontFamily: 'monospace' }}>${totalCredit.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORTS */}
        {activeTab === 'reports' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { name: 'Trial Balance', href: '/api/bookkeeping/reports?report=trial_balance' },
                { name: 'P&L Statement', href: '#', disabled: true },
                { name: 'Balance Sheet', href: '#', disabled: true },
              ].map(report => (
                <a
                  key={report.name}
                  href={report.href}
                  style={{
                    background: report.disabled ? '#1a1a1a80' : '#1a1a1a',
                    border: '1px solid rgba(201,168,76,0.2)',
                    borderRadius: 8,
                    padding: '20px 24px',
                    textDecoration: 'none',
                    color: report.disabled ? '#555' : '#c9a84c',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: report.disabled ? 'not-allowed' : 'pointer',
                    display: 'block',
                  }}
                >
                  {report.name} →
                </a>
              ))}
            </div>
            <p style={{ color: '#666', fontSize: 13 }}>
              More reports (AR Aging, AP Aging, Cash Flow) coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
