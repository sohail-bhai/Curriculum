from django.db import models
from django.conf import settings


# ── Campus Models ────────────────────────────────────────────────────────
class Campus(models.Model):
    """
    Represents a physical campus location within the institution.
    An institution can have multiple campuses.
    """
    campus_code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='campuses_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='campuses_modified'
    )
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Campus'
        verbose_name_plural = 'Campuses'
        indexes = [
            models.Index(fields=['campus_code']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.campus_code} — {self.name}"


# ── School Models ────────────────────────────────────────────────────────
class School(models.Model):
    """
    Represents a school/faculty within the institution.
    Schools are organizational units that may span multiple campuses.
    Examples: School of Engineering, School of Management, etc.
    """
    name = models.CharField(max_length=200)
    school_code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='schools_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='schools_modified'
    )
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'School'
        verbose_name_plural = 'Schools'
        indexes = [
            models.Index(fields=['school_code']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.school_code} — {self.name}"


class CampusSchool(models.Model):
    """
    Maps schools to campuses (many-to-many relationship).
    A school can exist on multiple campuses, and a campus can have multiple schools.
    """
    campus = models.ForeignKey(Campus, on_delete=models.CASCADE, related_name='school_mappings')
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='campus_mappings')
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['campus', 'school']
        ordering = ['campus', 'school']
        verbose_name = 'Campus-School Mapping'
        verbose_name_plural = 'Campus-School Mappings'
        indexes = [
            models.Index(fields=['campus', 'is_active']),
            models.Index(fields=['school', 'is_active']),
        ]

    def __str__(self):
        return f"{self.campus} → {self.school}"


# ── Department Models ────────────────────────────────────────────────────────
class Department(models.Model):
    """
    Enhanced Department model - now part of the Campus-School-Department hierarchy.
    A department belongs to a school on a specific campus.
    Maintains backward compatibility with existing FK from User and Subject.
    """
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('ARCHIVED', 'Archived'),
    ]

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, db_index=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='ACTIVE', db_index=True
    )
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='departments_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='departments_modified'
    )
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        # Deprecated: code alone is no longer unique due to hierarchy
        # Now unique constraint is at CampusSchoolDepartment level
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.code} — {self.name}"

    @property
    def hod(self):
        """
        Returns the HOD for this department.
        No FK stored here — avoids circular migration dependency
        with accounts.User (which already has FK to Department).
        Pattern: query, not store.
        """
        from django.contrib.auth import get_user_model
        return get_user_model().objects.filter(
            role='HOD', department=self
        ).first()


class CampusSchoolDepartment(models.Model):
    """
    Maps departments to the Campus-School hierarchy.
    Provides the complete institutional structure:
    Campus → School → Department
    
    This allows departments to exist within specific school-campus combinations,
    supporting complex institutional structures where departments might have
    different identities on different campuses or within different schools.
    """
    campus = models.ForeignKey(Campus, on_delete=models.CASCADE, related_name='school_department_mappings')
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='department_mappings')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='campus_school_mappings')
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [['campus', 'school', 'department']]
        ordering = ['campus', 'school', 'department']
        verbose_name = 'Campus-School-Department Mapping'
        verbose_name_plural = 'Campus-School-Department Mappings'
        indexes = [
            models.Index(fields=['campus', 'is_active']),
            models.Index(fields=['school', 'is_active']),
            models.Index(fields=['department', 'is_active']),
            models.Index(fields=['campus', 'school', 'is_active']),
        ]

    def __str__(self):
        return f"{self.campus} → {self.school} → {self.department}"


class Programme(models.Model):
    DEGREE_CHOICES = [
        ('UG', 'Undergraduate'), ('PG', 'Postgraduate'),
        ('PhD', 'Doctorate'), ('Diploma', 'Diploma'),
    ]
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='programmes')
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    degree_type = models.CharField(max_length=20, choices=DEGREE_CHOICES, default='UG')
    duration_years = models.IntegerField(default=4)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} — {self.name}"


class CurriculumVersion(models.Model):
    STATUS_CHOICES = [('DRAFT', 'Draft'), ('ACTIVE', 'Active'), ('ARCHIVED', 'Archived')]
    programme = models.ForeignKey(Programme, on_delete=models.CASCADE, related_name='versions')
    version = models.CharField(max_length=20)
    regulation_year = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    effective_from = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['programme', 'version']
        ordering = ['-regulation_year']

    def __str__(self):
        return f"{self.programme.code} v{self.version} ({self.regulation_year})"
