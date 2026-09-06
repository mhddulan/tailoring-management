import os

from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status


User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    username = request.data.get("username", "").strip()
    pin = request.data.get("pin", "").strip()
    new_password = request.data.get("new_password", "")

    # Check required fields
    if not username or not pin or not new_password:
        return Response(
            {"error": "Username, PIN and new password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check reset PIN
    reset_pin = os.getenv("PASSWORD_RESET_PIN")

    if not reset_pin:
        return Response(
            {"error": "Password reset is not configured."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if pin != reset_pin:
        return Response(
            {"error": "Invalid reset PIN."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Find user
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(
            {"error": "Invalid username or reset PIN."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Basic password validation
    if len(new_password) < 8:
        return Response(
            {"error": "Password must contain at least 8 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Reset password
    user.set_password(new_password)
    user.save(update_fields=["password"])

    return Response(
        {"message": "Password changed successfully."},
        status=status.HTTP_200_OK,
    )