'use client'
/**
 * Navbar Component
 * Fixed-top navigation bar with breadcrumbs, search, notifications, and user menu
 */
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import {
  Search,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'

interface Breadcrumb {
  label: string
  href?: string
}

interface NavbarProps {
  breadcrumbs?: Breadcrumb[]
  title?: string
  rightSection?: React.ReactNode
  showSearch?: boolean
  notificationCount?: number
}

export default function Navbar({
  breadcrumbs = [],
  title,
  rightSection,
  showSearch = true,
  notificationCount = 0,
}: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Generate breadcrumbs from pathname if not provided
  const generateBreadcrumbs = () => {
    if (breadcrumbs.length > 0) return breadcrumbs

    const segments = pathname.split('/').filter(Boolean)
    const generated: Breadcrumb[] = []

    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/')
      const label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      generated.push({ label, href })
    })

    return generated
  }

  const displayBreadcrumbs = generateBreadcrumbs()

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search functionality
    console.log('Search for:', searchQuery)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 md:ml-64 flex items-center px-6 gap-4">
      {/* Left: Breadcrumbs */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hidden">
        {displayBreadcrumbs.length > 0 ? (
          displayBreadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-1 whitespace-nowrap">
              {index > 0 && <ChevronRight size={16} className="text-gray-400" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-sm font-medium text-gray-900">
                  {crumb.label}
                </span>
              )}
            </div>
          ))
        ) : (
          <span className="text-sm text-gray-500">Dashboard</span>
        )}
      </div>

      {/* Center: Title (optional) */}
      {title && (
        <h1 className="hidden lg:block text-lg font-semibold text-gray-900 flex-shrink-0">
          {title}
        </h1>
      )}

      {/* Right: Search Bar */}
      {showSearch && (
        <form
          onSubmit={handleSearch}
          className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-shrink-0"
        >
          <Search size={16} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm font-medium outline-none w-32 placeholder:text-gray-500"
          />
        </form>
      )}

      {/* Right: Notifications */}
      <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
        <Bell size={20} className="text-gray-700" />
        {notificationCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {notificationCount}
          </span>
        )}
      </button>

      {/* Right: User Menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="hidden sm:inline text-sm font-medium text-gray-700">
            {user?.first_name || 'User'}
          </span>
          <ChevronDown size={16} className="text-gray-600" />
        </button>

        {/* User Dropdown Menu */}
        {showUserMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-600">{user?.role}</p>
              {user?.department_name && (
                <p className="text-xs text-gray-600 mt-1">{user.department_name}</p>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <Link href="/profile">
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  <Settings size={16} />
                  Profile Settings
                </button>
              </Link>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-200 py-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Overlay to close menu */}
        {showUserMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </div>

      {/* Custom right section */}
      {rightSection && <div className="flex-shrink-0">{rightSection}</div>}
    </nav>
  )
}
