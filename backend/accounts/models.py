"""
Custom User model with role-based system.
Extends AbstractUser to add role and department linkage.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class Role(models.TextChoices):
    FACULTY     = 'FACULTY', 'Faculty'
    HOD         = 'HOD', 'Head of Department'
    ACADEMIC    = 'ACADEMIC', 'Academic Office / Associate Director'
    BOS         = 'BOS', 'Board of Studies'
    DEAN        = 'DEAN', 'Dean'
    ADMIN       = 'ADMIN', 'System Admin'


class User(AbstractUser):
    """
    Central user model. Role is stored directly on the user
    rather than through Django Groups for clarity and queryability.
    Department FK is nullable — Admin/Dean may not belong to one department.
    """
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.FACULTY,
        db_index=True,
    )
    # Deferred FK — uses string ref to avoid circular import
    department = models.ForeignKey(
        'core.Department',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='members',
    )
    designation = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    employee_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    profile_photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        ordering = ['last_name', 'first_name']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def full_name(self):
        return self.get_full_name() or self.email

    def is_faculty(self):
        return self.role == Role.FACULTY

    def is_hod(self):
        return self.role == Role.HOD

    def is_academic(self):
        return self.role == Role.ACADEMIC

    def is_bos(self):
        return self.role == Role.BOS

    def is_dean(self):
        return self.role == Role.DEAN
