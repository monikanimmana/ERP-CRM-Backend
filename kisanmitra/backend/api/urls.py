from django.urls import path
from . import views

urlpatterns = [
    path("voice/process", views.voice_process),
    path("dashboard", views.dashboard),
    path("expenses", views.expense_list),
    path("expenses/<uuid:pk>", views.expense_detail),
    path("tasks", views.task_list),
    path("tasks/<uuid:pk>", views.task_detail),
    path("demo/reset", views.demo_reset),
    path("health", views.health),
]
