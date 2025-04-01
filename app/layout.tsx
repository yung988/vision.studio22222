import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vision Studio',
  description: 'Pomáháme značkám vytvářet digitální zážitky, které propojují s jejich publikem',
  generator: 'Vision Studio',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  )
}
