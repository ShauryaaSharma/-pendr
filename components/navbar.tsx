'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu'
import { 
  Menu, 
  X, 
  Home, 
  BarChart3, 
  Brain, 
  Target, 
  Eye, 
  Star,
  Settings,
  HelpCircle,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/components/Logo'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  const navigationItems = []

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600"
            >
              <Logo size={40} variant="icon" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                $pendr
              </span>
            </Button>
          </div>

          {/* Desktop Navigation - Hidden after landing page */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Navigation items removed - only shown on landing page */}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              /* User Menu */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <User className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <span className="hidden lg:inline">{user.name}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push('/landing')}>
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Auth Buttons */
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/login')}
                  size="sm"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push('/signup')}
                  size="sm"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              {/* Navigation items removed - only shown on landing page */}
              
              {user ? (
                /* Mobile User Actions */
                <div className="pt-4">
                  <div className="flex items-center gap-3 px-3 py-2 mb-4">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <User className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/landing')}
                    className="w-full justify-start flex items-center gap-3 px-3 py-2 text-sm"
                  >
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation('/profile')}
                    className="w-full justify-start flex items-center gap-3 px-3 py-2 text-sm"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={logout}
                    className="w-full justify-start flex items-center gap-3 px-3 py-2 text-sm text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                /* Mobile Auth Actions */
                <div className="pt-4 space-y-2">
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/login')}
                    className="w-full justify-start flex items-center gap-3 px-3 py-2 text-sm"
                  >
                    <User className="h-4 w-4" />
                    Sign In
                  </Button>
                  <Button
                    onClick={() => router.push('/signup')}
                    className="w-full justify-start flex items-center gap-3 px-3 py-2 text-sm"
                  >
                    <User className="h-4 w-4" />
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
