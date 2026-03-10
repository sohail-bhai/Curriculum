from rest_framework import serializers
from django.db import transaction
from .models import (
    Subject, Objective, Unit, Topic, PracticalExercise,
    Textbook, Reference, CourseOutcome, ArticulationMatrix,
    SDGMapping, SMEDetail, CourseCategory, CourseType,
    Course, CourseUnit, CourseTopic
)
from accounts.serializers import UserProfileSerializer


# ── Nested serializers ────────────────────────────────────────────

class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'order', 'text']


class UnitSerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)

    class Meta:
        model = Unit
        fields = ['id', 'unit_number', 'title', 'hours', 'topics']


class UnitWriteSerializer(serializers.Serializer):
    """Used for bulk unit+topic saves."""
    unit_number = serializers.IntegerField(min_value=1)
    title = serializers.CharField(max_length=200)
    hours = serializers.DecimalField(max_digits=5, decimal_places=1, default=0)
    topics = serializers.ListField(
        child=serializers.CharField(max_length=500), required=False, default=list
    )


class ObjectiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Objective
        fields = ['id', 'order', 'text']


class PracticalSerializer(serializers.ModelSerializer):
    class Meta:
        model = PracticalExercise
        fields = ['id', 'order', 'text']


class TextbookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Textbook
        fields = ['id', 'order', 'citation', 'isbn']


class ReferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reference
        fields = ['id', 'order', 'citation', 'url']


class CourseOutcomeSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()

    class Meta:
        model = CourseOutcome
        fields = ['id', 'order', 'text', 'label']

    def get_label(self, obj):
        return f"CO{obj.order}"


class ArticulationMatrixSerializer(serializers.ModelSerializer):
    co_label = serializers.SerializerMethodField()

    class Meta:
        model = ArticulationMatrix
        fields = [
            'id', 'co', 'co_label',
            'po1','po2','po3','po4','po5','po6','po7','po8','po9','po10','po11',
            'pso1','pso2',
        ]

    def get_co_label(self, obj):
        return f"CO{obj.co.order}"


class SDGMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SDGMapping
        fields = ['id', 'order', 'sdg_number', 'sdg_theme', 'statement']


class SMEDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMEDetail
        fields = ['id', 'faculty_name', 'designation', 'email', 'phone', 'updated_at']


# ── Subject Serializers ───────────────────────────────────────────

class SubjectListSerializer(serializers.ModelSerializer):
    """Lightweight — for list views."""
    assigned_faculty_name = serializers.CharField(
        source='assigned_faculty.full_name', read_only=True, default=None
    )
    department_name = serializers.CharField(source='department.name', read_only=True)
    curriculum_version_label = serializers.CharField(
        source='curriculum_version.__str__', read_only=True, default=None
    )
    completion_percentage = serializers.ReadOnlyField()
    ltpsic = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = [
            'id', 'subject_code', 'subject_title', 'status',
            'department', 'department_name',
            'curriculum_version', 'curriculum_version_label',
            'assigned_faculty', 'assigned_faculty_name',
            'credits', 'ltpsic', 'completion_percentage',
            'assigned_at', 'submitted_at', 'updated_at',
        ]

    def get_ltpsic(self, obj):
        return obj.get_ltpsic_display()


class SubjectDetailSerializer(serializers.ModelSerializer):
    """Full detail — for edit views."""
    assigned_faculty_detail = UserProfileSerializer(source='assigned_faculty', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    completion_percentage = serializers.ReadOnlyField()
    is_editable_by_faculty = serializers.ReadOnlyField()

    class Meta:
        model = Subject
        fields = [
            'id', 'subject_code', 'subject_title', 'status',
            'department', 'department_name',
            'curriculum_version',
            'assigned_faculty', 'assigned_faculty_detail',
            'lecture_hours', 'tutorial_hours', 'practical_hours',
            'studio_hours', 'independent_hours', 'credits',
            'pre_requisite', 'co_requisite', 'course_description',
            'sdg_justification',
            'completion_percentage', 'is_editable_by_faculty',
            'assigned_at', 'submitted_at', 'created_at', 'updated_at',
            'document_file', 'last_document_generated',
        ]
        read_only_fields = [
            'id', 'status', 'created_at', 'updated_at',
            'assigned_at', 'submitted_at', 'completion_percentage',
            'is_editable_by_faculty', 'document_file', 'last_document_generated',
        ]


class SubjectCreateSerializer(serializers.ModelSerializer):
    """HOD creates a subject shell and assigns it to faculty."""

    class Meta:
        model = Subject
        fields = [
            'subject_code', 'subject_title', 'department',
            'curriculum_version', 'assigned_faculty',
        ]

    def validate(self, attrs):
        # Validate faculty belongs to the same department as the subject
        faculty = attrs.get('assigned_faculty')
        department = attrs.get('department')
        if faculty and department and faculty.department != department:
            raise serializers.ValidationError({
                'assigned_faculty': (
                    f"Faculty {faculty.full_name} belongs to "
                    f"{faculty.department} but subject is in {department}."
                )
            })
        return attrs

    def create(self, validated_data):
        from django.utils import timezone
        validated_data['created_by_hod'] = self.context['request'].user
        validated_data['assigned_at'] = timezone.now()
        validated_data['status'] = 'PENDING'
        return super().create(validated_data)


# ── Module-level bulk write serializers ──────────────────────────

class Module1Serializer(serializers.ModelSerializer):
    """Basic Information"""
    class Meta:
        model = Subject
        fields = [
            'lecture_hours', 'tutorial_hours', 'practical_hours',
            'studio_hours', 'independent_hours', 'credits',
            'pre_requisite', 'co_requisite', 'course_description',
        ]

    def update(self, instance, validated_data):
        # Transition from PENDING to DRAFT on first save
        if instance.status == 'PENDING':
            instance.status = 'DRAFT'
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class Module2Serializer(serializers.Serializer):
    """Course Objectives — bulk replace"""
    objectives = serializers.ListField(
        child=serializers.CharField(allow_blank=False),
        allow_empty=True,
    )

    def save(self, subject):
        with transaction.atomic():
            subject.objectives.all().delete()
            objs = [
                Objective(subject=subject, order=i + 1, text=text.strip())
                for i, text in enumerate(self.validated_data['objectives'])
                if text.strip()
            ]
            Objective.objects.bulk_create(objs)
        return subject


class Module3Serializer(serializers.Serializer):
    """Units + Topics + Practicals — bulk replace"""
    units = UnitWriteSerializer(many=True, required=False)
    practicals = serializers.ListField(
        child=serializers.CharField(allow_blank=False),
        allow_empty=True, required=False,
    )

    def save(self, subject):
        units_data = self.validated_data.get('units', [])
        practicals_data = self.validated_data.get('practicals', [])

        with transaction.atomic():
            # Units + Topics
            subject.units.all().delete()
            for ud in units_data:
                unit = Unit.objects.create(
                    subject=subject,
                    unit_number=ud['unit_number'],
                    title=ud['title'],
                    hours=ud['hours'],
                )
                topics = [
                    Topic(unit=unit, order=i + 1, text=t.strip())
                    for i, t in enumerate(ud.get('topics', []))
                    if t.strip()
                ]
                Topic.objects.bulk_create(topics)

            # Practicals
            subject.practicals.all().delete()
            pracs = [
                PracticalExercise(subject=subject, order=i + 1, text=t.strip())
                for i, t in enumerate(practicals_data)
                if t.strip()
            ]
            PracticalExercise.objects.bulk_create(pracs)
        return subject


class Module4Serializer(serializers.Serializer):
    """Textbooks + References — bulk replace"""
    textbooks = serializers.ListField(
        child=serializers.DictField(), allow_empty=True, required=False
    )
    references = serializers.ListField(
        child=serializers.DictField(), allow_empty=True, required=False
    )

    def save(self, subject):
        with transaction.atomic():
            subject.textbooks.all().delete()
            tbs = [
                Textbook(
                    subject=subject, order=i + 1,
                    citation=item.get('citation', '').strip(),
                    isbn=item.get('isbn', '').strip()
                )
                for i, item in enumerate(self.validated_data.get('textbooks', []))
                if item.get('citation', '').strip()
            ]
            Textbook.objects.bulk_create(tbs)

            subject.references.all().delete()
            refs = [
                Reference(
                    subject=subject, order=i + 1,
                    citation=item.get('citation', '').strip(),
                    url=item.get('url', '').strip()
                )
                for i, item in enumerate(self.validated_data.get('references', []))
                if item.get('citation', '').strip()
            ]
            Reference.objects.bulk_create(refs)
        return subject


class Module5Serializer(serializers.Serializer):
    """Course Outcomes + Articulation Matrix — bulk replace"""
    outcomes = serializers.ListField(
        child=serializers.CharField(allow_blank=False),
        allow_empty=True,
    )
    matrix = serializers.ListField(
        child=serializers.DictField(), allow_empty=True, required=False,
    )

    def save(self, subject):
        outcomes_data = self.validated_data.get('outcomes', [])
        matrix_data = self.validated_data.get('matrix', [])
        po_fields = ArticulationMatrix.PO_FIELDS

        with transaction.atomic():
            # Delete matrix first (depends on COs via FK)
            subject.articulation_rows.all().delete()
            subject.course_outcomes.all().delete()

            # Create COs
            cos = CourseOutcome.objects.bulk_create([
                CourseOutcome(subject=subject, order=i + 1, text=t.strip())
                for i, t in enumerate(outcomes_data) if t.strip()
            ])

            # Build matrix rows from submitted data
            # matrix_data is list of {order: 1, po1: 2, po2: null, ...}
            # Index by order to match with COs
            matrix_by_order = {int(m.get('order', 0)): m for m in matrix_data}

            matrix_rows = []
            for co in cos:
                row_data = matrix_by_order.get(co.order, {})
                row = ArticulationMatrix(subject=subject, co=co)
                for field in po_fields:
                    val = row_data.get(field)
                    if val in (1, 2, 3, '1', '2', '3'):
                        setattr(row, field, int(val))
                    else:
                        setattr(row, field, None)
                matrix_rows.append(row)
            ArticulationMatrix.objects.bulk_create(matrix_rows)
        return subject


class Module6Serializer(serializers.Serializer):
    """SDG Mapping + SME Details"""
    sdg_mappings = serializers.ListField(
        child=serializers.DictField(), allow_empty=True, required=False
    )
    sdg_justification = serializers.CharField(allow_blank=True, required=False)
    sme = SMEDetailSerializer(required=False)

    def save(self, subject):
        sdg_data = self.validated_data.get('sdg_mappings', [])
        justification = self.validated_data.get('sdg_justification', '')
        sme_data = self.validated_data.get('sme')

        with transaction.atomic():
            subject.sdg_mappings.all().delete()
            sdgs = [
                SDGMapping(
                    subject=subject, order=i + 1,
                    sdg_number=item.get('sdg_number', '').strip(),
                    sdg_theme=item.get('sdg_theme', '').strip(),
                    statement=item.get('statement', '').strip(),
                )
                for i, item in enumerate(sdg_data)
                if item.get('sdg_number', '').strip()
            ]
            SDGMapping.objects.bulk_create(sdgs)

            subject.sdg_justification = justification
            subject.save(update_fields=['sdg_justification', 'updated_at'])

            if sme_data:
                SMEDetail.objects.update_or_create(
                    subject=subject,
                    defaults={
                        'faculty_name': sme_data.get('faculty_name', ''),
                        'designation': sme_data.get('designation', ''),
                        'email': sme_data.get('email', ''),
                        'phone': sme_data.get('phone', ''),
                    }
                )
        return subject


class SubjectFullSerializer(serializers.ModelSerializer):
    """Complete serializer for document generation and preview."""
    objectives = ObjectiveSerializer(many=True, read_only=True)
    units = UnitSerializer(many=True, read_only=True)
    practicals = PracticalSerializer(many=True, read_only=True)
    textbooks = TextbookSerializer(many=True, read_only=True)
    references = ReferenceSerializer(many=True, read_only=True)
    course_outcomes = CourseOutcomeSerializer(many=True, read_only=True)
    articulation_rows = ArticulationMatrixSerializer(many=True, read_only=True)
    sdg_mappings = SDGMappingSerializer(many=True, read_only=True)
    sme_detail = SMEDetailSerializer(read_only=True)
    assigned_faculty_detail = UserProfileSerializer(source='assigned_faculty', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    hod_name = serializers.SerializerMethodField()
    completion_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Subject
        fields = '__all__'

    def get_hod_name(self, obj):
        try:
            return obj.department.hod.full_name
        except Exception:
            return None


# ── Course Hierarchy Serializers ─────────────────────────────────────────

class CourseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseCategory
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'modified_at']
        read_only_fields = ['created_at', 'modified_at']


class CourseTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseType
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'modified_at']
        read_only_fields = ['created_at', 'modified_at']


class CourseTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseTopic
        fields = [
            'id', 'unit', 'topic_number', 'topic_title',
            'description', 'learning_outcomes', 'is_active',
            'created_at', 'modified_at'
        ]
        read_only_fields = ['created_at', 'modified_at']


class CourseUnitNestedSerializer(serializers.ModelSerializer):
    """Nested unit serializer with topics."""
    topics = CourseTopicSerializer(many=True, read_only=True)

    class Meta:
        model = CourseUnit
        fields = [
            'id', 'unit_number', 'unit_title', 'description',
            'hours', 'is_active', 'created_at', 'modified_at',
            'topics'
        ]
        read_only_fields = ['created_at', 'modified_at']


class CourseUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseUnit
        fields = [
            'id', 'course', 'unit_number', 'unit_title',
            'description', 'hours', 'is_active',
            'created_at', 'modified_at'
        ]
        read_only_fields = ['created_at', 'modified_at']


class CourseListSerializer(serializers.ModelSerializer):
    """Lightweight course list serializer."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    course_type_name = serializers.CharField(source='course_type.name', read_only=True)
    department_name = serializers.CharField(
        source='campus_school_department.department.name', read_only=True
    )
    unit_count = serializers.SerializerMethodField()
    ltpsic = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'course_code', 'course_name', 'description',
            'category', 'category_name',
            'course_type', 'course_type_name',
            'department_name',
            'lecture_hours', 'tutorial_hours', 'practical_hours',
            'studio_hours', 'independent_hours', 'credits',
            'ltpsic', 'unit_count', 'is_active',
            'created_at', 'modified_at'
        ]
        read_only_fields = ['created_at', 'modified_at', 'unit_count', 'ltpsic']

    def get_unit_count(self, obj):
        return obj.units.filter(is_active=True).count()

    def get_ltpsic(self, obj):
        return obj.get_ltpsic_display()


class CourseDetailSerializer(serializers.ModelSerializer):
    """Complete course detail with units and topics."""
    category_detail = CourseCategorySerializer(source='category', read_only=True)
    course_type_detail = CourseTypeSerializer(source='course_type', read_only=True)
    campus_school_department_detail = serializers.SerializerMethodField()
    units = CourseUnitNestedSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    modified_by_name = serializers.CharField(source='modified_by.full_name', read_only=True)
    ltpsic = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'course_code', 'course_name', 'description', 'objectives',
            'category', 'category_detail',
            'course_type', 'course_type_detail',
            'campus_school_department', 'campus_school_department_detail',
            'lecture_hours', 'tutorial_hours', 'practical_hours',
            'studio_hours', 'independent_hours', 'credits',
            'pre_requisite', 'co_requisite',
            'ltpsic',
            'is_active',
            'created_by', 'created_by_name', 'created_at',
            'modified_by', 'modified_by_name', 'modified_at',
            'units'
        ]
        read_only_fields = ['created_at', 'modified_at', 'ltpsic']

    def get_campus_school_department_detail(self, obj):
        """Expand the campus-school-department reference."""
        csd = obj.campus_school_department
        return {
            'id': csd.id,
            'campus': {'id': csd.campus.id, 'code': csd.campus.campus_code, 'name': csd.campus.name},
            'school': {'id': csd.school.id, 'code': csd.school.school_code, 'name': csd.school.name},
            'department': {'id': csd.department.id, 'code': csd.department.code, 'name': csd.department.name},
        }

    def get_ltpsic(self, obj):
        return obj.get_ltpsic_display()


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """For creating/updating courses."""
    class Meta:
        model = Course
        fields = [
            'course_code', 'course_name', 'description', 'objectives',
            'category', 'course_type', 'campus_school_department',
            'lecture_hours', 'tutorial_hours', 'practical_hours',
            'studio_hours', 'independent_hours', 'credits',
            'pre_requisite', 'co_requisite', 'is_active'
        ]

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data['modified_by'] = self.context['request'].user
        return super().update(instance, validated_data)
