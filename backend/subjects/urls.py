from django.urls import path
from . import views

urlpatterns = [
    # HOD subject management
    path('subjects/hod/', views.HODSubjectListCreateView.as_view(), name='hod-subjects'),
    path('subjects/hod/<int:pk>/', views.HODSubjectDetailView.as_view(), name='hod-subject-detail'),
    path('subjects/hod/<int:pk>/reassign/', views.HODReassignView.as_view(), name='hod-reassign'),
    path('subjects/hod/<int:pk>/approve/', views.HODApproveView.as_view(), name='hod-approve'),
    path('subjects/hod/<int:pk>/request-revision/', views.HODRequestRevisionView.as_view(), name='hod-revision'),

    # Faculty subject dashboard
    path('subjects/faculty/', views.FacultySubjectListView.as_view(), name='faculty-subjects'),
    path('subjects/faculty/<int:pk>/', views.FacultySubjectDetailView.as_view(), name='faculty-subject-detail'),

    # Faculty module saves
    path('subjects/<int:pk>/module/1/', views.Module1SaveView.as_view(), name='module-1'),
    path('subjects/<int:pk>/module/2/', views.Module2SaveView.as_view(), name='module-2'),
    path('subjects/<int:pk>/module/3/', views.Module3SaveView.as_view(), name='module-3'),
    path('subjects/<int:pk>/module/4/', views.Module4SaveView.as_view(), name='module-4'),
    path('subjects/<int:pk>/module/5/', views.Module5SaveView.as_view(), name='module-5'),
    path('subjects/<int:pk>/module/6/', views.Module6SaveView.as_view(), name='module-6'),

    # Module data retrieval (GET current saved data)
    path('subjects/<int:pk>/module/<int:module_num>/data/', views.SubjectModuleDataView.as_view(), name='module-data'),

    # Workflow
    path('subjects/<int:pk>/submit/', views.SubmitToHODView.as_view(), name='submit'),
    path('subjects/<int:pk>/retract/', views.RetractSubmissionView.as_view(), name='retract'),

    # Full subject (preview + document)
    path('subjects/<int:pk>/full/', views.SubjectFullView.as_view(), name='subject-full'),
]
