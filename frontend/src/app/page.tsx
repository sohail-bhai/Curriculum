'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function RootPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Small delay to let Zustand hydrate from localStorage
    const timer = setTimeout(() => setReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!ready) return
    const { isAuthenticated, user } = useAuthStore.getState()
    if (isAuthenticated && user?.role === 'FACULTY') {
      router.replace('/faculty/dashboard')
    } else if (isAuthenticated && user?.role === 'HOD') {
      router.replace('/hod/dashboard')
    } else {
      router.replace('/auth/login')
    }
  }, [ready, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1f3c]">
      <div className="text-white text-sm opacity-60">Loading CurriculumOS...</div>
    </div>
  )
}
