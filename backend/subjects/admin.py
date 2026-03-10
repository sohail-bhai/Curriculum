from django.contrib import admin
from .models import (
    Subject, Unit, CourseOutcome, ArticulationMatrix,
    CourseCategory, CourseType, Course, CourseUnit, CourseTopic
)


class UnitInline(admin.TabularInline):
    model = Unit
    extra = 0


class COInline(admin.TabularInline):
    model = CourseOutcome
    extra = 0


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['subject_code', 'subject_title', 'assigned_faculty', 'status', 'updated_at']
    list_filter = ['status', 'department']
    inlines = [UnitInline, COInline]


# ── Course Hierarchy Admin ───────────────────────────────────────────────

class CourseTopicInline(admin.TabularInline):
    model = CourseTopic
    extra = 0


class CourseUnitInline(admin.TabularInline):
    model = CourseUnit
    extra = 0


@admin.register(CourseCategory)
class CourseCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'modified_at']


@admin.register(CourseType)
class CourseTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'modified_at']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['course_code', 'course_name', 'category', 'course_type', 'is_active', 'created_at']
    list_filter = ['is_active', 'category', 'course_type', 'created_at']
    search_fields = ['course_code', 'course_name']
    readonly_fields = ['created_at', 'modified_at', 'created_by', 'modified_by']
    inlines = [CourseUnitInline]
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.modified_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(CourseUnit)
class CourseUnitAdmin(admin.ModelAdmin):
    list_display = ['course', 'unit_number', 'unit_title', 'hours', 'is_active', 'created_at']
    list_filter = ['is_active', 'course', 'created_at']
    search_fields = ['course__course_code', 'unit_title']
    readonly_fields = ['created_at', 'modified_at']
    inlines = [CourseTopicInline]


@admin.register(CourseTopic)
class CourseTopicAdmin(admin.ModelAdmin):
    list_display = ['unit', 'topic_number', 'topic_title', 'is_active', 'created_at']
    list_filter = ['is_active', 'unit__course', 'created_at']
    search_fields = ['unit__unit_title', 'topic_title']
    readonly_fields = ['created_at', 'modified_at']

