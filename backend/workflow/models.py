"""
Workflow models — audit trail for all subject status changes.
"""
from django.db import models
from django.conf import settings


class ApprovalRecord(models.Model):
    ACTION_CHOICES = [
        ('SUBMITTED', 'Submitted to HOD'),
        ('UNDER_REVIEW', 'Marked Under Review'),
        ('REVISION_REQUESTED', 'Revision Requested'),
        ('APPROVED', 'Approved by HOD'),
        ('REJECTED', 'Rejected'),
        ('PUBLISHED', 'Published'),
    ]
    subject  = models.ForeignKey(
        'subjects.Subject', on_delete=models.CASCADE, related_name='approval_records'
    )
    action   = models.CharField(max_length=30, choices=ACTION_CHOICES)
    actor    = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='approval_actions'
    )
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.subject} — {self.action} by {self.actor}"


class SubjectComment(models.Model):
    """HOD can leave inline comments on a subject during review."""
    subject     = models.ForeignKey(
        'subjects.Subject', on_delete=models.CASCADE, related_name='comments'
    )
    author      = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    section     = models.CharField(max_length=50, blank=True)  # e.g. 'objectives', 'unit_2'
    text        = models.TextField()
    is_resolved = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
