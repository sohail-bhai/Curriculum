from rest_framework import serializers, generics
from .models import Department, Programme, CurriculumVersion


class DepartmentSerializer(serializers.ModelSerializer):
    hod_name = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'hod_name', 'created_at']

    def get_hod_name(self, obj):
        hod = obj.hod  # uses @property — queries DB
        return hod.full_name if hod else None


class ProgrammeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Programme
        fields = ['id', 'name', 'code', 'degree_type', 'duration_years',
                  'department', 'department_name', 'created_at']


class CurriculumVersionSerializer(serializers.ModelSerializer):
    programme_name = serializers.CharField(source='programme.name', read_only=True)
    programme_code = serializers.CharField(source='programme.code', read_only=True)

    class Meta:
        model = CurriculumVersion
        fields = ['id', 'version', 'regulation_year', 'status', 'effective_from',
                  'programme', 'programme_name', 'programme_code', 'created_at']


class DepartmentListView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class ProgrammeListView(generics.ListCreateAPIView):
    queryset = Programme.objects.select_related('department').all()
    serializer_class = ProgrammeSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        dept = self.request.query_params.get('department')
        if dept:
            qs = qs.filter(department_id=dept)
        return qs


class ProgrammeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Programme.objects.select_related('department').all()
    serializer_class = ProgrammeSerializer


class CurriculumVersionListView(generics.ListCreateAPIView):
    queryset = CurriculumVersion.objects.select_related('programme__department').all()
    serializer_class = CurriculumVersionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        programme = self.request.query_params.get('programme')
        if programme:
            qs = qs.filter(programme_id=programme)
        return qs


class CurriculumVersionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CurriculumVersion.objects.all()
    serializer_class = CurriculumVersionSerializer
