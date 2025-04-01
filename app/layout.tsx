import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vision Stars',
  description: 'Vision Stars 3D interaktivní scéna',
  generator: 'next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="cs">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  )
}
