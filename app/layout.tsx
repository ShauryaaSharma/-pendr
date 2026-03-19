import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ConditionalNavbar } from '@/components/conditional-navbar'

export const metadata: Metadata = {
  title: '$pendr - Sales & Marketing Optimizer',
  description: 'AI-powered marketing campaign optimization and analysis platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ConditionalNavbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
