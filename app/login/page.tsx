// app/login/page.tsx
export const dynamic = 'force-dynamic'

import React from 'react'
import LoginClient from './LoginClient'

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams
}) {
  // Support both shapes: plain object or URLSearchParams
  let redirect = '/'

  if (searchParams) {
    if (typeof (searchParams as URLSearchParams).get === 'function') {
      // URLSearchParams case
      redirect = (searchParams as URLSearchParams).get('redirect') || '/'
    } else {
      // plain object case
      const sp = searchParams as Record<string, string | string[] | undefined>
      const r = sp?.redirect
      redirect = typeof r === 'string' ? r : '/'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginClient redirectTo={redirect} />
      </div>
    </div>
  )
}
