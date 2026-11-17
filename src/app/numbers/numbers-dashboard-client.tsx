'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiDownload,
  FiLock,
  FiLogOut,
  FiRefreshCw,
  FiSearch,
  FiTag,
  FiUsers,
} from 'react-icons/fi'
import { PiArmchair, PiScan } from 'react-icons/pi'
import type { NumbersDashboardData } from '@/lib/numbers-dashboard'

type DashboardFilters = {
  page: number
  pageSize: number
  search: string
  eventDate: string
  type: 'all' | 'entry' | 'cabana_regular' | 'cabana_premium'
  scan: 'all' | 'scanned' | 'not-scanned'
}

const initialFilters: DashboardFilters = {
  page: 1,
  pageSize: 25,
  search: '',
  eventDate: '',
  type: 'all',
  scan: 'all',
}

function formatNaira(amountKobo: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amountKobo / 100)
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Africa/Lagos',
    }).format(date)
}

function ticketTypeLabel(type: string) {
  if (type === 'cabana_regular') return 'Regular cabana'
  if (type === 'cabana_premium') return 'Premium cabana'
  return 'Entry'
}

export default function NumbersDashboardClient() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [passcode, setPasscode] = useState('')
  const [filters, setFilters] = useState(initialFilters)
  const [searchText, setSearchText] = useState('')
  const [data, setData] = useState<NumbersDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/numbers/session', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Could not check the dashboard session.')
        const body = await response.json() as { authenticated?: unknown }
        setAuthenticated(body.authenticated === true)
      })
      .catch(() => setError('Could not check the dashboard session. Refresh and try again.'))
      .finally(() => setCheckingSession(false))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters(current => current.search === searchText ? current : { ...current, search: searchText, page: 1 })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchText])

  const loadData = useCallback(async (signal: AbortSignal) => {
    const params = new URLSearchParams({
      page: String(filters.page),
      pageSize: String(filters.pageSize),
      search: filters.search,
      eventDate: filters.eventDate,
      type: filters.type,
      scan: filters.scan,
    })
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/numbers/data?${params}`, { cache: 'no-store', signal })
      const body = await response.json() as { error?: unknown } & Partial<NumbersDashboardData>
      if (!response.ok) {
        if (response.status === 401) setAuthenticated(false)
        throw new Error(typeof body.error === 'string' ? body.error : 'Dashboard data could not be loaded.')
      }
      if (!Array.isArray(body.tickets) || !body.pagination || !body.summary) {
        throw new Error('Dashboard returned an invalid response.')
      }
      setData(body as NumbersDashboardData)
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === 'AbortError') return
      setError(loadError instanceof Error ? loadError.message : 'Dashboard data could not be loaded.')
    } finally {
      if (!signal.aborted) setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (!authenticated) return
    const controller = new AbortController()
    void loadData(controller.signal)
    return () => controller.abort()
  }, [authenticated, loadData])

  useEffect(() => {
    if (data && filters.page > data.pagination.totalPages) {
      setFilters(current => ({ ...current, page: data.pagination.totalPages }))
    }
  }, [data, filters.page])

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsBusy(true)
    setError('')
    try {
      const response = await fetch('/api/numbers/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: passcode }),
      })
      const body = await response.json() as { error?: unknown }
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Could not sign in.')
      setPasscode('')
      setAuthenticated(true)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Could not sign in.')
    } finally {
      setIsBusy(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/numbers/session', { method: 'DELETE' })
    } finally {
      setAuthenticated(false)
      setData(null)
      setError('')
    }
  }

  const updateFilter = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    setFilters(current => ({ ...current, [key]: value, page: 1 }))
  }

  const pageButtons = useMemo(() => {
    const totalPages = data?.pagination.totalPages ?? 1
    const first = Math.max(1, Math.min(filters.page - 2, totalPages - 4))
    return Array.from({ length: Math.min(5, totalPages) }, (_, index) => first + index)
  }, [data?.pagination.totalPages, filters.page])

  const exportCurrentPage = () => {
    if (!data?.tickets.length) return
    const headings = ['Ticket ID', 'Guest', 'Email', 'Phone', 'Event', 'Event date', 'Ticket type', 'Cabana', 'Amount', 'Scanned at']
    const rows = data.tickets.map(ticket => [
      ticket.ticket_code,
      ticket.ticket_orders.full_name,
      ticket.ticket_orders.email,
      ticket.ticket_orders.phone,
      ticket.ticket_orders.event_name,
      ticket.ticket_orders.event_date,
      ticketTypeLabel(ticket.ticket_orders.ticket_type),
      ticket.ticket_orders.cabana_name || '',
      String(ticket.ticket_orders.amount_kobo / 100),
      ticket.used_at || '',
    ])
    const csv = [headings, ...rows]
      .map(row => row.map(value => {
        const text = String(value)
        const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text
        return `"${safeText.replace(/"/g, '""')}"`
      }).join(','))
      .join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `groove-garden-tickets-page-${filters.page}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const pagination = data?.pagination
  const firstRecord = pagination && pagination.total ? (pagination.page - 1) * pagination.pageSize + 1 : 0
  const lastRecord = pagination ? Math.min(pagination.page * pagination.pageSize, pagination.total) : 0

  return (
    <div className="numbers-page">
      <header className="numbers-topbar">
        <Link className="numbers-brand" href="/" aria-label="Groove Garden home">
          <Image src="/banners/Groove-Garden-PNG-shadow.png" alt="Groove Garden" width={175} height={70} priority />
        </Link>
        <Link href="/" className="numbers-back-link"><FiArrowLeft size={14}/> Back to site</Link>
      </header>

      {checkingSession ? (
        <main className="numbers-main numbers-centered" aria-live="polite">
          <span className="verifier-spinner"/>
          <p>Checking secure dashboard access</p>
        </main>
      ) : !authenticated ? (
        <main className="numbers-main numbers-login-wrap">
          <div className="numbers-eyebrow"><span/> PRIVATE ADMIN AREA</div>
          <h1 className="numbers-title">Sales<br/><em>numbers.</em></h1>
          <p className="numbers-intro">Sign in to review ticket sales, guest details, cabana reservations, and entry scans.</p>
          <form onSubmit={login} className="numbers-login-card">
            <div className="numbers-login-icon"><FiLock size={19}/></div>
            <div><h2>Admin sign in</h2><p>Authorized access only</p></div>
            <label htmlFor="numbers-passcode">Dashboard passcode</label>
            <input
              id="numbers-passcode"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={64}
              required
              value={passcode}
              onChange={event => setPasscode(event.target.value)}
              placeholder="Enter passcode"
            />
            {error && <p role="alert" className="numbers-error">{error}</p>}
            <button type="submit" className="numbers-primary-button" disabled={isBusy}>
              {isBusy ? 'Signing in…' : 'Open dashboard'}
            </button>
            <p className="numbers-secure-note"><FiLock size={12}/> Private server-side session · Expires after 12 hours</p>
          </form>
        </main>
      ) : (
        <main className="numbers-main">
          <section className="numbers-heading">
            <div>
              <div className="numbers-eyebrow"><span/> ADMIN DASHBOARD</div>
              <h1 className="numbers-title">Sales<br/><em>overview.</em></h1>
              <p className="numbers-intro">Paid tickets, cabana reservations, and door check-ins across your events.</p>
            </div>
            <div className="numbers-heading-actions">
              <button type="button" className="numbers-secondary-button" onClick={() => { if (!isLoading) void loadData(new AbortController().signal) }} disabled={isLoading}>
                <FiRefreshCw size={14}/> Refresh
              </button>
              <button type="button" className="numbers-secondary-button" onClick={() => { void logout() }}>
                <FiLogOut size={14}/> Sign out
              </button>
            </div>
          </section>

          <section className="numbers-summary-grid" aria-label="Ticket sales totals">
            <article className="numbers-summary-card">
              <span className="numbers-summary-icon"><FiTag/></span>
              <span className="numbers-summary-label">Tickets sold</span>
              <strong>{data?.summary.sold ?? '—'}</strong>
              <small>Paid tickets issued</small>
            </article>
            <article className="numbers-summary-card">
              <span className="numbers-summary-icon"><PiScan/></span>
              <span className="numbers-summary-label">Scanned in</span>
              <strong>{data?.summary.scanned ?? '—'}</strong>
              <small>{data?.summary.notScanned ?? '—'} not yet scanned</small>
            </article>
            <article className="numbers-summary-card">
              <span className="numbers-summary-icon"><PiArmchair/></span>
              <span className="numbers-summary-label">Regular cabanas</span>
              <strong>{data?.summary.regularCabanas ?? '—'}</strong>
              <small>Paid reservations</small>
            </article>
            <article className="numbers-summary-card">
              <span className="numbers-summary-icon"><FiUsers/></span>
              <span className="numbers-summary-label">Premium cabanas</span>
              <strong>{data?.summary.premiumCabanas ?? '—'}</strong>
              <small>Paid reservations</small>
            </article>
          </section>

          <section className="numbers-records">
            <div className="numbers-records-heading">
              <div>
                <div className="numbers-eyebrow"><span/> GUEST REGISTER</div>
                <h2>Ticket records</h2>
                <p>Each row is one issued ticket. Search by guest, email, phone, reference, or cabana.</p>
              </div>
              <button type="button" className="numbers-secondary-button" onClick={exportCurrentPage} disabled={!data?.tickets.length}>
                <FiDownload size={14}/> Export page
              </button>
            </div>

            <div className="numbers-filters">
              <label className="numbers-search">
                <FiSearch size={16} aria-hidden="true"/>
                <input value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="Search name, email, phone, cabana…" aria-label="Search ticket records"/>
              </label>
              <label>
                <span>Event date</span>
                <input type="date" value={filters.eventDate} onChange={event => updateFilter('eventDate', event.target.value)}/>
              </label>
              <label>
                <span>Ticket type</span>
                <select value={filters.type} onChange={event => updateFilter('type', event.target.value as DashboardFilters['type'])}>
                  <option value="all">All ticket types</option>
                  <option value="entry">Entry tickets</option>
                  <option value="cabana_regular">Regular cabanas</option>
                  <option value="cabana_premium">Premium cabanas</option>
                </select>
              </label>
              <label>
                <span>Gate status</span>
                <select value={filters.scan} onChange={event => updateFilter('scan', event.target.value as DashboardFilters['scan'])}>
                  <option value="all">All tickets</option>
                  <option value="scanned">Scanned in</option>
                  <option value="not-scanned">Not scanned</option>
                </select>
              </label>
              <label>
                <span>Rows per page</span>
                <select value={filters.pageSize} onChange={event => updateFilter('pageSize', Number(event.target.value))}>
                  {[10, 25, 50, 100].map(size => <option key={size} value={size}>{size} rows</option>)}
                </select>
              </label>
            </div>

            {error && <p role="alert" className="numbers-error numbers-data-error">{error}</p>}

            <div className="numbers-table-scroll" aria-busy={isLoading}>
              <table className="numbers-table">
                <thead>
                  <tr>
                    <th>Ticket / event</th>
                    <th>Guest details</th>
                    <th>Type / cabana</th>
                    <th>Purchase</th>
                    <th>Gate scan</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.tickets.map(ticket => {
                    const order = ticket.ticket_orders
                    return (
                      <tr key={ticket.ticket_code}>
                        <td data-label="Ticket / event">
                          <strong className="numbers-ticket-code">{ticket.ticket_code}</strong>
                          <span>{order.event_name}</span>
                          <small>{order.event_date}</small>
                        </td>
                        <td data-label="Guest details">
                          <strong>{order.full_name}</strong>
                          <a href={`mailto:${order.email}`}>{order.email}</a>
                          <a href={`tel:${order.phone}`}>{order.phone}</a>
                        </td>
                        <td data-label="Type / cabana">
                          <span className={`numbers-type-badge ${order.ticket_type}`}>{ticketTypeLabel(order.ticket_type)}</span>
                          {order.cabana_name && <strong className="numbers-cabana-name">{order.cabana_name}</strong>}
                        </td>
                        <td data-label="Purchase">
                          <strong>{formatNaira(order.amount_kobo)}</strong>
                          <span>Paid {formatDateTime(order.paid_at)}</span>
                        </td>
                        <td data-label="Gate scan">
                          <span className={`numbers-scan-badge ${ticket.used_at ? 'scanned' : 'not-scanned'}`}>
                            {ticket.used_at ? 'Scanned' : 'Not scanned'}
                          </span>
                          <span>{formatDateTime(ticket.used_at)}</span>
                        </td>
                      </tr>
                    )
                  })}
                  {!isLoading && !data?.tickets.length && (
                    <tr><td className="numbers-empty" colSpan={5}>No paid ticket records match these filters.</td></tr>
                  )}
                  {isLoading && !data?.tickets.length && (
                    <tr><td className="numbers-empty" colSpan={5}>Loading ticket records…</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="numbers-pagination">
              <p>{firstRecord}–{lastRecord} of {pagination?.total ?? 0} tickets</p>
              <nav aria-label="Ticket records pages">
                <button type="button" aria-label="First page" onClick={() => setFilters(current => ({ ...current, page: 1 }))} disabled={!pagination || filters.page <= 1}><FiChevronsLeft/></button>
                <button type="button" aria-label="Previous page" onClick={() => setFilters(current => ({ ...current, page: Math.max(1, current.page - 1) }))} disabled={!pagination || filters.page <= 1}><FiChevronLeft/></button>
                {pageButtons[0] > 1 && <span aria-hidden="true">…</span>}
                {pageButtons.map(page => (
                  <button key={page} type="button" aria-current={page === filters.page ? 'page' : undefined} onClick={() => setFilters(current => ({ ...current, page }))}>{page}</button>
                ))}
                {pagination && pageButtons[pageButtons.length - 1] < pagination.totalPages && <span aria-hidden="true">…</span>}
                <button type="button" aria-label="Next page" onClick={() => setFilters(current => ({ ...current, page: Math.min(pagination?.totalPages ?? 1, current.page + 1) }))} disabled={!pagination || filters.page >= pagination.totalPages}><FiChevronRight/></button>
                <button type="button" aria-label="Last page" onClick={() => setFilters(current => ({ ...current, page: pagination?.totalPages ?? 1 }))} disabled={!pagination || filters.page >= pagination.totalPages}><FiChevronsRight/></button>
              </nav>
              <p className="numbers-page-count">Page {pagination?.page ?? 1} of {pagination?.totalPages ?? 1}</p>
            </div>
          </section>
          <footer className="numbers-footer"><FiLock size={12}/> Guest data is visible only in this private admin session.<Link href="/ticket-verification">Open ticket verification <FiArrowLeft size={12}/></Link></footer>
        </main>
      )}
    </div>
  )
}
