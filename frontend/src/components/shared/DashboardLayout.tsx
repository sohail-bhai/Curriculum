'use client'
import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

interface Props {
  children: ReactNode
  title?: string
  subtitle?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  requiredRole?: string
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  breadcrumbs,
  requiredRole,
}: Props) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login')
      return
    }
    if (requiredRole && user?.role !== requiredRole) {
      router.replace('/')
    }
  }, [isAuthenticated, user, requiredRole, router])

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="md:ml-64">
        {/* Fixed Navbar */}
        <Navbar breadcrumbs={breadcrumbs} title={title} />

        {/* Page Content */}
        <main className="pt-16 px-6 py-8">
          {(title || subtitle) && (
            <div className="mb-6">
              {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
