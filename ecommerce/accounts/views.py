from django.shortcuts import render,redirect
from django.contrib import messages
from django.contrib.auth import authenticate,login,logout
from rest_framework import generics
from .serializer import *
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST

class SignupView(generics.CreateAPIView):
    queryset=User.objects.all()
    serializer_class= SignUpSerializer


#LOGIN_LOGIC ===========================================================================================================================

def login_view(request):
    if request.method=='POST':
        username_or_email=request.POST.get('username')
        password=request.POST.get('password')

        user=authenticate(request,username=username_or_email,password=password)

        if user is None:
            try:
                user_obj=User.objects.get(email=username_or_email)
                user=authenticate(request,username=user_obj.username,password=password)
            except User.DoesNotExist:
                user=None

        if user:
            login(request,user)
            messages.success(request,"Logged in successfully.")
            return redirect('home')
        else:
            messages.error(request,"Invalid Credentials,please try again.")
            return render(request,'login.html')
        
    return render(request, 'login.html')


#SIGNUP_LOGIC ==========================================================================================================================

def signup_view(request):
    if request.method=='POST':
        username=request.POST.get("username")
        email=request.POST.get("email")
        password=request.POST.get("password")
        confirm_password=request.POST.get("confirm_password")

        if not username or not email or not password or not confirm_password:
            messages.error(request, "Please fill all the fields.")
            return redirect('signup')
        
        # --- USERNAME VALIDATION ---
        if not (5 <= len(username) <= 15):
            messages.error(request, "Username must be between 5 to 15 characters.")
            return redirect('signup')

        if not username[0].islower():
            messages.error(request, "The first character of the username must be lowercase.")
            return redirect('signup')

        if not username.isalnum():
            messages.error(request, "Username must contain only letters and numbers (no special characters).")
            return redirect('signup')

        if not any(char.islower() for char in username):
            messages.error(request, "Username must include at least one lowercase letter.")
            return redirect('signup')


        # --- PASSWORD VALIDATION ---
        if not (9 <= len(password) <= 15):
            messages.error(request, "Password must be between 9 to 15 characters.")
            return redirect('signup')

        if not any(char.isdigit() for char in password):
            messages.error(request, "Password must contain at least 1 number.")
            return redirect('signup')

        if not password[0].isupper():
            messages.error(request, "Password must start with a capital letter.")
            return redirect('signup')

        if not any(not char.isalnum() for char in password):
            messages.error(request, "Password must contain at least one special character.")
            return redirect('signup')

        if not any(char.islower() for char in password):
            messages.error(request, "Password must contain at least one lowercase letter.")
            return redirect('signup')
                
        if password != confirm_password:
            messages.error(request, "Passwords do not match.❌")
            return redirect('signup')
        
        if User.objects.filter(username=username).exists():
            messages.error(request, "username already exists.❌")
            return redirect('signup')
        
        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already exists.❌")
            return redirect(request, 'signup')
        
        user=User.objects.create_user(
           username=username,
           email=email,
           password=password,
        )
        user.save()

        messages.success(request, "Account Successfully created.... you can login now😊")
        return redirect('/')
    
    return render(request, 'signup.html')


#logout logic=========================================================================================================================
@require_POST
def logout_view(request):
    logout(request)
    return redirect('login')



        

         


