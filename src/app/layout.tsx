import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EVRlock Knowledge Base',
  description:
    'RAG-powered technical assistant for EVRlock OCTG connections by EVRAZ North America',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-ink antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
