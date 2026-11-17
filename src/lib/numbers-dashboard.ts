export type NumbersTicket = {
  ticket_code: string
  slot_number: number
  created_at: string
  used_at: string | null
  ticket_orders: {
    id: string
    reference: string
    full_name: string
    email: string
    phone: string
    event_name: string
    event_date: string
    quantity: number
    amount_kobo: number
    paid_at: string | null
    ticket_type: 'entry' | 'cabana_regular' | 'cabana_premium'
    cabana_name: string | null
  }
}

export type NumbersDashboardData = {
  tickets: NumbersTicket[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  summary: {
    sold: number
    scanned: number
    notScanned: number
    regularCabanas: number
    premiumCabanas: number
  }
}

const TICKET_COLUMNS =
  'ticket_code,slot_number,created_at,used_at,ticket_orders!inner(id,reference,full_name,email,phone,event_name,event_date,quantity,amount_kobo,paid_at,ticket_type,cabana_name)'
const PAGE_SIZES = [10, 25, 50, 100]

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) throw new Error('Numbers dashboard database access is not configured.')
  return { url, key }
}

function buildUrl(baseUrl: string, params: URLSearchParams) {
  return `${baseUrl}/rest/v1/tickets?${params.toString()}`
}

async function fetchTicketRows(url: string, key: string, start: number, end: number) {
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=exact',
      Range: `${start}-${end}`,
    },
  })

  if (!response.ok) {
    console.error('Numbers dashboard ticket query failed.', { status: response.status })
    throw new Error('Ticket records could not be loaded.')
  }

  const contentRange = response.headers.get('content-range')
  const totalMatch = contentRange?.match(/\/(\d+)$/)
  if (!totalMatch) {
    console.error('Numbers dashboard ticket query did not return an exact total.')
    throw new Error('Ticket record count could not be confirmed.')
  }
  const tickets = await response.json() as NumbersTicket[]
  return { tickets, total: Number(totalMatch[1]) }
}

async function fetchTicketCount(baseUrl: string, key: string, type?: string, scanned?: boolean) {
  const params = new URLSearchParams({
    select: 'id,ticket_orders!inner(id)',
    'ticket_orders.status': 'eq.paid',
  })
  if (type) params.set('ticket_orders.ticket_type', `eq.${type}`)
  if (scanned !== undefined) params.set('used_at', scanned ? 'not.is.null' : 'is.null')
  const { total } = await fetchTicketRows(buildUrl(baseUrl, params), key, 0, 0)
  return total
}

export async function getNumbersDashboardData(input: {
  page: number
  pageSize: number
  search: string
  eventDate: string
  type: 'all' | 'entry' | 'cabana_regular' | 'cabana_premium'
  scan: 'all' | 'scanned' | 'not-scanned'
}): Promise<NumbersDashboardData> {
  const { url, key } = getSupabaseConfig()
  const params = new URLSearchParams({
    select: TICKET_COLUMNS,
    'ticket_orders.status': 'eq.paid',
    order: 'created_at.desc',
  })

  const search = input.search
    .replace(/[^\p{L}\p{N}@.+ _-]/gu, ' ')
    .trim()
    .slice(0, 80)
  if (search) {
    params.set(
      'ticket_orders.or',
      `(full_name.ilike.*${search}*,email.ilike.*${search}*,phone.ilike.*${search}*,reference.ilike.*${search}*,cabana_name.ilike.*${search}*)`,
    )
  }
  if (input.eventDate) params.set('ticket_orders.event_date', `eq.${input.eventDate}`)
  if (input.type !== 'all') params.set('ticket_orders.ticket_type', `eq.${input.type}`)
  if (input.scan !== 'all') params.set('used_at', input.scan === 'scanned' ? 'not.is.null' : 'is.null')

  const start = (input.page - 1) * input.pageSize
  const [pageResult, sold, scanned, notScanned, regularCabanas, premiumCabanas] = await Promise.all([
    fetchTicketRows(buildUrl(url, params), key, start, start + input.pageSize - 1),
    fetchTicketCount(url, key),
    fetchTicketCount(url, key, undefined, true),
    fetchTicketCount(url, key, undefined, false),
    fetchTicketCount(url, key, 'cabana_regular'),
    fetchTicketCount(url, key, 'cabana_premium'),
  ])
  const totalPages = Math.max(1, Math.ceil(pageResult.total / input.pageSize))

  return {
    tickets: pageResult.tickets,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total: pageResult.total,
      totalPages,
    },
    summary: { sold, scanned, notScanned, regularCabanas, premiumCabanas },
  }
}

export function isValidNumbersDashboardPageSize(value: number): value is (typeof PAGE_SIZES)[number] {
  return PAGE_SIZES.includes(value)
}
