import type { Metadata } from 'next'
import NumbersDashboardClient from './numbers-dashboard-client'

export const metadata: Metadata = {
  title: 'Sales Dashboard | Groove Garden',
  robots: { index: false, follow: false },
}

export default function NumbersPage() {
  return <NumbersDashboardClient />
}
