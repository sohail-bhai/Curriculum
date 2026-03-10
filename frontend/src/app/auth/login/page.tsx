'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    try {
      await login(email, password)
      const { user } = useAuthStore.getState()
      if (user?.role === 'FACULTY') router.push('/faculty/dashboard')
      else if (user?.role === 'HOD') router.push('/hod/dashboard')
      else router.push('/')
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'Invalid credentials'
      toast.error(msg)
    }
  }

  const DEMO_ACCOUNTS = [
    { label: 'HOD', email: 'hod_cse@univ.edu', password: 'HOD123!' },
    { label: 'Faculty', email: 'faculty1@univ.edu', password: 'Fac123!' },
  ]

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMDMiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOFYwaDM2djE4eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50 pointer-events-none" />

      {/* ── Left Panel: Branding & Hero ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white border-r border-white/10 relative">
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">CurriculumOS</h1>
            <p className="text-xs text-white/60">Platform v2.1</p>
          </div>
        </div>

        {/* Hero Content */}
        <div>
          <h2 className="text-5xl font-bold leading-tight mb-6">
            University<br />Curriculum<br />Platform
          </h2>
          <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
            Streamlined syllabus authoring, faculty assignment, and HOD approval — all in one unified institutional workflow.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '📝', label: 'Faculty Workflow', desc: 'Structured syllabus authoring' },
              { icon: '✅', label: 'HOD Review', desc: 'Approval & feedback loop' },
              { icon: '📄', label: 'PDF Export', desc: 'One-click formatted output' },
              { icon: '📊', label: 'Articulation Matrix', desc: 'CO-PO-PSO mapping' },
            ].map((feature) => (
              <div key={feature.label} className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{feature.icon}</span>
                  <span className="text-sm font-semibold">{feature.label}</span>
                </div>
                <p className="text-xs text-white/50">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-white/40">© {new Date().getFullYear()} CurriculumOS • All rights reserved</p>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">CurriculumOS</h1>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">
            {/* Accent gradient line */}
            <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-amber-500" />

            {/* Header */}
            <div className="px-8 pt-8 pb-2">
              <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
              <p className="text-sm text-gray-600 mt-1">Access your curriculum dashboard</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8 space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="professor@university.edu"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  autoFocus
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                loading={isLoading}
                fullWidth
                size="lg"
                className="mt-2 w-full"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="px-8 py-6 bg-gray-50/80 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Login
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => fillDemo(demo.email, demo.password)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-gray-700 font-medium shadow-sm"
                  >
                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {demo.label[0]}
                    </span>
                    <span className="text-left">
                      <span className="block text-xs font-semibold">{demo.label}</span>
                      <span className="block text-[10px] text-gray-400">{demo.email}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-white/60 mt-6">
            Only authorized institutional users can access this platform
          </p>
        </div>
      </div>
    </div>
  )
}
