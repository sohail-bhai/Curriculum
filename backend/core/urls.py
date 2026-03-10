from django.urls import path
from .views import (
    DepartmentListView, DepartmentDetailView,
    ProgrammeListView, ProgrammeDetailView,
    CurriculumVersionListView, CurriculumVersionDetailView,
)

urlpatterns = [
    path('departments/', DepartmentListView.as_view(), name='department-list'),
    path('departments/<int:pk>/', DepartmentDetailView.as_view(), name='department-detail'),
    path('programmes/', ProgrammeListView.as_view(), name='programme-list'),
    path('programmes/<int:pk>/', ProgrammeDetailView.as_view(), name='programme-detail'),
    path('curriculum-versions/', CurriculumVersionListView.as_view(), name='cv-list'),
    path('curriculum-versions/<int:pk>/', CurriculumVersionDetailView.as_view(), name='cv-detail'),
]
