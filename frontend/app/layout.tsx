import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CI/CD Pipeline Wizard',
  description: 'Generate CI/CD pipeline configurations with AI',
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
