// app/login/page.jsx
export const dynamic = 'force-dynamic' // optional - keep if you need dynamic behavior

import React from 'react'
import LoginClient from './LoginClient'

interface LoginPageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirect =
    typeof searchParams?.redirect === "string"
      ? searchParams.redirect
      : "/"

  return (
    <div>
      <LoginClient redirectTo={redirect} />
    </div>
  )
}