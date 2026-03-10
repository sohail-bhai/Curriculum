from django.contrib import admin
from .models import (
    Campus, School, CampusSchool, Department,
    CampusSchoolDepartment, Programme, CurriculumVersion
)


@admin.register(Campus)
class CampusAdmin(admin.ModelAdmin):
    list_display = ['campus_code', 'name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['campus_code', 'name']
    readonly_fields = ['created_at', 'modified_at', 'created_by', 'modified_by']
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.modified_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ['school_code', 'name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['school_code', 'name']
    readonly_fields = ['created_at', 'modified_at', 'created_by', 'modified_by']
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.modified_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(CampusSchool)
class CampusSchoolAdmin(admin.ModelAdmin):
    list_display = ['campus', 'school', 'is_active', 'created_at']
    list_filter = ['is_active', 'campus', 'school']
    search_fields = ['campus__name', 'school__name']
    readonly_fields = ['created_at', 'modified_at']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['code', 'name']
    readonly_fields = ['created_at', 'modified_at', 'created_by', 'modified_by']
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.modified_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(CampusSchoolDepartment)
class CampusSchoolDepartmentAdmin(admin.ModelAdmin):
    list_display = ['campus', 'school', 'department', 'is_active', 'created_at']
    list_filter = ['is_active', 'campus', 'school', 'department']
    search_fields = ['campus__name', 'school__name', 'department__name']
    readonly_fields = ['created_at', 'modified_at']


@admin.register(Programme)
class ProgrammeAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'department', 'degree_type', 'created_at']
    list_filter = ['degree_type', 'department', 'created_at']
    search_fields = ['code', 'name']
    readonly_fields = ['created_at']


@admin.register(CurriculumVersion)
class CurriculumVersionAdmin(admin.ModelAdmin):
    list_display = ['programme', 'version', 'regulation_year', 'status', 'created_at']
    list_filter = ['status', 'regulation_year', 'created_at']
    search_fields = ['programme__code', 'version']
    readonly_fields = ['created_at']
