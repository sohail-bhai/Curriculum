from django.urls import path
from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated
from .models import ApprovalRecord, SubjectComment


class ApprovalRecordSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.full_name', read_only=True)
    class Meta:
        model = ApprovalRecord
        fields = ['id', 'action', 'actor', 'actor_name', 'comments', 'created_at']


class SubjectCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    class Meta:
        model = SubjectComment
        fields = ['id', 'section', 'text', 'is_resolved', 'author', 'author_name', 'created_at']
        read_only_fields = ['author']


class ApprovalHistoryView(generics.ListAPIView):
    serializer_class = ApprovalRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ApprovalRecord.objects.filter(
            subject_id=self.kwargs['subject_pk']
        ).select_related('actor')


class SubjectCommentListView(generics.ListCreateAPIView):
    serializer_class = SubjectCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SubjectComment.objects.filter(subject_id=self.kwargs['subject_pk'])

    def perform_create(self, serializer):
        serializer.save(
            subject_id=self.kwargs['subject_pk'],
            author=self.request.user
        )


urlpatterns = [
    path('subjects/<int:subject_pk>/history/', ApprovalHistoryView.as_view(), name='approval-history'),
    path('subjects/<int:subject_pk>/comments/', SubjectCommentListView.as_view(), name='subject-comments'),
]
