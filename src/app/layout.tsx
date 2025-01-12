import type { Metadata } from 'next'
import './globals.css'
import 'uikit/dist/css/uikit.min.css'
import { config } from '@/config'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: config.app.name,
  description: 'Discover your natural state of being through AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          body {
            background: linear-gradient(to top, #000000, #1a1a1a);
            color: white;
            margin: 0;
            min-height: 100vh;
          }
        `}</style>
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
