import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'cyrillic'],
})

export const metadata = {
  title: 'DGC Налоговый прототип',
  description: 'Цифровой конструктор налоговой отчетности для малого бизнеса в Казахстане',
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta charSet="UTF-8" />
      </head>
      <body className="min-h-full font-sans text-slate-950">{children}</body>
    </html>
  )
}
