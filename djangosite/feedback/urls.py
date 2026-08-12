from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from .views import FeedbackViewSet

router = DefaultRouter()
router.register(r'feedback', FeedbackViewSet, basename='feedback')

urlpatterns = [
    path('', views.feedback_form, name='feedback-form'),
    path('success/', views.feedback_success, name='feedback-success'),
    path('api/', include(router.urls)),
]
