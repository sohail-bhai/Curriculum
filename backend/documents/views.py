"""
Document generation views.
PDF is generated synchronously for small subjects,
or dispatched to Celery for larger ones.
"""
import os
from django.http import HttpResponse, FileResponse
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied

from subjects.models import Subject
from .services import generate_syllabus_pdf


def _check_subject_access(request, pk):
    subject = get_object_or_404(
        Subject.objects.prefetch_related(
            'objectives', 'units__topics', 'practicals',
            'textbooks', 'references', 'course_outcomes',
            'articulation_rows__co', 'sdg_mappings', 'approval_records',
        ).select_related('assigned_faculty', 'department', 'curriculum_version'),
        pk=pk
    )
    user = request.user
    if user.is_faculty() and subject.assigned_faculty != user:
        raise PermissionDenied("Access denied.")
    if user.is_hod() and subject.department != user.department:
        raise PermissionDenied("Access denied.")
    return subject


class GeneratePDFView(APIView):
    """
    GET /api/v1/subjects/<id>/document/
    Generate and stream PDF document for a subject.
    Available before and after approval.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        subject = _check_subject_access(request, pk)

        try:
            pdf_bytes = generate_syllabus_pdf(subject)
        except Exception as e:
            return Response(
                {'detail': f'PDF generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        filename = f"{subject.subject_code}_{subject.subject_title.replace(' ', '_')}.pdf"

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Content-Length'] = len(pdf_bytes)

        # Update last generated timestamp
        subject.last_document_generated = timezone.now()
        subject.save(update_fields=['last_document_generated'])

        return response


class GeneratePDFAsyncView(APIView):
    """
    POST /api/v1/subjects/<id>/document/async/
    Queue PDF generation as a background Celery task.
    Returns task ID to poll for completion.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        subject = _check_subject_access(request, pk)
        from tasks.document_tasks import generate_pdf_task
        task = generate_pdf_task.delay(subject.id)
        return Response({
            'task_id': task.id,
            'message': 'PDF generation queued. Poll /api/v1/tasks/{task_id}/ for status.',
        }, status=status.HTTP_202_ACCEPTED)


class TaskStatusView(APIView):
    """GET /api/v1/tasks/<task_id>/ — poll Celery task status."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, task_id):
        from celery.result import AsyncResult
        result = AsyncResult(task_id)
        data = {
            'task_id': task_id,
            'status': result.status,
            'ready': result.ready(),
        }
        if result.ready():
            if result.successful():
                data['result'] = result.result
            else:
                data['error'] = str(result.result)
        return Response(data)


# urls.py for documents app
from django.urls import path

urlpatterns = [
    path('subjects/<int:pk>/document/', GeneratePDFView.as_view(), name='generate-pdf'),
    path('subjects/<int:pk>/document/async/', GeneratePDFAsyncView.as_view(), name='generate-pdf-async'),
    path('tasks/<str:task_id>/', TaskStatusView.as_view(), name='task-status'),
]
