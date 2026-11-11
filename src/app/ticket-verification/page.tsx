import type { Metadata } from 'next'
import TicketVerificationClient from './ticket-verification-client'

export const metadata: Metadata = {
  title: 'Ticket Verification | Groove Garden',
  robots: { index: false, follow: false },
}

export default function TicketVerificationPage() {
  return <TicketVerificationClient />
}
