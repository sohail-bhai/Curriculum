# CURRICULUM OS v2.1 - DATABASE SCHEMA OVERVIEW

## Entity Relationship Diagram (ERD) - Text Format

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                          ACADEMIC HIERARCHY (NEW)                             ║
╠════════════════════════════════════════════════════════════════════════════════╣

┌─────────────────┐
│    CAMPUS       │   (Physical Locations)
├─────────────────┤
│ id [PK]         │
│ campus_code [U] │   e.g., "MAIN", "BRANCH"
│ name            │
│ address         │
│ is_active       │
│ created_by [FK→User]
│ created_at      │
│ modified_by [FK→User]
│ modified_at     │
└─────────────────┘
        │
        │ 1:M
        ├──────────────────────────┐
        │                          │
        ▼                          ▼

┌──────────────────────┐   ┌──────────────────────┐
│ CampusSchool(M2M)    │   │     SCHOOL           │
├──────────────────────┤   ├──────────────────────┤
│ id [PK]              │   │ id [PK]              │
│ campus_id [FK] ──┐   │   │ school_code [U]      │
│ school_id [FK] ──┼───┼──│ name                 │
│ is_active        │   │   │ description          │
│ created_at       │   │   │ is_active            │
│ modified_at      │   │   │ created_by [FK→User] │
│ [UC: campus+     │   │   │ created_at           │
│     school]      │   │   │ modified_by [FK→User]
└──────────────────────┘   │ modified_at          │
                           └──────────────────────┘
                                    │
                                    │ 1:M
                                    ▼
                           ┌──────────────────────┐
                           │ CampusSchoolDept(M2M)│
                           ├──────────────────────┤
                           │ id [PK]              │
                           │ campus_id [FK] ──┐  │
                           │ school_id [FK] ──┼──┼──┐
                           │ department_id [FK]──┼──┼───┐
                           │ is_active        │  │  │   │
                           │ created_at       │  │  │   │
                           │ modified_at      │  │  │   │
                           │ [UC: campusId+   │  │  │   │
                           │     schoolId+    │  │  │   │
                           │     departmentId]│  │  │   │
                           └──────────────────────┘  │   │
                                    ▲               │   │
                                    │               │   │
                                    └───────────────┘   │
                                                        │
                                    ┌───────────────────┘
                                    │
                                    ▼

                           ┌──────────────────────┐
                           │   DEPARTMENT         │ (ENHANCED)
                           ├──────────────────────┤
                           │ id [PK]              │
                           │ code [Indexed] ✓ NEW │  No longer globally unique
                           │ name                 │ ✓ NEW  status (ACTIVE/INACTIVE/ARCHIVED)
                           │ description ✓ NEW    │
                           │ created_by [FK→User] │  ✓ NEW
                           │ created_at           │  (existing - not modified)
                           │ modified_by [FK→User]│  ✓ NEW
                           │ modified_at ✓ NEW    │
                           └──────────────────────┘
                                    │
                                    │ 1:M
                                    ├──────────────────┬─────────────────┐
                                    │                  │                 │
                                    ▼                  ▼                 ▼

                           ┌──────────────────────┐
                           │   PROGRAMME          │ (EXISTING)
                           ├──────────────────────┤
                           │ id [PK]              │
                           │ department_id [FK]   │
                           │ name [U + dept]      │
                           │ code [U]             │
                           │ degree_type          │
                           │ duration_years       │
                           │ created_at           │
                           └──────────────────────┘
                                    │
                                    │ 1:M
                                    ▼

                           ┌──────────────────────┐
                           │ CurriculumVersion    │ (EXISTING)
                           ├──────────────────────┤
                           │ id [PK]              │
                           │ programme_id [FK]    │
                           │ version              │
                           │ regulation_year      │
                           │ status               │
                           │ effective_from       │
                           │ created_at           │
                           │ [UC: prog + version] │
                           └──────────────────────┘
                                    │
                                    │ 1:M
                                    ▼

                           ┌──────────────────────┐
                           │    SUBJECT           │ (EXISTING WORKFLOW MODEL)
                           ├──────────────────────┤
                           │ id [PK]              │
                           │ subject_code         │
                           │ subject_title        │
                           │ department_id [FK]   │
                           │ curriculum_version   │
                           │ assigned_faculty [FK]│
                           │ created_by_hod [FK]  │
                           │ status               │
                           │ [LTPSIC: hours]      │
                           │ [Pre/co-requisites]  │
                           │ [Course description] │
                           │ [SDG justification]  │
                           │ [Audit fields]       │
                           │ [Approval workflow]  │
                           │ etc...               │
                           └──────────────────────┘
                                    │
                                    │ 1:M
                    ┌───────────────┼────────────────┐
                    │               │                │
                    ▼               ▼                ▼

            ┌──────────────┐  ┌─────────────┐  ┌──────────────┐
            │  Objective   │  │    Unit     │  │  CourseOutc. │
            └──────────────┘  └─────────────┘  └──────────────┘
                                    │
                                    │ 1:M
                                    ▼

                           ┌─────────────────┐
                           │    Topic        │
                           └─────────────────┘


╠════════════════════════════════════════════════════════════════════════════════╣
║                       COURSE HIERARCHY (NEW)                                  ║
╠════════════════════════════════════════════════════════════════════════════════╣

                           ┌──────────────────────┐
                           │ CourseCategory       │ (NEW)
                           ├──────────────────────┤
                           │ id [PK]              │
                           │ name [U]             │
                           │ description          │
                           │ is_active            │
                           │ created_at, modified │
                           └──────────────────────┘
                                    │
                                    │ 0:M (nullable FK)
                                    │
                           ┌──────────────────────┐
                           │ CourseType           │ (NEW)
                           ├──────────────────────┤
                           │ id [PK]              │
                           │ name [U]             │
                           │ description          │
                           │ is_active            │
                           │ created_at, modified │
                           └──────────────────────┘
                                    │
                                    │ 0:M (nullable FK)
                                    │
              ┌─────────────────────────────────────────┐
              │                                         │
              ▼                                         ▼

     ┌──────────────────────────────────────────────────────┐
     │                  COURSE (NEW)                        │
     ├──────────────────────────────────────────────────────┤
     │ id [PK]                                              │
     │ course_code [Indexed]                                │
     │ course_name                                          │
     │ description                                          │
     │ objectives                                           │
     │ category_id [FK→CourseCategory, nullable]            │
     │ course_type_id [FK→CourseType, nullable]             │
     │ campus_school_department_id [FK] ────────────┐       │
     │ lecture_hours, tutorial_hours, practical... │       │
     │ studio_hours, independent_hours, credits... │       │
     │ pre_requisite, co_requisite                 │       │
     │ is_active [Indexed]                         │       │
     │ created_by [FK→User]                        │       │
     │ created_at                                  │       │
     │ modified_by [FK→User]                       │       │
     │ modified_at                                 │       │
     │ [UC: course_code + campus_school_dept]      │       │
     └──────────────────────────────────────────────┼───────┘
              │ 1:M                                 │
              │                                    │
              │          (References→)             │
              │                                    │
              └────────────────────────────────────┘
              ▼                                    (Exists in core.CampusSchoolDepartment)

     ┌──────────────────────────────────────────────────────┐
     │           COURSE UNIT (NEW)                          │
     ├──────────────────────────────────────────────────────┤
     │ id [PK]                                              │
     │ course_id [FK]                                       │
     │ unit_number                                          │
     │ unit_title                                           │
     │ description                                          │
     │ hours                                                │
     │ is_active                                            │
     │ created_at, modified_at                              │
     │ [UC: course_id + unit_number]                        │
     └──────────────────────────────────────────────────────┘
              │ 1:M
              │
              ▼

     ┌──────────────────────────────────────────────────────┐
     │           COURSE TOPIC (NEW)                         │
     ├──────────────────────────────────────────────────────┤
     │ id [PK]                                              │
     │ unit_id [FK]                                         │
     │ topic_number                                         │
     │ topic_title                                          │
     │ description                                          │
     │ learning_outcomes                                    │
     │ is_active                                            │
     │ created_at, modified_at                              │
     │ [UC: unit_id + topic_number]                         │
     └──────────────────────────────────────────────────────┘


╠════════════════════════════════════════════════════════════════════════════════╣
║                      CROSS-CUTTING CONCERNS                                   ║
╠════════════════════════════════════════════════════════════════════════════════╣

USER MODEL (accounts.User) - EXISTING (NO CHANGES)
┌─────────────────────────────────────────────────────────┐
│ id [PK]                                                 │
│ email [U]                                               │
│ username [U]                                            │
│ first_name, last_name                                   │
│ role (FACULTY, HOD, ACADEMIC, BOS, DEAN, ADMIN)         │
│ department_id [FK→core.Department, nullable]            │
│ designation, phone, employee_id                         │
│ profile_photo                                           │
│ is_active, created_at, updated_at                       │
└─────────────────────────────────────────────────────────┘
        │
        ├─→ (Can be created_by on Campus, School, Department, Course)
        ├─→ (Can be modified_by on Campus, School, Department, Course)
        ├─→ (Can be assigned_faculty on Subject)
        ├─→ (Can be created_by_hod on Subject)
        └─→ (Can be used in workflows/approvals)

```

## Query Patterns

### 1. Get all users in a department
```python
from django.contrib.auth import get_user_model
User = get_user_model()
users = User.objects.filter(department=dept, is_active=True)
```

### 2. Get courses in a campus-school-department
```python
from subjects.models import Course
courses = Course.objects.filter(
    campus_school_department__campus=campus,
    campus_school_department__school=school,
    campus_school_department__department=dept,
    is_active=True
)
```

### 3. Get all schools on a campus
```python
from core.models import School
schools = School.objects.filter(
    campus_mappings__campus=campus,
    campus_mappings__is_active=True,
    is_active=True
)
```

### 4. Get course with all units and topics (optimized)
```python
from subjects.models import Course
course = Course.objects.prefetch_related(
    'units__topics'
).get(id=course_id)

for unit in course.units.all():
    for topic in unit.topics.all():
        print(f"{unit.unit_title} - {topic.topic_title}")
```

### 5. Get HOD of a department
```python
hod = department.hod  # Uses @property method
```

### 6. Count active courses per department
```python
from django.db.models import Count
from core.models import Department
from subjects.models import Course

depts = Department.objects.annotate(
    course_count=Count('campus_school_mappings__courses', 
                       filter=Q(campus_school_mappings__courses__is_active=True))
)
```

---

## Index Strategy

All indexes are on hot query paths:

| Table | Index | Purpose |
|-------|-------|---------|
| Campus | campus_code | Lookup by code |
| Campus | is_active | Filter active records |
| School | school_code | Lookup by code |
| School | is_active | Filter active records |
| Department | code | Lookup by code (no longer unique) |
| Department | status | Filter by status |
| CampusSchool | (campus, is_active) | List schools on a campus |
| CampusSchool | (school, is_active) | List campuses for a school |
| CampusSchoolDepartment | (campus, is_active) | Hierarchical queries |
| CampusSchoolDepartment | (school, is_active) | Hierarchical queries |
| CampusSchoolDepartment | (department, is_active) | Reverse lookup |
| Course | course_code | Lookup by code |
| Course | is_active | Filter active courses |
| Course | (campus_school_department, is_active) | Courses in hierarchy |
| Course | (category, is_active) | Filter by category |
| CourseUnit | (course, is_active) | Units of a course |
| CourseTopic | (unit, is_active) | Topics of a unit |

---

## Unique Constraints

| Table | Constraint | Reason |
|-------|-----------|--------|
| Campus | campus_code | Globally unique |
| School | school_code | Globally unique |
| Department | code (per hierarchy) | Code + school + campus must be unique |
| CampusSchool | (campus, school) | Each school can map to campus once |
| CampusSchoolDepartment | (campus, school, department) | Each dept maps once per hierarchy |
| Course | (course_code, campus_school_department) | Code unique within hierarchy |
| CourseUnit | (course, unit_number) | Unit numbers ordered within course |
| CourseTopic | (unit, topic_number) | Topic numbers ordered within unit |

---

## Migration Checklist

- [ ] Department.code: Remove unique constraint
- [ ] Department.code: Add index
- [ ] Department: Add status column with default 'ACTIVE'
- [ ] Department: Add description column
- [ ] Department: Add created_by FK
- [ ] Department: Add modified_by FK
- [ ] Department: Add modified_at column
- [ ] Create Campus table with all fields
- [ ] Create School table with all fields
- [ ] Create CampusSchool table with unique constraint
- [ ] Create CampusSchoolDepartment table with unique constraint
- [ ] Create CourseCategory table
- [ ] Create CourseType table
- [ ] Create Course table with FK to CampusSchoolDepartment
- [ ] Create CourseUnit table with unique constraint
- [ ] Create CourseTopic table with unique constraint
- [ ] Verify all ForeignKey constraints
- [ ] Verify all indexes created
- [ ] Run data integrity checks

---

Generated: March 8, 2026
For detailed documentation, see: `REFACTORING_GUIDE.md` and `IMPLEMENTATION_SUMMARY.md`
