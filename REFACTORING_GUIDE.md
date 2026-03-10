"""
CURRICULUM OS V2.1 - ACADEMIC HIERARCHY REFACTORING
Complete Implementation Guide & Migration Instructions
======================================================

This document provides complete details about the refactoring,
including changes made, migration steps, and integration guidelines.
"""

# ════════════════════════════════════════════════════════════════════════════
# PART 1: OVERVIEW OF CHANGES
# ════════════════════════════════════════════════════════════════════════════

"""
GOAL:
Refactor the project to support a structured academic hierarchy:
Campus → School → Department → Course (with units and topics)

SCOPE:
- Enhanced core/models.py: Added Campus, School, CampusSchool, CampusSchoolDepartment
- Enhanced Department model: Added status, created_by, modified_by, modified_at
- Enhanced subjects/models.py: Added Course hierarchy (CourseCategory, CourseType,
  Course, CourseUnit, CourseTopic)
- Created core/serializers.py: Full API serializers for all new models
- Enhanced subjects/serializers.py: Added Course hierarchy serializers
- Created core/admin.py: Django admin registration for all new models
- Enhanced subjects/admin.py: Added Course models to admin

BACKWARD COMPATIBILITY:
- Subject model remains unchanged (except for new methods if any)
- User model remains unchanged
- Programme and CurriculumVersion models unchanged
- All existing Subject workflow functionality preserved
- Existing migrations remain in place
"""

# ════════════════════════════════════════════════════════════════════════════
# PART 2: DETAILED MODEL CHANGES
# ════════════════════════════════════════════════════════════════════════════

# ── CORE APP MODELS ──────────────────────────────────────────────────────────

"""
NEW MODELS IN core/models.py:

1. Campus
   - campus_code (CharField, unique, indexed)
   - name (CharField)
   - address (TextField)
   - is_active (BooleanField, indexed, default=True)
   - created_by (FK → User)
   - created_at (DateTimeField, auto_now_add)
   - modified_by (FK → User)
   - modified_at (DateTimeField, auto_now)

2. School
   - name (CharField)
   - school_code (CharField, unique, indexed)
   - description (TextField)
   - is_active (BooleanField, indexed, default=True)
   - created_by (FK → User)
   - created_at (DateTimeField, auto_now_add)
   - modified_by (FK → User)
   - modified_at (DateTimeField, auto_now)

3. CampusSchool (Mapping Table)
   - campus (FK → Campus)
   - school (FK → School)
   - is_active (BooleanField, indexed, default=True)
   - created_at (DateTimeField, auto_now_add)
   - modified_at (DateTimeField, auto_now)
   - Unique constraint: campus + school

4. Department (ENHANCED)
   - name (CharField) [existing]
   - code (CharField, indexed) [existing, no longer unique alone]
   - status (CharField, choices, indexed) [NEW]
     Choices: ACTIVE, INACTIVE, ARCHIVED (default=ACTIVE)
   - description (TextField) [NEW]
   - created_by (FK → User) [NEW]
   - created_at (DateTimeField) [existing - auto_now_add]
   - modified_by (FK → User) [NEW]
   - modified_at (DateTimeField) [NEW - auto_now]

5. CampusSchoolDepartment (Mapping Table)
   - campus (FK → Campus)
   - school (FK → School)
   - department (FK → Department)
   - is_active (BooleanField, indexed, default=True)
   - created_at (DateTimeField, auto_now_add)
   - modified_at (DateTimeField, auto_now)
   - Unique constraint: campus + school + department
"""

# ── SUBJECTS APP MODELS ──────────────────────────────────────────────────────

"""
NEW MODELS IN subjects/models.py:

1. CourseCategory
   - name (CharField, unique, indexed)
   - description (TextField)
   - is_active (BooleanField, indexed, default=True)
   - created_at (DateTimeField, auto_now_add)
   - modified_at (DateTimeField, auto_now)

2. CourseType
   - name (CharField, unique, indexed)
   - description (TextField)
   - is_active (BooleanField, indexed, default=True)
   - created_at (DateTimeField, auto_now_add)
   - modified_at (DateTimeField, auto_now)

3. Course (MAIN MODEL)
   - course_code (CharField, indexed)
   - course_name (CharField)
   - description (TextField)
   - objectives (TextField)
   - category (FK → CourseCategory, nullable)
   - course_type (FK → CourseType, nullable)
   - campus_school_department (FK → CampusSchoolDepartment, required)
   - lecture_hours (DecimalField)
   - tutorial_hours (DecimalField)
   - practical_hours (DecimalField)
   - studio_hours (DecimalField)
   - independent_hours (DecimalField)
   - credits (DecimalField)
   - pre_requisite (CharField)
   - co_requisite (CharField)
   - is_active (BooleanField, indexed, default=True)
   - created_by (FK → User)
   - created_at (DateTimeField, auto_now_add)
   - modified_by (FK → User)
   - modified_at (DateTimeField, auto_now)
   - Unique constraint: course_code + campus_school_department

4. CourseUnit
   - course (FK → Course)
   - unit_number (PositiveIntegerField)
   - unit_title (CharField)
   - description (TextField)
   - hours (DecimalField)
   - is_active (BooleanField, indexed, default=True)
   - created_at (DateTimeField, auto_now_add)
   - modified_at (DateTimeField, auto_now)
   - Unique constraint: course + unit_number

5. CourseTopic
   - unit (FK → CourseUnit)
   - topic_number (PositiveIntegerField)
   - topic_title (CharField)
   - description (TextField)
   - learning_outcomes (TextField)
   - is_active (BooleanField, indexed, default=True)
   - created_at (DateTimeField, auto_now_add)
   - modified_at (DateTimeField, auto_now)
   - Unique constraint: unit + topic_number

NOTE ON COURSE vs SUBJECT:
- Course: Static general course definition (created once, reused across versions)
- Subject: Curriculum-version-specific offering with workflow/approval tracking
- Relationship: 1 Course can have M Subjects across different curriculum versions
- A Subject implementation can reference a Course if needed (optional extension)
"""

# ════════════════════════════════════════════════════════════════════════════
# PART 3: MIGRATION STRATEGY & STEPS
# ════════════════════════════════════════════════════════════════════════════

"""
MIGRATION SEQUENCE (CRITICAL ORDER):

1. Create and apply core app migrations first (new models and Department changes)
2. Create and apply subjects app migrations (new Course hierarchy models)
3. Data migration scripts (if needed for any data reorganization)
4. For Department.code: Update any existing uniqueness constraints

DETAILED MIGRATION STEPS:

Step 1: Generate migrations for core app
────────────────────────────────────────
cd backend
python manage.py makemigrations core

This will create a migration file like:
  core/migrations/0002_campus_school_campusschool_add_department_fields.py

This migration will:
- Create Campus table
- Create School table
- Create CampusSchool table
- Create CampusSchoolDepartment table
- ALTER Department table to:
  - Remove unique constraint on code (if exists)
  - Add status column (default='ACTIVE')
  - Add description column
  - Add created_by_id column
  - Add modified_by_id column
  - Add modified_at column

Step 2: Review the generated migration
──────────────────────────────────────
Check backend/core/migrations/0002_*.py for correctness.
Look for:
- Proper ForeignKey definitions
- Correct default values
- Data preservation logic


Step 3: Generate migrations for subjects app
─────────────────────────────────────────────
python manage.py makemigrations subjects

This will create:
  subjects/migrations/002X_coursemodels.py

Includes:
- CourseCategory
- CourseType
- Course
- CourseUnit
- CourseTopic

Step 4: Review subjects migrations
──────────────────────────────────
Verify the migrations handle the FK to CampusSchoolDepartment correctly.


Step 5: Apply core migrations
──────────────────────────────
python manage.py migrate core

This updates the database schema for the core app.

✓ Tables created: Campus, School, CampusSchool, CampusSchoolDepartment
✓ Department table modified with new columns
✓ ForeignKey constraints added


Step 6: Apply subjects migrations
─────────────────────────────────
python manage.py migrate subjects

Creates tables for:
✓ CourseCategory
✓ CourseType
✓ Course
✓ CourseUnit
✓ CourseTopic

Step 7: Verify database integrity
──────────────────────────────────
Optional: Run tests to ensure everything works:
  python manage.py test

Optional: Create test fixtures:
  # See PART 5 for sample data setup


ROLLBACK STRATEGY (if needed):
──────────────────────────────
To revert migrations (only if deployment fails):

python manage.py migrate core 0001
python manage.py migrate subjects 0001

(Replace 0001 with the previous migration number)

This will:
- Drop Campus, School, CampusSchool, CampusSchoolDepartment tables
- Restore Department to original state
- Drop CourseCategory, CourseType, Course, CourseUnit, CourseTopic tables
"""

# ════════════════════════════════════════════════════════════════════════════
# PART 4: API ENDPOINTS REFERENCE
# ════════════════════════════════════════════════════════════════════════════

"""
New API endpoints should follow this structure (add to urls.py):

from rest_framework.routers import DefaultRouter
from core.views import CampusViewSet, SchoolViewSet, DepartmentViewSet, ...
from subjects.views import CourseViewSet, CourseUnitViewSet, ...

router = DefaultRouter()
router.register('campuses', CampusViewSet, basename='campus')
router.register('schools', SchoolViewSet, basename='school')
router.register('departments', DepartmentViewSet, basename='department')
router.register('campus-schools', CampusSchoolViewSet, basename='campus-school')
router.register('campus-school-departments', CampusSchoolDepartmentViewSet, basename='csd')
router.register('programmes', ProgrammeViewSet, basename='programme')
router.register('curriculum-versions', CurriculumVersionViewSet, basename='curriculum-version')

router.register('courses', CourseViewSet, basename='course')
router.register('course-categories', CourseCategoryViewSet, basename='course-category')
router.register('course-types', CourseTypeViewSet, basename='course-type')
router.register('course-units', CourseUnitViewSet, basename='course-unit')
router.register('course-topics', CourseTopicViewSet, basename='course-topic')

urlpatterns = [
    path('api/', include(router.urls)),
]

EXAMPLE API USAGE:

List all campuses:
  GET /api/campuses/

Get campus detail:
  GET /api/campuses/{id}/

Create new campus:
  POST /api/campuses/
  {
      "campus_code": "MAIN",
      "name": "Main Campus",
      "address": "..."
  }

List courses in a department:
  GET /api/courses/?campus_school_department={csd_id}

Get course with all units and topics:
  GET /api/courses/{id}/

Create course:
  POST /api/courses/
  {
      "course_code": "CSC101",
      "course_name": "Introduction to Programming",
      "campus_school_department": {csd_id},
      "lecture_hours": 3,
      "tutorial_hours": 1,
      "credits": 4
  }
"""

# ════════════════════════════════════════════════════════════════════════════
# PART 5: DATA SETUP & SAMPLE FIXTURES
# ════════════════════════════════════════════════════════════════════════════

"""
CREATING INITIAL DATA:

Using Django Shell:
───────────────────
cd backend
python manage.py shell

> from core.models import Campus, School, CampusSchool, Department, CampusSchoolDepartment
> from django.contrib.auth import get_user_model
> User = get_user_model()

# Get an admin user or create one for created_by
admin_user = User.objects.filter(is_staff=True).first()

# Create Campus
campus = Campus.objects.create(
    campus_code="MAIN",
    name="Main Campus",
    address="123 University Road",
    created_by=admin_user
)

# Create School
school = School.objects.create(
    school_code="ENGR",
    name="School of Engineering",
    created_by=admin_user
)

# Map School to Campus
CampusSchool.objects.create(campus=campus, school=school)

# Create Department
dept = Department.objects.create(
    code="CSC",
    name="Computer Science",
    status="ACTIVE",
    created_by=admin_user
)

# Map Department to Campus-School
CampusSchoolDepartment.objects.create(
    campus=campus,
    school=school,
    department=dept
)

# All done! Now you can create Courses under this hierarchy


Using Data Fixtures (JSON):
────────────────────────────
Create file: backend/core/fixtures/initial_hierarchy.json

[
    {
        "model": "core.campus",
        "pk": 1,
        "fields": {
            "campus_code": "MAIN",
            "name": "Main Campus",
            "address": "123 University Road",
            "is_active": true,
            "created_by": 1
        }
    },
    {
        "model": "core.school",
        "pk": 1,
        "fields": {
            "school_code": "ENGR",
            "name": "School of Engineering",
            "is_active": true,
            "created_by": 1
        }
    },
    ...
]

Load with:
  python manage.py loaddata initial_hierarchy


IMPORTANT:
──────────
- User account with id=1 must exist before loading fixtures
- created_by and modified_by ForeignKeys need valid User ids
- Ensure unique constraints are satisfied (campus_code, school_code, etc.)
"""

# ════════════════════════════════════════════════════════════════════════════
# PART 6: SERIALIZER & VIEWS INTEGRATION
# ════════════════════════════════════════════════════════════════════════════

"""
VIEWSET PATTERNS (implement in core/views.py and subjects/views.py):

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from core.models import Campus, School, Department, CampusSchoolDepartment
from core.serializers import CampusDetailSerializer, CampusListSerializer
from subjects.models import Course
from subjects.serializers import CourseDetailSerializer, CourseListSerializer


class CampusViewSet(viewsets.ModelViewSet):
    queryset = Campus.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['campus_code', 'name']
    ordering_fields = ['name', 'created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CampusDetailSerializer
        return CampusListSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'is_active']
    search_fields = ['code', 'name']
    ordering_fields = ['name', 'code']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DepartmentDetailSerializer
        return DepartmentListSerializer


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.select_related(
        'category', 'course_type', 'campus_school_department'
    ).prefetch_related('units')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'category', 'course_type', 'campus_school_department']
    search_fields = ['course_code', 'course_name']
    ordering_fields = ['course_code', 'created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseListSerializer
"""

# ════════════════════════════════════════════════════════════════════════════
# PART 7: TESTING CHECKLIST
# ════════════════════════════════════════════════════════════════════════════

"""
PRE-DEPLOYMENT TESTS:
──────────────────────

□ Database tests
  □ Migrations apply cleanly
  □ All new tables exist with correct structure
  □ Indexes created properly
  □ ForeignKey constraints working
  □ Unique constraints enforced

□ Model tests
  □ Campus model operations (create, update, delete)
  □ School model operations
  □ CampusSchool mappings
  □ CampusSchoolDepartment mappings
  □ Department updated fields work
  □ Course model and hierarchy
  □ CourseUnit creation under Course
  □ CourseTopic creation under Unit

□ Relationship tests
  □ Can query courses by campus_school_department
  □ Can query all units of a course
  □ Can query all topics of a unit
  □ Cascading deletes work correctly
  □ Nullable ForeignKeys (category, course_type) work

□ API tests
  □ Can list campuses
  □ Can create course with all required fields
  □ Can filter courses by department
  □ Can retrieve course with nested units/topics
  □ Serializers output correct field values

□ Backward compatibility tests
  □ Subject model still works
  □ User model unchanged
  □ Programme model unchanged
  □ CurriculumVersion unchanged
  □ Existing Subject workflow unaffected
  □ Existing approval records intact

□ Admin interface tests
  □ Can add/edit/delete campuses in admin
  □ Can add/edit/delete courses in admin
  □ Can add units inline within course
  □ Can add topics inline within unit
  □ created_by/modified_by auto-populated

□ Performance tests
  □ Query with select_related for ForeignKeys
  □ Query with prefetch_related for reverse relations
  □ Large course lists load reasonably
"""

# ════════════════════════════════════════════════════════════════════════════
# PART 8: IMPORTANT NOTES & GOTCHAS
# ════════════════════════════════════════════════════════════════════════════

"""
IMPORTANT CONSIDERATIONS:

1. Department.code uniqueness
   ─────────────────────────
   The code field is NO LONGER globally unique.
   Uniqueness is now enforced at the CampusSchoolDepartment level.
   
   Example:
   - Computer Science dept with code "CSC" can exist in multiple schools/campuses
   - Each combination (Campus, School, Department) is unique
   
   Migration: The migration should handle removing the old unique constraint
   and creating the new one at the CampusSchoolDepartment level.

2. User department FK still works
   ──────────────────────────────
   User.department still FK → Department (unchanged)
   This means a user can belong to one department, but that department
   might be accessible through multiple Campus-School combinations.
   
   To get all school-campus where a user's department operates:
     def get_user_campus_schools(user):
       if not user.department:
           return []
       return user.department.campus_school_mappings.filter(is_active=True)

3. Course vs Subject relationship (Optional extension)
   ───────────────────────────────────────────────────
   Currently, Course and Subject are independent.
   Future enhancement: Add optional FK from Subject → Course
   This would let syllabi reference their base course definition.

4. created_by / modified_by handling in migrations
   ────────────────────────────────────────────────
   Migrations for Department and other models add created_by/modified_by FKs
   
   If applying migrations on existing system:
   - Will need to set existing records' created_by/modified_by to a valid user
   - Migration may have data migration step to handle this
   - Usually defaults to first admin user or can be set to NULL (if allowed)

5. Admin auto-population of created_by/modified_by
   ──────────────────────────────────────────────────
   Admin save_model() methods automatically set:
   - created_by = request.user (on create)
   - modified_by = request.user (on every save)
   
   This ensures audit trail in Django admin.

6. Performance implications
   ─────────────────────────
   New indexes added on:
   - Campus: campus_code, is_active
   - School: school_code, is_active
   - Department: code, status
   - CampusSchool: campus/school is_active combinations
   - Course: course_code, is_active, campus_school_department/category combos
   - CourseUnit: unit in course + is_active
   - CourseTopic: topic in unit + is_active
   
   These ensure efficient queries.

7. String references for ForeignKeys
   ──────────────────────────────────
   All ForeignKeys from one app to another use string references:
   'core.Department', 'accounts.User', etc.
   
   This avoids circular import issues.

8. Backward compatibility guarantee
   ────────────────────────────────
   ✓ Subject model NOT modified (only enhanced with new methods if needed)
   ✓ User model NOT modified
   ✓ Programme model NOT modified
   ✓ CurriculumVersion NOT modified
   ✓ Existing migrations NOT modified
   ✓ No data loss on existing tables
   ✓ Existing workflows completely preserved
   
   The refactoring is ADDITIVE, not destructive.
"""

# ════════════════════════════════════════════════════════════════════════════
# PART 9: DEPLOYMENT CHECKLIST
# ════════════════════════════════════════════════════════════════════════════

"""
PRODUCTION DEPLOYMENT STEPS:

PRE-DEPLOYMENT (dev/staging):
─────────────────────────────
□ Review all changes in Git
□ Run all model/view tests
□ Test migrations on staging database copy
□ Verify backward compatibility
□ Load sample data and validate
□ Test API endpoints  
□ Performance test with realistic data volume
□ Test admin interface
□ Check for any circular import issues
□ Verify all __str__ methods work

DEPLOYMENT (production):
────────────────────────
□ Create database backup
  python manage.py dumpdata > backup.json

□ Collect static files (if needed)
  python manage.py collectstatic

□ Apply migrations (in correct order!)
  python manage.py migrate core
  python manage.py migrate subjects

□ Create any required superusers/admins:
  python manage.py createsuperuser

□ Load initial hierarchy if needed:
  python manage.py loaddata initial_hierarchy

□ Run health check
  python manage.py check

□ Test critical API endpoints

□ Monitor logs for errors

POST-DEPLOYMENT:
────────────────
□ Verify database tables created
□ Spot-check data integrity
□ Monitor application for errors
□ Verify API response times
□ Check admin access works
□ Communicate changes to team
"""

# ════════════════════════════════════════════════════════════════════════════
# PART 10: QUICK REFERENCE COMMANDS
# ════════════════════════════════════════════════════════════════════════════

"""
cd backend

# Generate migrations
python manage.py makemigrations core
python manage.py makemigrations subjects

# Show what migrations will do
python manage.py sqlmigrate core 0002
python manage.py sqlmigrate subjects 0002

# Apply migrations
python manage.py migrate core
python manage.py migrate subjects

# Check for issues
python manage.py check

# Test
python manage.py test

# Interactive shell to test models
python manage.py shell

# Create admin user
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Backup database
python manage.py dumpdata > backup.json

# Load fixtures
python manage.py loaddata initial_hierarchy

# Show all migrations
python manage.py showmigrations

# Rollback migrations
python manage.py migrate core 0001
"""
