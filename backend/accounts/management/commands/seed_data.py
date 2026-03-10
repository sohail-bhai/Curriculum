from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Department, Programme, CurriculumVersion

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with initial departments, programmes, and test users'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING('🏗  Seeding CurriculumOS database...'))

        # Departments
        depts = {}
        for code, name in [('CSE','Computer Science and Engineering'),
                            ('ECE','Electronics and Communication Engineering'),
                            ('MECH','Mechanical Engineering')]:
            d, created = Department.objects.get_or_create(code=code, defaults={'name': name})
            depts[code] = d
            self.stdout.write(f"  {'✓ Created' if created else '  Exists'}: Dept {code}")

        # Programme
        prog, _ = Programme.objects.get_or_create(
            code='BCSE',
            defaults={'name': 'B.Tech CSE', 'department': depts['CSE'], 'degree_type': 'UG'}
        )

        # Curriculum Version
        cv, _ = CurriculumVersion.objects.get_or_create(
            programme=prog, version='2024',
            defaults={'regulation_year': 2024, 'status': 'ACTIVE'}
        )

        # Users
        test_users = [
            ('hod_cse@univ.edu', 'hod_cse', 'Rajesh', 'Kumar', 'HOD', 'HOD123!', 'CSE', 'HOD001', 'Head of Department'),
            ('faculty1@univ.edu', 'faculty1', 'Priya', 'Sharma', 'FACULTY', 'Fac123!', 'CSE', 'FAC001', 'Assistant Professor'),
            ('faculty2@univ.edu', 'faculty2', 'Arun', 'Verma', 'FACULTY', 'Fac123!', 'CSE', 'FAC002', 'Associate Professor'),
            ('faculty3@univ.edu', 'faculty3', 'Meena', 'Rajan', 'FACULTY', 'Fac123!', 'CSE', 'FAC003', 'Professor'),
            ('dean@univ.edu', 'dean', 'S.V.', 'Narayanan', 'DEAN', 'Dean123!', None, 'DEAN01', 'Dean of Engineering'),
            ('bos@univ.edu', 'bos1', 'G.', 'Subramaniam', 'BOS', 'Bos123!', 'CSE', 'BOS001', 'BOS Chairperson'),
        ]

        created_hod = None
        for email, uname, first, last, role, pwd, dept_code, emp_id, desig in test_users:
            dept = depts.get(dept_code) if dept_code else None
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': uname,
                    'first_name': first,
                    'last_name': last,
                    'role': role,
                    'department': dept,
                    'employee_id': emp_id,
                    'designation': desig,
                }
            )
            if created:
                user.set_password(pwd)
                user.save()
                self.stdout.write(self.style.SUCCESS(
                    f"  ✓ Created {role:8s}: {email} / {pwd}"
                ))
            else:
                self.stdout.write(f"  Exists: {email}")
            if role == 'HOD':
                created_hod = user

        # Link HOD to department
        # HOD is linked via User.department FK — no extra save needed
        if created_hod:
            self.stdout.write(f"  ✓ HOD linked to CSE via User.department")
            self.stdout.write(f"  ✓ Linked HOD to CSE department")

        self.stdout.write(self.style.SUCCESS('\n✅ Seed complete!'))
        self.stdout.write('\nLogin credentials:')
        self.stdout.write('  HOD:     hod_cse@univ.edu  / HOD123!')
        self.stdout.write('  Faculty: faculty1@univ.edu / Fac123!')
        self.stdout.write('  Dean:    dean@univ.edu     / Dean123!')
