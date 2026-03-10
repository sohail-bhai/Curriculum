"""
Document generation Celery tasks.
Heavy PDF generation runs in background workers.
"""
import os
import logging
from celery import shared_task
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def generate_pdf_task(self, subject_id):
    """
    Generate PDF for a subject in the background.
    Saves the file to MEDIA_ROOT/documents/syllabi/ and updates the DB record.
    """
    try:
        from subjects.models import Subject
        from documents.services import generate_syllabus_pdf

        subject = Subject.objects.prefetch_related(
            'objectives', 'units__topics', 'practicals',
            'textbooks', 'references', 'course_outcomes',
            'articulation_rows__co', 'sdg_mappings', 'approval_records',
        ).select_related(
            'assigned_faculty', 'department', 'curriculum_version'
        ).get(pk=subject_id)

        pdf_bytes = generate_syllabus_pdf(subject)

        # Save to disk
        output_dir = settings.DOCUMENTS_OUTPUT_DIR
        os.makedirs(output_dir, exist_ok=True)
        filename = f"{subject.subject_code}_{subject_id}.pdf"
        filepath = os.path.join(output_dir, filename)

        with open(filepath, 'wb') as f:
            f.write(pdf_bytes)

        # Update DB record
        relative_path = os.path.join('documents', 'syllabi', filename)
        subject.document_file = relative_path
        subject.last_document_generated = timezone.now()
        subject.save(update_fields=['document_file', 'last_document_generated'])

        logger.info(f"PDF generated for subject {subject_id}: {filepath}")
        return {
            'status': 'success',
            'subject_id': subject_id,
            'file': relative_path,
            'size_bytes': len(pdf_bytes),
        }

    except Exception as exc:
        logger.error(f"PDF generation failed for subject {subject_id}: {exc}")
        raise self.retry(exc=exc)
