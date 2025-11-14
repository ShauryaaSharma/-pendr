// app/login/page.jsx
export const dynamic = 'force-dynamic' // optional - keep if you need dynamic behavior

import React from 'react'
import LoginClient from './LoginClient'

export default function LoginPage({ searchParams }) {
  // Next provides searchParams as a plain object (or URLSearchParams-like in some versions)
  // Handle both cases safely:
  const redirect =
    (typeof searchParams?.get === 'function' ? searchParams.get('redirect') : searchParams?.redirect) || '/'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Pass redirect to the client component */}
        <LoginClient redirectTo={redirect} />
      </div>
    </div>
  )
}
