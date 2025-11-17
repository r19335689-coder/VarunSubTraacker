import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Subscription Tracker (MVP)',
  description: 'Track and manage your recurring subscription costs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

