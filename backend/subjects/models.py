"""
Subject models — the complete normalized schema for syllabus data.
Subjects are created by HOD and assigned to faculty.
Faculty fill the syllabus content through modular API endpoints.
"""
from django.db import models
from django.conf import settings


class SubjectStatus(models.TextChoices):
    PENDING     = 'PENDING', 'Pending (Assigned, not started)'
    DRAFT       = 'DRAFT', 'Draft (In Progress)'
    SUBMITTED   = 'SUBMITTED', 'Submitted to HOD'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under HOD Review'
    REVISION    = 'REVISION', 'Revision Requested'
    APPROVED    = 'APPROVED', 'Approved by HOD'
    PUBLISHED   = 'PUBLISHED', 'Published'
    REJECTED    = 'REJECTED', 'Rejected'


class Subject(models.Model):
    """
    Central subject model. Created by HOD, filled by Faculty.
    The subject code and title are set by HOD at creation.
    All syllabus sections are populated by the assigned faculty.
    """
    # ── HOD-controlled fields (set at creation) ───────────────────
    subject_code        = models.CharField(max_length=30, db_index=True)
    subject_title       = models.CharField(max_length=200)
    department          = models.ForeignKey(
        'core.Department', on_delete=models.PROTECT, related_name='subjects'
    )
    curriculum_version  = models.ForeignKey(
        'core.CurriculumVersion', on_delete=models.PROTECT,
        related_name='subjects', null=True, blank=True
    )
    assigned_faculty    = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_subjects',
        limit_choices_to={'role': 'FACULTY'},
    )
    created_by_hod      = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='created_subjects',
        limit_choices_to={'role': 'HOD'},
    )
    status              = models.CharField(
        max_length=20, choices=SubjectStatus.choices,
        default=SubjectStatus.PENDING, db_index=True
    )
    assigned_at         = models.DateTimeField(null=True, blank=True)

    # ── Faculty-filled fields ─────────────────────────────────────
    # Section 1: Basic Info (partially pre-filled by HOD)
    lecture_hours       = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    tutorial_hours      = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    practical_hours     = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    studio_hours        = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    independent_hours   = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    credits             = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    pre_requisite       = models.CharField(max_length=300, blank=True)
    co_requisite        = models.CharField(max_length=300, blank=True)
    course_description  = models.TextField(blank=True)

    # Section 6: SDG Justification
    sdg_justification   = models.TextField(blank=True)

    # Tracking
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)
    submitted_at        = models.DateTimeField(null=True, blank=True)

    # Document generation tracking
    last_document_generated = models.DateTimeField(null=True, blank=True)
    document_file       = models.FileField(
        upload_to='documents/syllabi/', null=True, blank=True
    )

    class Meta:
        ordering = ['-updated_at']
        unique_together = ['subject_code', 'curriculum_version']
        indexes = [
            models.Index(fields=['status', 'department']),
            models.Index(fields=['assigned_faculty', 'status']),
        ]

    def __str__(self):
        return f"{self.subject_code} — {self.subject_title}"

    def get_ltpsic_display(self):
        return f"{self.lecture_hours}-{self.tutorial_hours}-{self.practical_hours}-{self.studio_hours}-{self.independent_hours}-{self.credits}"

    @property
    def is_editable_by_faculty(self):
        return self.status in (
            SubjectStatus.PENDING,
            SubjectStatus.DRAFT,
            SubjectStatus.REVISION,
        )

    @property
    def completion_percentage(self):
        """Calculate how many of the 6 modules have been filled."""
        score = 0
        if self.course_description:
            score += 1
        if self.objectives.exists():
            score += 1
        if self.units.exists():
            score += 1
        if self.textbooks.exists():
            score += 1
        if self.course_outcomes.exists():
            score += 1
        if self.sdg_mappings.exists():
            score += 1
        return int((score / 6) * 100)


class Objective(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='objectives')
    order   = models.PositiveIntegerField(default=0)
    text    = models.TextField()

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Obj {self.order}: {self.text[:60]}"


class Unit(models.Model):
    subject     = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='units')
    unit_number = models.PositiveIntegerField()
    title       = models.CharField(max_length=200)
    hours       = models.DecimalField(max_digits=5, decimal_places=1, default=0)

    class Meta:
        ordering = ['unit_number']
        unique_together = ['subject', 'unit_number']

    def __str__(self):
        return f"Unit {self.unit_number}: {self.title}"


class Topic(models.Model):
    unit  = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='topics')
    order = models.PositiveIntegerField(default=0)
    text  = models.CharField(max_length=500)

    class Meta:
        ordering = ['order']


class PracticalExercise(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='practicals')
    order   = models.PositiveIntegerField(default=0)
    text    = models.TextField()

    class Meta:
        ordering = ['order']


class Textbook(models.Model):
    subject  = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='textbooks')
    order    = models.PositiveIntegerField(default=0)
    citation = models.TextField()
    isbn     = models.CharField(max_length=20, blank=True)

    class Meta:
        ordering = ['order']


class Reference(models.Model):
    subject  = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='references')
    order    = models.PositiveIntegerField(default=0)
    citation = models.TextField()
    url      = models.URLField(blank=True)

    class Meta:
        ordering = ['order']


class CourseOutcome(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='course_outcomes')
    order   = models.PositiveIntegerField(default=0)
    text    = models.TextField()

    class Meta:
        ordering = ['order']

    def label(self):
        return f"CO{self.order}"


class ArticulationMatrix(models.Model):
    """
    CO × PO/PSO mapping. One row per CourseOutcome.
    Values: 1=Low, 2=Medium, 3=High, null=No mapping.
    """
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='articulation_rows')
    co      = models.OneToOneField(CourseOutcome, on_delete=models.CASCADE, related_name='matrix_row')
    po1  = models.IntegerField(null=True, blank=True)
    po2  = models.IntegerField(null=True, blank=True)
    po3  = models.IntegerField(null=True, blank=True)
    po4  = models.IntegerField(null=True, blank=True)
    po5  = models.IntegerField(null=True, blank=True)
    po6  = models.IntegerField(null=True, blank=True)
    po7  = models.IntegerField(null=True, blank=True)
    po8  = models.IntegerField(null=True, blank=True)
    po9  = models.IntegerField(null=True, blank=True)
    po10 = models.IntegerField(null=True, blank=True)
    po11 = models.IntegerField(null=True, blank=True)
    pso1 = models.IntegerField(null=True, blank=True)
    pso2 = models.IntegerField(null=True, blank=True)

    PO_FIELDS = ['po1','po2','po3','po4','po5','po6','po7','po8','po9','po10','po11','pso1','pso2']
    PO_LABELS = ['PO1','PO2','PO3','PO4','PO5','PO6','PO7','PO8','PO9','PO10','PO11','PSO1','PSO2']

    class Meta:
        ordering = ['co__order']

    def get_values_dict(self):
        return {label: getattr(self, field) for field, label in zip(self.PO_FIELDS, self.PO_LABELS)}


class SDGMapping(models.Model):
    subject    = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='sdg_mappings')
    order      = models.PositiveIntegerField(default=0)
    sdg_number = models.CharField(max_length=10)
    sdg_theme  = models.CharField(max_length=200)
    statement  = models.TextField()

    class Meta:
        ordering = ['order']


class SMEDetail(models.Model):
    subject      = models.OneToOneField(Subject, on_delete=models.CASCADE, related_name='sme_detail')
    faculty_name = models.CharField(max_length=200)
    designation  = models.CharField(max_length=200)
    email        = models.EmailField()
    phone        = models.CharField(max_length=20, blank=True)
    updated_at   = models.DateTimeField(auto_now=True)


# ── Course Hierarchy Models ──────────────────────────────────────────────────
# These models define the general course structure separate from Subject (syllabus).
# Courses are more general course definitions, while Subjects are specific sylla bi
# tied to curriculum versions for execution tracking.


class CourseCategory(models.Model):
    """
    Categorizes courses for organizational and reporting purposes.
    Examples: Core, Elective, Lab, Seminar, etc.
    """
    name = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Course Category'
        verbose_name_plural = 'Course Categories'

    def __str__(self):
        return self.name


class CourseType(models.Model):
    """
    Defines the course delivery type/mode.
    Examples: Theory, Practical, Mixed (Theory + Practical), Seminar, etc.
    Type is distinct from LTPSIC (which tracks hours breakdown).
    """
    name = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Course Type'
        verbose_name_plural = 'Course Types'

    def __str__(self):
        return self.name


class Course(models.Model):
    """
    Core general course definition in the curriculum hierarchy.
    Links to Department through CampusSchoolDepartment mapping.
    
    Unlike Subject (which is curriculum-version-specific and workflow-driven),
    Course represents the static course definition:
    - Created once, reused across curriculum versions
    - Contains metadata, learning objectives, overall structure
    - Not tied to approval workflows or faculty assignments
    - Can be referenced by multiple Subjects across versionsn.
    
    Relationship: Course 1:M Subject
    - A course can appear in multiple curriculum versions as different Subjects
    - Each specific offering gets its own Subject for workflow tracking
    """
    # Core identifiers
    course_code = models.CharField(max_length=50, db_index=True)
    course_name = models.CharField(max_length=200)
    
    # Course metadata
    description = models.TextField(blank=True)
    objectives = models.TextField(blank=True)  # High-level course objectives
    
    # Classification
    category = models.ForeignKey(
        CourseCategory, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='courses'
    )
    course_type = models.ForeignKey(
        CourseType, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='courses'
    )
    
    # Department/School/Campus mapping (required)
    # NOTE: A course must belong to a specific department within a campus+school combination
    # To query: course.campus_school_department_mapping.campus_school_department.school
    campus_school_department = models.ForeignKey(
        'core.CampusSchoolDepartment', on_delete=models.CASCADE,
        related_name='courses'
    )
    
    # LTPSIC credits/hours
    lecture_hours = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    tutorial_hours = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    practical_hours = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    studio_hours = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    independent_hours = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    credits = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    
    # Prerequisites/Corequisites (text, not FK—flexible)
    pre_requisite = models.CharField(max_length=500, blank=True)
    co_requisite = models.CharField(max_length=500, blank=True)
    
    # Status/Auditing
    is_active = models.BooleanField(default=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='courses_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='courses_modified'
    )
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['course_code']
        unique_together = [['course_code', 'campus_school_department']]
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
        indexes = [
            models.Index(fields=['course_code']),
            models.Index(fields=['is_active']),
            models.Index(fields=['campus_school_department', 'is_active']),
            models.Index(fields=['category', 'is_active']),
        ]

    def __str__(self):
        return f"{self.course_code} — {self.course_name}"

    def get_ltpsic_display(self):
        """Format LTPSIC as L-T-P-S-I-C"""
        return f"{self.lecture_hours}-{self.tutorial_hours}-{self.practical_hours}-{self.studio_hours}-{self.independent_hours}-{self.credits}"


class CourseUnit(models.Model):
    """
    Represents a pedagogical unit/module within a course.
    Each unit groups related topics and learning objectives.
    
    Hierarchy: Course → CourseUnit → CourseTopic
    
    This is the general course structure, separate from Subject's Units
    which are curriculum-version-specific and workflow-managed.
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='units')
    unit_number = models.PositiveIntegerField()
    unit_title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    hours = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['unit_number']
        unique_together = [['course', 'unit_number']]
        verbose_name = 'Course Unit'
        verbose_name_plural = 'Course Units'
        indexes = [
            models.Index(fields=['course', 'is_active']),
        ]

    def __str__(self):
        return f"{self.course.course_code} Unit {self.unit_number}: {self.unit_title}"


class CourseTopic(models.Model):
    """
    Represents a topic within a course unit.
    Multiple topics make up a unit's learning content.
    
    Hierarchy: Course → CourseUnit → CourseTopic
    """
    unit = models.ForeignKey(CourseUnit, on_delete=models.CASCADE, related_name='topics')
    topic_number = models.PositiveIntegerField()
    topic_title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    learning_outcomes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['topic_number']
        unique_together = [['unit', 'topic_number']]
        verbose_name = 'Course Topic'
        verbose_name_plural = 'Course Topics'
        indexes = [
            models.Index(fields=['unit', 'is_active']),
        ]

    def __str__(self):
        return f"{self.unit.course.course_code} U{self.unit.unit_number} T{self.topic_number}: {self.topic_title}"
