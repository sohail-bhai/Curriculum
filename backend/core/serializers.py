from rest_framework import serializers
from .models import (
    Campus, School, CampusSchool, Department, CampusSchoolDepartment,
    Programme, CurriculumVersion
)


# ── Campus Serializers ───────────────────────────────────────────────────

class CampusListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True, default=None
    )
    modified_by_name = serializers.CharField(
        source='modified_by.full_name', read_only=True, default=None
    )

    class Meta:
        model = Campus
        fields = [
            'id', 'campus_code', 'name', 'address', 'is_active',
            'created_by', 'created_by_name', 'created_at',
            'modified_by', 'modified_by_name', 'modified_at'
        ]
        read_only_fields = ['created_at', 'modified_at', 'created_by_name', 'modified_by_name']


class CampusDetailSerializer(serializers.ModelSerializer):
    created_by_detail = serializers.StringRelatedField(read_only=True, source='created_by')
    modified_by_detail = serializers.StringRelatedField(read_only=True, source='modified_by')
    school_count = serializers.SerializerMethodField()

    class Meta:
        model = Campus
        fields = [
            'id', 'campus_code', 'name', 'address', 'is_active',
            'created_by', 'created_by_detail', 'created_at',
            'modified_by', 'modified_by_detail', 'modified_at',
            'school_count'
        ]
        read_only_fields = ['created_at', 'modified_at']

    def get_school_count(self, obj):
        return obj.school_mappings.filter(is_active=True).count()


# ── School Serializers ───────────────────────────────────────────────────

class SchoolListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True, default=None
    )
    campus_count = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = [
            'id', 'school_code', 'name', 'description', 'is_active',
            'created_by', 'created_by_name', 'created_at',
            'campus_count'
        ]
        read_only_fields = ['created_at', 'campus_count']

    def get_campus_count(self, obj):
        return obj.campus_mappings.filter(is_active=True).count()


class SchoolDetailSerializer(serializers.ModelSerializer):
    created_by_detail = serializers.StringRelatedField(read_only=True, source='created_by')
    modified_by_detail = serializers.StringRelatedField(read_only=True, source='modified_by')
    campuses = serializers.SerializerMethodField()
    department_count = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = [
            'id', 'school_code', 'name', 'description', 'is_active',
            'created_by', 'created_by_detail', 'created_at',
            'modified_by', 'modified_by_detail', 'modified_at',
            'campuses', 'department_count'
        ]
        read_only_fields = ['created_at', 'modified_at']

    def get_campuses(self, obj):
        """List of campuses this school is mapped to."""
        campus_mappings = obj.campus_mappings.filter(is_active=True)
        return [
            {'id': m.campus.id, 'code': m.campus.campus_code, 'name': m.campus.name}
            for m in campus_mappings
        ]

    def get_department_count(self, obj):
        return obj.department_mappings.filter(is_active=True).count()


# ── Campus-School Mapping Serializers ────────────────────────────────────

class CampusSchoolSerializer(serializers.ModelSerializer):
    campus_code = serializers.CharField(source='campus.campus_code', read_only=True)
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    school_code = serializers.CharField(source='school.school_code', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)

    class Meta:
        model = CampusSchool
        fields = [
            'id', 'campus', 'campus_code', 'campus_name',
            'school', 'school_code', 'school_name',
            'is_active', 'created_at', 'modified_at'
        ]
        read_only_fields = ['created_at', 'modified_at']


# ── Department Serializers ───────────────────────────────────────────────

class DepartmentListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True, default=None
    )

    class Meta:
        model = Department
        fields = [
            'id', 'code', 'name', 'status', 'description',
            'created_by', 'created_by_name', 'created_at',
            'modified_at'
        ]
        read_only_fields = ['created_at', 'modified_at']


class DepartmentDetailSerializer(serializers.ModelSerializer):
    created_by_detail = serializers.StringRelatedField(read_only=True, source='created_by')
    modified_by_detail = serializers.StringRelatedField(read_only=True, source='modified_by')
    hod = serializers.SerializerMethodField()
    campus_school_mappings = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id', 'code', 'name', 'status', 'description',
            'created_by', 'created_by_detail', 'created_at',
            'modified_by', 'modified_by_detail', 'modified_at',
            'hod', 'campus_school_mappings'
        ]
        read_only_fields = ['created_at', 'modified_at']

    def get_hod(self, obj):
        """Get the current HOD for this department."""
        hod = obj.hod
        if hod:
            return {
                'id': hod.id,
                'name': hod.full_name,
                'email': hod.email
            }
        return None

    def get_campus_school_mappings(self, obj):
        """List of campus-school combinations this department operates in."""
        mappings = obj.campus_school_mappings.filter(is_active=True)
        return [
            {
                'id': m.id,
                'campus': {
                    'id': m.campus.id,
                    'code': m.campus.campus_code,
                    'name': m.campus.name
                },
                'school': {
                    'id': m.school.id,
                    'code': m.school.school_code,
                    'name': m.school.name
                }
            }
            for m in mappings
        ]


# ── Campus-School-Department Mapping Serializers ──────────────────────────

class CampusSchoolDepartmentSerializer(serializers.ModelSerializer):
    campus_code = serializers.CharField(source='campus.campus_code', read_only=True)
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    school_code = serializers.CharField(source='school.school_code', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = CampusSchoolDepartment
        fields = [
            'id',
            'campus', 'campus_code', 'campus_name',
            'school', 'school_code', 'school_name',
            'department', 'department_code', 'department_name',
            'is_active', 'created_at', 'modified_at'
        ]
        read_only_fields = ['created_at', 'modified_at']


# ── Programme Serializers ────────────────────────────────────────────────

class ProgrammeListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)

    class Meta:
        model = Programme
        fields = [
            'id', 'code', 'name', 'degree_type', 'duration_years',
            'department', 'department_code', 'department_name',
            'created_at'
        ]
        read_only_fields = ['created_at']


class ProgrammeDetailSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    version_count = serializers.SerializerMethodField()
    active_version = serializers.SerializerMethodField()

    class Meta:
        model = Programme
        fields = [
            'id', 'code', 'name', 'degree_type', 'duration_years',
            'department', 'department_name',
            'created_at', 'version_count', 'active_version'
        ]
        read_only_fields = ['created_at']

    def get_version_count(self, obj):
        return obj.versions.count()

    def get_active_version(self, obj):
        """Get the currently active curriculum version."""
        active = obj.versions.filter(status='ACTIVE').first()
        if active:
            return {
                'id': active.id,
                'version': active.version,
                'regulation_year': active.regulation_year
            }
        return None


# ── Curriculum Version Serializers ───────────────────────────────────────

class CurriculumVersionListSerializer(serializers.ModelSerializer):
    programme_code = serializers.CharField(source='programme.code', read_only=True)
    programme_name = serializers.CharField(source='programme.name', read_only=True)

    class Meta:
        model = CurriculumVersion
        fields = [
            'id', 'version', 'regulation_year', 'status',
            'effective_from', 'created_at',
            'programme', 'programme_code', 'programme_name'
        ]
        read_only_fields = ['created_at']


class CurriculumVersionDetailSerializer(serializers.ModelSerializer):
    programme_detail = ProgrammeDetailSerializer(source='programme', read_only=True)
    subject_count = serializers.SerializerMethodField()

    class Meta:
        model = CurriculumVersion
        fields = [
            'id', 'version', 'regulation_year', 'status',
            'effective_from', 'created_at',
            'programme', 'programme_detail',
            'subject_count'
        ]
        read_only_fields = ['created_at']

    def get_subject_count(self, obj):
        return obj.subjects.count()
