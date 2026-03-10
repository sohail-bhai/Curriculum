from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    CustomTokenObtainPairSerializer, UserProfileSerializer,
    UserCreateSerializer, ChangePasswordSerializer, FacultyListSerializer
)
from .permissions import IsAdminOrHOD, IsSelfOrAdmin

User = get_user_model()


class LoginView(TokenObtainPairView):
    """POST /api/v1/auth/login/ — returns access + refresh tokens + user profile."""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    """POST /api/v1/auth/logout/ — blacklists the refresh token."""
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Logged out successfully.'}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/auth/me/ — retrieve or update the authenticated user."""
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """PUT /api/v1/auth/change-password/"""
    serializer_class = ChangePasswordSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password updated successfully.'})


class UserListView(generics.ListCreateAPIView):
    """GET /api/v1/auth/users/ — admin list + create users."""
    permission_classes = [IsAdminOrHOD]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserProfileSerializer

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.select_related('department')
        # HOD can only see faculty in their department
        if user.is_hod():
            qs = qs.filter(department=user.department, role='FACULTY')
        return qs


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/v1/auth/users/<id>/"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsSelfOrAdmin]
    queryset = User.objects.select_related('department')


class FacultyListView(generics.ListAPIView):
    """GET /api/v1/auth/faculty/ — list faculty, optionally filtered by department."""
    serializer_class = FacultyListSerializer

    def get_queryset(self):
        qs = User.objects.filter(role='FACULTY', is_active=True).select_related('department')
        dept_id = self.request.query_params.get('department')
        if dept_id:
            qs = qs.filter(department_id=dept_id)
        # HOD sees only their department's faculty
        if self.request.user.is_hod():
            qs = qs.filter(department=self.request.user.department)
        return qs
