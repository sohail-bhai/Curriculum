'use client'
/**
 * Faculty Dashboard  
 * Task-focused overview of assigned subjects
 */
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { subjectsAPI } from '@/lib/api'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/Badge'
import DashboardLayout from '@/components/shared/DashboardLayout'
import { BookOpen, Loader2, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FacultyDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  // Fetch faculty subjects
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['faculty-subjects'],
    queryFn: () => subjectsAPI.facultyList().then((r) => r.data.results || r.data),
  })

  // Categorize subjects
  const actionItems = subjects.filter((s: any) =>
    ['REVISION', 'PENDING'].includes(s.status)
  )
  const inProgress = subjects.filter((s: any) => s.status === 'DRAFT')
  const completed = subjects.filter((s: any) =>
    ['APPROVED', 'PUBLISHED'].includes(s.status)
  )

  // Status icon and color mapping
  const statusConfig = {
    PENDING: { icon: '⏳', color: 'pending', label: 'Not Started' },
    DRAFT: { icon: '✏️', color: 'draft', label: 'In Progress' },
    SUBMITTED: { icon: '📤', color: 'submitted', label: 'Submitted' },
    UNDER_REVIEW: { icon: '🔍', color: 'under-review', label: 'Under Review' },
    REVISION: { icon: '🔄', color: 'revision', label: 'Revision Needed' },
    APPROVED: { icon: '✅', color: 'approved', label: 'Approved' },
    PUBLISHED: { icon: '📄', color: 'published', label: 'Published' },
  }

  const SubjectCard = ({ subject }: { subject: any }) => {
    const config = (statusConfig as any)[subject.status] || { icon: '❓', color: 'draft' }

    return (
      <Card
        variant="interactive"
        onClick={() => router.push(`/faculty/subjects/${subject.id}`)}
        className="group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{config.icon}</span>
              <Badge status={subject.status as any}>{config.label}</Badge>
            </div>
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition">
              {subject.subject_code}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{subject.subject_title}</p>
          </div>
        </div>

        {/* Completion Progress */}
        {subject.completion_percentage !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-700">Progress</span>
              <span className="text-xs font-bold text-blue-600">{subject.completion_percentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${subject.completion_percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Last updated {new Date(subject.updated_at).toLocaleDateString()}
          </span>
          <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition" />
        </div>
      </Card>
    )
  }

  return (
    <DashboardLayout title="My Curriculum Subjects" subtitle={`Welcome, ${user?.full_name}`}>
      <div className="max-w-6xl mx-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}

        {!isLoading && subjects.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Subjects Assigned</h3>
            <p className="text-gray-600 mb-6">
              Your department HOD hasn't assigned any subjects to you yet.
            </p>
            <Button variant="secondary">Contact Your HOD</Button>
          </div>
        )}

        {!isLoading && subjects.length > 0 && (
          <>
            {/* Action Items Section */}
            {actionItems.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle size={20} className="text-amber-600" />
                  <h2 className="text-lg font-bold text-gray-900">Action Required ({actionItems.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {actionItems.map((subject: any) => (
                    <SubjectCard key={subject.id} subject={subject} />
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Section */}
            {inProgress.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={20} className="text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">In Progress ({inProgress.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProgress.map((subject: any) => (
                    <SubjectCard key={subject.id} subject={subject} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Section */}
            {completed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={20} className="text-green-600" />
                  <h2 className="text-lg font-bold text-gray-900">Completed ({completed.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completed.map((subject: any) => (
                    <SubjectCard key={subject.id} subject={subject} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
