'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/shared/DashboardLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { User, Mail, Briefcase, Building2, Hash, Shield, Save, ArrowLeft } from 'lucide-react'

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth/login')
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) return null

  const infoItems = [
    { icon: <Mail size={18} />, label: 'Email', value: user.email },
    { icon: <Shield size={18} />, label: 'Role', value: user.role },
    { icon: <Briefcase size={18} />, label: 'Designation', value: user.designation || '—' },
    { icon: <Building2 size={18} />, label: 'Department', value: user.department_name || '—' },
    { icon: <Hash size={18} />, label: 'Employee ID', value: (user as any).employee_id || '—' },
  ]

  return (
    <DashboardLayout title="Profile" subtitle="Your account information">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user.first_name?.charAt(0)?.toUpperCase()}{user.last_name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
              <p className="text-sm text-gray-500 mt-1">{user.designation || user.role}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {user.role}
                </span>
                {user.department_name && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                    {user.department_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Account Details */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h3>
          <div className="space-y-4">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Back */}
        <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => router.back()}>
          Back to Dashboard
        </Button>
      </div>
    </DashboardLayout>
  )
}
