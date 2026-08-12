from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages

def login_view(request):
    if request.user.is_authenticated:
        if request.user.role == "Admin":
            return redirect("home")
        elif request.user.role == "Branch":
            return redirect("branch_dashboard")

    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)

        if user is not None:
            # Auto-treat Django superusers as Admin
            if user.is_superuser and user.role not in ("Admin", "Branch"):
                user.role = "Admin"
                user.save(update_fields=["role"])

            login(request, user)

            if user.role == "Admin" or user.is_superuser:
                return redirect("home")

            elif user.role == "Branch":
                return redirect("branch_dashboard")

            else:
                messages.error(request, "Invalid user role.")
        else:
            messages.error(request, "Invalid username or password.")

    return render(request, "accounts/login.html")


def logout_view(request):
    logout(request)
    return redirect("login")