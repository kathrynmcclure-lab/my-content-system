import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ox & Adder Content Tools',
  description: 'Tone checker and content pipeline for the Ox & Adder style guide',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-brand-gray min-h-screen">{children}</body>
    </html>
  )
}
