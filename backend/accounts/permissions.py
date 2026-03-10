from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrHOD(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser or
            request.user.role in ('HOD', 'ADMIN', 'ACADEMIC', 'DEAN')
        )


class IsSelfOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_superuser or obj == request.user


class IsFaculty(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'FACULTY'


class IsHOD(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'HOD'


class IsHODOrAbove(BasePermission):
    ALLOWED_ROLES = ('HOD', 'ACADEMIC', 'BOS', 'DEAN', 'ADMIN')

    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser or
            request.user.role in self.ALLOWED_ROLES
        )


class IsFacultyOrHOD(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('FACULTY', 'HOD')
