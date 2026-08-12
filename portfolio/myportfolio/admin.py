from django.contrib import admin
from .models import *

# Register your models here.
@admin.register(Intro)
class Introadmin(admin.ModelAdmin):
     def has_add_permission(self, request):
        if Intro.objects.exists():
            return False
        return True

admin.site.register(Skill)
admin.site.register(Project)
admin.site.register(contact)  
admin.site.register(SocialMedia)
admin.site.register(Academic_Qualification)
admin.site.register(Academic_Result)
admin.site.register(Academic_Certificate)
admin.site.register(Resume)
admin.site.register(TechStack)
