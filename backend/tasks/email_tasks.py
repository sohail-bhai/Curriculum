"""
Email notification Celery tasks.
All email sending is done asynchronously to avoid blocking request threads.
"""
import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def _get_subject(subject_id):
    from subjects.models import Subject
    return Subject.objects.select_related(
        'assigned_faculty', 'department', 'created_by_hod'
    ).get(pk=subject_id)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_faculty_assignment(self, subject_id):
    """
    Fired when HOD assigns a subject to a faculty member.
    Emails the faculty with the assignment details.
    """
    try:
        subject = _get_subject(subject_id)
        faculty = subject.assigned_faculty
        if not faculty or not faculty.email:
            return {'status': 'skipped', 'reason': 'no faculty email'}

        send_mail(
            subject=f'[CurriculumOS] Subject Assigned: {subject.subject_code}',
            message=f"""
Dear {faculty.full_name},

You have been assigned the following subject for syllabus preparation:

Subject Code: {subject.subject_code}
Subject Title: {subject.subject_title}
Department: {subject.department.name}
Assigned by: {subject.created_by_hod.full_name if subject.created_by_hod else 'HOD'}

Please log in to CurriculumOS to begin filling the syllabus:
{settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'}/faculty/subjects/{subject.id}

Regards,
CurriculumOS System
            """.strip(),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[faculty.email],
            fail_silently=False,
        )
        logger.info(f"Assignment notification sent for subject {subject_id} to {faculty.email}")
        return {'status': 'sent', 'recipient': faculty.email}
    except Exception as exc:
        logger.error(f"Failed to send assignment notification for {subject_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_hod_submission(self, subject_id):
    """
    Fired when faculty submits syllabus to HOD.
    Emails the HOD about the new submission.
    """
    try:
        subject = _get_subject(subject_id)
        try:
            hod = subject.department.hod
        except Exception:
            hod = None

        if not hod or not hod.email:
            return {'status': 'skipped', 'reason': 'no HOD email'}

        send_mail(
            subject=f'[CurriculumOS] New Submission: {subject.subject_code}',
            message=f"""
Dear {hod.full_name},

A syllabus has been submitted for your review:

Subject Code: {subject.subject_code}
Subject Title: {subject.subject_title}
Submitted By: {subject.assigned_faculty.full_name if subject.assigned_faculty else 'Faculty'}
Department: {subject.department.name}
Submitted At: {subject.submitted_at}

Please log in to review and approve:
{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/hod/subjects/{subject.id}/review

Regards,
CurriculumOS System
            """.strip(),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[hod.email],
            fail_silently=False,
        )
        logger.info(f"Submission notification sent for subject {subject_id} to HOD {hod.email}")
        return {'status': 'sent', 'recipient': hod.email}
    except Exception as exc:
        logger.error(f"HOD notification failed for subject {subject_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_faculty_approval(self, subject_id):
    """Fired when HOD approves a subject."""
    try:
        subject = _get_subject(subject_id)
        faculty = subject.assigned_faculty
        if not faculty or not faculty.email:
            return {'status': 'skipped'}

        send_mail(
            subject=f'[CurriculumOS] Approved: {subject.subject_code}',
            message=f"""
Dear {faculty.full_name},

Your syllabus has been approved by the HOD.

Subject: {subject.subject_code} — {subject.subject_title}
Status: APPROVED

You can now download the final PDF from CurriculumOS.

Regards,
CurriculumOS System
            """.strip(),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[faculty.email],
            fail_silently=False,
        )
        return {'status': 'sent', 'recipient': faculty.email}
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_faculty_revision(self, subject_id, comments):
    """Fired when HOD requests revision."""
    try:
        subject = _get_subject(subject_id)
        faculty = subject.assigned_faculty
        if not faculty or not faculty.email:
            return {'status': 'skipped'}

        send_mail(
            subject=f'[CurriculumOS] Revision Requested: {subject.subject_code}',
            message=f"""
Dear {faculty.full_name},

The HOD has requested revisions for your syllabus:

Subject: {subject.subject_code} — {subject.subject_title}

HOD Comments:
{comments}

Please log in to make the requested changes and resubmit.

Regards,
CurriculumOS System
            """.strip(),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[faculty.email],
            fail_silently=False,
        )
        return {'status': 'sent', 'recipient': faculty.email}
    except Exception as exc:
        raise self.retry(exc=exc)
