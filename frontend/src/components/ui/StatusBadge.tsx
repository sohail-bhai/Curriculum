const STATUS: Record<string, string> = {
  PENDING:      'pending',
  DRAFT:        'draft',
  SUBMITTED:    'submitted',
  UNDER_REVIEW: 'under_review',
  REVISION:     'revision',
  APPROVED:     'approved',
  PUBLISHED:    'approved',
  REJECTED:     'rejected',
}

const LABELS: Record<string, string> = {
  PENDING:      'Pending',
  DRAFT:        'Draft',
  SUBMITTED:    'Submitted',
  UNDER_REVIEW: 'Under Review',
  REVISION:     'Revision',
  APPROVED:     'Approved',
  PUBLISHED:    'Published',
  REJECTED:     'Rejected',
}

export default function StatusBadge({ status }: { status: string }) {
  const key = STATUS[status] ?? 'pending'
  return (
    <span className={`pill pill-${key}`}>
      {LABELS[status] ?? status}
    </span>
  )
}
