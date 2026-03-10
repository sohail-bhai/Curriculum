'use client'
/**
 * HOD Subject Review Interface
 * Side-by-side subject review with commenting and approval controls
 */
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import DashboardLayout from '@/components/shared/DashboardLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/Badge'
import Button from '@/components/ui/Button'
import { Textarea } from '@/components/form'
import {
  MessageCircle,
  Check,
  Eye,
  Send,
  Loader2,
  ChevronLeft,
  Download,
  AlertTriangle,
} from 'lucide-react'
import { subjectsAPI, workflowAPI } from '@/lib/api'
import toast from 'react-hot-toast'

const statusMap: Record<string, string> = {
  PENDING: 'pending', DRAFT: 'draft', SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under-review', REVISION: 'revision',
  APPROVED: 'approved', PUBLISHED: 'published', REJECTED: 'rejected',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Not Started', DRAFT: 'Draft', SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review', REVISION: 'Revision Needed',
  APPROVED: 'Approved', PUBLISHED: 'Published', REJECTED: 'Rejected',
}

export default function HODReviewInterface() {
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const subjectId = parseInt(params?.id as string)

  const [newComment, setNewComment] = useState('')
  const [decision, setDecision] = useState<'approve' | 'revision' | null>(null)

  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth/login')
  }, [isAuthenticated, router])

  // Fetch subject details
  const { data: subject, isLoading } = useQuery({
    queryKey: ['hod-review', subjectId],
    queryFn: () => subjectsAPI.hodDetail(subjectId).then(r => r.data),
    enabled: !!subjectId && isAuthenticated,
  })

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['subject-comments', subjectId],
    queryFn: () => workflowAPI.comments(subjectId).then(r => r.data?.results ?? r.data ?? []),
    enabled: !!subjectId && isAuthenticated,
  })

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (text: string) => workflowAPI.addComment(subjectId, { text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-comments', subjectId] })
      setNewComment('')
      toast.success('Comment added')
    },
    onError: () => toast.error('Failed to add comment'),
  })

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (comments?: string) => subjectsAPI.hodApprove(subjectId, comments),
    onSuccess: () => {
      toast.success('Subject approved!')
      router.push('/hod/dashboard')
    },
    onError: () => toast.error('Failed to approve'),
  })

  // Request revision mutation
  const revisionMutation = useMutation({
    mutationFn: (comments: string) => subjectsAPI.hodRequestRevision(subjectId, comments),
    onSuccess: () => {
      toast.success('Revision requested')
      router.push('/hod/dashboard')
    },
    onError: () => toast.error('Failed to request revision'),
  })

  const handleAddComment = () => {
    if (!newComment.trim()) return
    addCommentMutation.mutate(newComment)
  }

  const handleSubmitDecision = () => {
    if (!decision) return
    if (decision === 'approve') {
      approveMutation.mutate(newComment || undefined)
    } else {
      if (!newComment.trim()) {
        toast.error('Please provide revision comments')
        return
      }
      revisionMutation.mutate(newComment)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await subjectsAPI.downloadPDF(subjectId)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${subject?.subject_code}_syllabus.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch {
      toast.error('PDF generation failed')
    }
  }

  if (!isAuthenticated) return null

  if (isLoading) {
    return (
      <DashboardLayout title="Review Subject">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      </DashboardLayout>
    )
  }

  if (!subject) {
    return (
      <DashboardLayout title="Review Subject">
        <div className="text-center py-16">
          <Eye size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Subject Not Found</h3>
          <Button variant="secondary" onClick={() => router.push('/hod/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const isReviewable = ['SUBMITTED', 'UNDER_REVIEW'].includes(subject.status)
  const isBusy = approveMutation.isPending || revisionMutation.isPending

  return (
    <DashboardLayout
      title="Review Subject"
      breadcrumbs={[
        { label: 'HOD Dashboard', href: '/hod/dashboard' },
        { label: `${subject.subject_code}: ${subject.subject_title}` },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Subject Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header Card */}
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Button variant="secondary" size="sm" onClick={() => router.back()}>
                    <ChevronLeft size={16} />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{subject.subject_code}</h1>
                    <p className="text-gray-600">{subject.subject_title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <span className="text-gray-600">Faculty: <span className="font-medium">{subject.assigned_faculty_name || 'Unassigned'}</span></span>
                  <Badge status={statusMap[subject.status] as any}>
                    {statusLabels[subject.status] || subject.status}
                  </Badge>
                  {subject.submitted_at && (
                    <span className="text-gray-600">Submitted: {new Date(subject.submitted_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <Button variant="secondary" size="sm" icon={<Download size={16} />} onClick={handleDownloadPDF}>
                PDF
              </Button>
            </div>
          </Card>

          {/* Content Sections */}
          <Card>
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Code</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{subject.subject_code}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">Credits</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{subject.credits ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase">LTPSIC</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {[subject.lecture_hours, subject.tutorial_hours, subject.practical_hours, subject.studio_hours, subject.independent_hours, subject.credits].map(v => v ?? 0).join('-')}
                    </p>
                  </div>
                  {subject.pre_requisite && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase">Prerequisites</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{subject.pre_requisite}</p>
                    </div>
                  )}
                  {subject.course_description && (
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-gray-600 uppercase">Description</p>
                      <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{subject.course_description}</p>
                    </div>
                  )}
                </div>
              </div>

              {subject.objectives?.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Objectives</h2>
                  <ul className="space-y-2">
                    {subject.objectives.map((obj: any, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm text-gray-700 pt-0.5">{obj.text || obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {subject.units?.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Units</h2>
                  <div className="space-y-3">
                    {subject.units.map((unit: any, i: number) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-medium text-gray-900">Unit {i + 1}: {unit.title}</p>
                        {unit.topics?.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {unit.topics.map((topic: any, j: number) => (
                              <li key={j} className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="text-xs text-gray-400">{i + 1}.{j + 1}</span>
                                {topic.title || topic}
                                {topic.hours > 0 && <span className="text-xs text-gray-400 ml-auto">{topic.hours}h</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subject.outcomes?.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Outcomes</h2>
                  <ul className="space-y-2">
                    {subject.outcomes.map((outcome: any, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-green-600 font-bold mt-0.5">✓</span>
                        <span className="text-sm text-gray-700">{outcome.text || outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Comments & Decision Panel */}
        <div className="space-y-4">
          {/* Completion Status */}
          <Card>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Completion Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Overall</span>
                  <span className="text-sm font-bold text-blue-600">{subject.completion_percentage ?? 0}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${subject.completion_percentage ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Comments Section */}
          <Card>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MessageCircle size={16} />
                Comments ({comments.length})
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.length === 0 && (
                  <p className="text-xs text-gray-500 italic text-center py-4">No comments yet</p>
                )}
                {comments.map((comment: any) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {(comment.author_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{comment.author_name || 'User'}</p>
                        <p className="text-xs text-gray-500">
                          {comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{comment.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={handleAddComment}
                  loading={addCommentMutation.isPending}
                  icon={<Send size={14} />}
                >
                  Add Comment
                </Button>
              </div>
            </div>
          </Card>

          {/* Decision Panel */}
          {isReviewable && (
          <Card className="p-5 border-2 border-amber-200 bg-amber-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Your Decision</h3>

            <div className="space-y-3">
              {decision && (
                <Textarea
                  placeholder={
                    decision === 'approve'
                      ? 'Add any final notes...'
                      : 'Explain what needs revision...'
                  }
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
              )}

              {!decision ? (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => setDecision('approve')}
                    icon={<Check size={16} />}
                    className="bg-green-600 hover:bg-green-700 active:bg-green-800"
                  >
                    Approve Subject
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => setDecision('revision')}
                    icon={<AlertTriangle size={16} />}
                  >
                    Request Revision
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-lg border border-amber-300">
                    <p className="text-xs font-semibold text-amber-900">
                      {decision === 'approve' ? '✓ Ready to Approve' : '⚠ Request Revision'}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={handleSubmitDecision}
                    loading={isBusy}
                  >
                    Submit Decision
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => {
                      setDecision(null)
                      setNewComment('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </Card>
          )}

          {/* Info Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            📋 Review the subject content carefully and provide constructive feedback to the
            faculty member.
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
