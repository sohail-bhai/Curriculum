'use client'
/**
 * Modern Sidebar Navigation
 * Compact, clean, role-aware navigation menu
 */
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { ChevronDown, LogOut, Settings, Menu, X } from 'lucide-react'

const NAV_ITEMS = {
  FACULTY: [
    { icon: '📚', label: 'My Subjects', href: '/faculty/dashboard' },
  ],
  HOD: [
    { icon: '📊', label: 'Department', href: '/hod/dashboard' },
  ],
  ADMIN: [
    { icon: '📊', label: 'Dashboard', href: '/faculty/dashboard' },
  ],
  ACADEMIC: [
    { icon: '📊', label: 'Dashboard', href: '/faculty/dashboard' },
  ],
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const userRole = user?.role as keyof typeof NAV_ITEMS
  const navItems = NAV_ITEMS[userRole] || NAV_ITEMS.FACULTY

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const NavItem = ({ href, icon, label }: { href: string; icon: string; label: string }) => {
    const isActive = pathname === href || pathname.startsWith(href)
    return (
      <Link href={href}>
        <button
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 text-sm font-medium
            ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          <span className="text-lg">{icon}</span>
          <span>{label}</span>
        </button>
      </Link>
    )
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 p-2 hover:bg-gray-200 rounded-lg transition bg-white shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
              CO
            </div>
            <div>
              <p className="font-bold text-sm">CurriculumOS</p>
              <p className="text-xs text-gray-500">v2.1</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-3 tracking-wider">Navigation</p>
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4 space-y-2">
          {/* User Profile */}
          <div
            className="relative flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.first_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.first_name}</p>
              <p className="text-xs text-gray-600 truncate">{user?.role}</p>
            </div>
            <ChevronDown size={16} className="text-gray-600" />
          </div>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
              <Link href="/profile">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-200 transition text-gray-700">
                  <Settings size={16} />
                  Profile Settings
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 transition text-red-600 font-medium border-t border-gray-200"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}

          {/* Department Info */}
          <div className="text-xs text-gray-600 px-3 py-2 bg-gray-50 rounded-lg">
            <p className="font-semibold">{user?.department_name}</p>
            <p>{user?.designation}</p>
          </div>
        </div>
      </div>

      {/* Spacer for fixed sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0" />
    </>
  )
}
