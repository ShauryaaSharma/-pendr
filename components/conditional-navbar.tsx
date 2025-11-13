'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { LandingNavbar } from '@/components/landing-navbar'

export function ConditionalNavbar() {
  const pathname = usePathname()

  // Show landing navbar for landing page and auth pages
  if (pathname === '/landing' || pathname === '/login' || pathname === '/signup') {
    return <LandingNavbar />
  }

  // Show regular navbar for all other pages
  return <Navbar />
}

//Made by Mayank Goyal
