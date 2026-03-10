"""
Subject views — implements the full subject lifecycle:
HOD creates/assigns → Faculty fills modules → Faculty submits → HOD reviews
"""
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Subject, SubjectStatus, Unit, CourseOutcome, ArticulationMatrix
)
from .serializers import (
    SubjectListSerializer, SubjectDetailSerializer, SubjectCreateSerializer,
    SubjectFullSerializer,
    Module1Serializer, Module2Serializer, Module3Serializer,
    Module4Serializer, Module5Serializer, Module6Serializer,
    ObjectiveSerializer, UnitSerializer, PracticalSerializer,
    TextbookSerializer, ReferenceSerializer, CourseOutcomeSerializer,
    ArticulationMatrixSerializer, SDGMappingSerializer, SMEDetailSerializer,
)
from accounts.permissions import IsHOD, IsFaculty, IsHODOrAbove


def get_subject_for_faculty(request, pk):
    """Returns subject only if it belongs to the requesting faculty."""
    subject = get_object_or_404(Subject, pk=pk)
    if subject.assigned_faculty != request.user:
        raise PermissionDenied("This subject is not assigned to you.")
    return subject


def get_subject_for_hod(request, pk):
    """Returns subject only if it belongs to the HOD's department."""
    subject = get_object_or_404(Subject, pk=pk)
    if subject.department != request.user.department:
        raise PermissionDenied("This subject is not in your department.")
    return subject


# ── HOD: Subject Management ────────────────────────────────────────

class HODSubjectListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/subjects/hod/        — HOD lists all subjects in their dept
    POST /api/v1/subjects/hod/        — HOD creates subject and assigns to faculty
    """
    permission_classes = [IsHOD]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SubjectCreateSerializer
        return SubjectListSerializer

    def get_queryset(self):
        return Subject.objects.filter(
            department=self.request.user.department
        ).select_related(
            'assigned_faculty', 'department', 'curriculum_version'
        ).order_by('-updated_at')

    def perform_create(self, serializer):
        from tasks.email_tasks import notify_faculty_assignment
        subject = serializer.save()
        # Fire background task to email the faculty
        notify_faculty_assignment.delay(subject.id)


class HODSubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/subjects/hod/<id>/  — full subject detail
    PATCH  /api/v1/subjects/hod/<id>/  — update code/title/assignment
    DELETE /api/v1/subjects/hod/<id>/  — delete (only PENDING subjects)
    """
    permission_classes = [IsHOD]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return SubjectCreateSerializer
        return SubjectDetailSerializer

    def get_object(self):
        return get_subject_for_hod(self.request, self.kwargs['pk'])

    def destroy(self, request, *args, **kwargs):
        subject = self.get_object()
        if subject.status != SubjectStatus.PENDING:
            return Response(
                {'detail': 'Only PENDING subjects can be deleted.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        subject.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class HODReassignView(APIView):
    """POST /api/v1/subjects/hod/<id>/reassign/ — reassign to different faculty."""
    permission_classes = [IsHOD]

    def post(self, request, pk):
        subject = get_subject_for_hod(request, pk)
        faculty_id = request.data.get('faculty_id')
        if not faculty_id:
            return Response({'detail': 'faculty_id required.'}, status=400)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        faculty = get_object_or_404(User, pk=faculty_id, role='FACULTY')
        if faculty.department != subject.department:
            return Response(
                {'detail': 'Faculty not in subject department.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        subject.assigned_faculty = faculty
        subject.assigned_at = timezone.now()
        subject.save(update_fields=['assigned_faculty', 'assigned_at'])
        return Response(SubjectDetailSerializer(subject).data)


# ── Faculty: Subject Dashboard ────────────────────────────────────

class FacultySubjectListView(generics.ListAPIView):
    """
    GET /api/v1/subjects/faculty/
    Returns all subjects assigned to the requesting faculty.
    """
    permission_classes = [IsFaculty]
    serializer_class = SubjectListSerializer

    def get_queryset(self):
        qs = Subject.objects.filter(
            assigned_faculty=self.request.user
        ).select_related('department', 'curriculum_version')
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.order_by('-updated_at')


class FacultySubjectDetailView(generics.RetrieveAPIView):
    """GET /api/v1/subjects/faculty/<id>/ — full detail for editor."""
    permission_classes = [IsFaculty]
    serializer_class = SubjectDetailSerializer

    def get_object(self):
        return get_subject_for_faculty(self.request, self.kwargs['pk'])


# ── Faculty: Module Saves ─────────────────────────────────────────

class BaseModuleSaveView(APIView):
    """
    Base class for all module save endpoints.
    Validates faculty ownership and subject editability.
    """
    permission_classes = [IsFaculty]
    serializer_class = None

    def get_subject(self, pk):
        subject = get_subject_for_faculty(self.request, pk)
        if not subject.is_editable_by_faculty:
            raise PermissionDenied(
                f"Subject with status '{subject.status}' cannot be edited."
            )
        return subject

    def post(self, request, pk):
        subject = self.get_subject(pk)
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(subject=subject)
        return Response(
            {'success': True, 'message': 'Saved successfully.'},
            status=status.HTTP_200_OK
        )


class Module1SaveView(APIView):
    """POST /api/v1/subjects/<id>/module/1/ — Basic Information"""
    permission_classes = [IsFaculty]

    def post(self, request, pk):
        subject = get_subject_for_faculty(request, pk)
        if not subject.is_editable_by_faculty:
            raise PermissionDenied("Subject is not editable.")
        serializer = Module1Serializer(subject, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'success': True, 'status': subject.status})


class Module2SaveView(BaseModuleSaveView):
    """POST /api/v1/subjects/<id>/module/2/ — Course Objectives"""
    serializer_class = Module2Serializer


class Module3SaveView(BaseModuleSaveView):
    """POST /api/v1/subjects/<id>/module/3/ — Units, Topics, Practicals"""
    serializer_class = Module3Serializer


class Module4SaveView(BaseModuleSaveView):
    """POST /api/v1/subjects/<id>/module/4/ — Textbooks, References"""
    serializer_class = Module4Serializer


class Module5SaveView(BaseModuleSaveView):
    """POST /api/v1/subjects/<id>/module/5/ — Course Outcomes + Matrix"""
    serializer_class = Module5Serializer


class Module6SaveView(BaseModuleSaveView):
    """POST /api/v1/subjects/<id>/module/6/ — SDG Mapping + SME Details"""
    serializer_class = Module6Serializer


# ── Module Data Retrieval ─────────────────────────────────────────

class SubjectModuleDataView(APIView):
    """
    GET /api/v1/subjects/<id>/module/<module_num>/data/
    Returns the current saved data for a specific module.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk):
        subject = get_object_or_404(Subject, pk=pk)
        user = self.request.user
        if user.is_faculty() and subject.assigned_faculty != user:
            raise PermissionDenied()
        if user.is_hod() and subject.department != user.department:
            raise PermissionDenied()
        return subject

    def get(self, request, pk, module_num):
        subject = self.get_object(pk)
        module_num = int(module_num)

        if module_num == 1:
            data = Module1Serializer(subject).data
        elif module_num == 2:
            data = {'objectives': ObjectiveSerializer(subject.objectives.all(), many=True).data}
        elif module_num == 3:
            data = {
                'units': UnitSerializer(subject.units.prefetch_related('topics').all(), many=True).data,
                'practicals': PracticalSerializer(subject.practicals.all(), many=True).data,
            }
        elif module_num == 4:
            data = {
                'textbooks': TextbookSerializer(subject.textbooks.all(), many=True).data,
                'references': ReferenceSerializer(subject.references.all(), many=True).data,
            }
        elif module_num == 5:
            data = {
                'outcomes': CourseOutcomeSerializer(subject.course_outcomes.all(), many=True).data,
                'matrix': ArticulationMatrixSerializer(
                    subject.articulation_rows.select_related('co').all(), many=True
                ).data,
            }
        elif module_num == 6:
            data = {
                'sdg_mappings': SDGMappingSerializer(subject.sdg_mappings.all(), many=True).data,
                'sdg_justification': subject.sdg_justification,
                'sme': SMEDetailSerializer(getattr(subject, 'sme_detail', None)).data
                        if hasattr(subject, 'sme_detail') else None,
            }
        else:
            return Response({'detail': 'Invalid module number.'}, status=400)

        return Response(data)


# ── Submission Workflow ────────────────────────────────────────────

class SubmitToHODView(APIView):
    """POST /api/v1/subjects/<id>/submit/ — faculty submits to HOD."""
    permission_classes = [IsFaculty]

    def post(self, request, pk):
        subject = get_subject_for_faculty(request, pk)
        if subject.status not in (SubjectStatus.DRAFT, SubjectStatus.REVISION):
            return Response(
                {'detail': f"Cannot submit from status '{subject.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        subject.status = SubjectStatus.SUBMITTED
        subject.submitted_at = timezone.now()
        subject.save(update_fields=['status', 'submitted_at', 'updated_at'])

        # Fire background task
        from tasks.email_tasks import notify_hod_submission
        notify_hod_submission.delay(subject.id)

        return Response({'success': True, 'status': subject.status})


class RetractSubmissionView(APIView):
    """POST /api/v1/subjects/<id>/retract/ — faculty retracts submission."""
    permission_classes = [IsFaculty]

    def post(self, request, pk):
        subject = get_subject_for_faculty(request, pk)
        if subject.status != SubjectStatus.SUBMITTED:
            return Response(
                {'detail': 'Can only retract SUBMITTED subjects.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        subject.status = SubjectStatus.DRAFT
        subject.save(update_fields=['status', 'updated_at'])
        return Response({'success': True, 'status': subject.status})


# ── HOD Review Workflow ────────────────────────────────────────────

class HODApproveView(APIView):
    """POST /api/v1/subjects/hod/<id>/approve/"""
    permission_classes = [IsHOD]

    def post(self, request, pk):
        subject = get_subject_for_hod(request, pk)
        if subject.status not in (SubjectStatus.SUBMITTED, SubjectStatus.UNDER_REVIEW):
            return Response(
                {'detail': 'Subject must be SUBMITTED or UNDER_REVIEW to approve.'},
                status=400
            )
        subject.status = SubjectStatus.APPROVED
        subject.save(update_fields=['status', 'updated_at'])

        # Create approval record
        from workflow.models import ApprovalRecord
        ApprovalRecord.objects.create(
            subject=subject,
            action='APPROVED',
            actor=request.user,
            comments=request.data.get('comments', ''),
        )

        from tasks.email_tasks import notify_faculty_approval
        notify_faculty_approval.delay(subject.id)

        return Response({'success': True, 'status': subject.status})


class HODRequestRevisionView(APIView):
    """POST /api/v1/subjects/hod/<id>/request-revision/"""
    permission_classes = [IsHOD]

    def post(self, request, pk):
        subject = get_subject_for_hod(request, pk)
        comments = request.data.get('comments', '')
        if not comments:
            return Response({'detail': 'Comments required when requesting revision.'}, status=400)

        subject.status = SubjectStatus.REVISION
        subject.save(update_fields=['status', 'updated_at'])

        from workflow.models import ApprovalRecord
        ApprovalRecord.objects.create(
            subject=subject,
            action='REVISION_REQUESTED',
            actor=request.user,
            comments=comments,
        )

        from tasks.email_tasks import notify_faculty_revision
        notify_faculty_revision.delay(subject.id, comments)

        return Response({'success': True, 'status': subject.status, 'comments': comments})


# ── Full Subject View (for Preview + Document) ────────────────────

class SubjectFullView(generics.RetrieveAPIView):
    """GET /api/v1/subjects/<id>/full/ — complete subject data for preview/PDF."""
    serializer_class = SubjectFullSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        subject = get_object_or_404(
            Subject.objects.prefetch_related(
                'objectives', 'units__topics', 'practicals',
                'textbooks', 'references', 'course_outcomes',
                'articulation_rows__co', 'sdg_mappings',
            ).select_related(
                'assigned_faculty', 'department', 'curriculum_version',
            ),
            pk=self.kwargs['pk']
        )
        user = self.request.user
        if user.is_faculty() and subject.assigned_faculty != user:
            raise PermissionDenied()
        if user.is_hod() and subject.department != user.department:
            raise PermissionDenied()
        return subject
