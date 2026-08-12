from django.contrib import admin
from django.urls import path,include
from django.conf.urls.static import static
from .views import *
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls), 

    path('' , Home , name = 'Home'),
    path('project/<int:id>/' , Projects , name = 'project'),
    path('contact/', Contact , name='contact'),
    path('academic/' , Academic , name='academic'),
] 

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)