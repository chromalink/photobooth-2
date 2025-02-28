import './globals.css'
import { Aboreto, Arapey, Inter, Work_Sans, Michroma, B612_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const aboreto = Aboreto({ 
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-aboreto'
})

const arapey = Arapey({ 
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-arapey'
})

const workSans = Work_Sans({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-work-sans'
})

const michroma = Michroma({ 
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-michroma'
})

const b612Mono = B612_Mono({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-b612-mono'
})

export const metadata = {
  title: 'Face Audit™',
  description: 'The future of professional expression',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${michroma.variable} ${b612Mono.variable} ${aboreto.variable} ${arapey.variable} ${workSans.variable} ${inter.className}`}>
      <body>{children}</body>
    </html>
  )
}
