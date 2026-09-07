from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.authtoken.models import Token


class CookieTokenAuthentication(BaseAuthentication):

    def authenticate(self, request):
        
        # 1. Try Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Token "):
            token_key = auth_header.split(" ")[1]
        else:
            # 2. Try Cookie
            token_key = request.COOKIES.get("auth_token")

        if not token_key:
            return None

        try:
            token = Token.objects.select_related("user").get(
                key=token_key
            )
        except Token.DoesNotExist:
            raise AuthenticationFailed("Invalid authentication token.")

        if not token.user.is_active:
            raise AuthenticationFailed("User account is inactive.")

        return (token.user, token)
        
    def authenticate_header(self, request):
        return 'Token'