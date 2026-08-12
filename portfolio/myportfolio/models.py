from django.db import models
from .storages import ImageStorage
from cloudinary.models import CloudinaryField
# Create your models here.
class Intro(models.Model):
    logo_name = models.CharField(max_length=20, default="Your Name")
    profile_name = models.CharField(max_length=20,default="Your Name")
    profile_image = models.ImageField(upload_to='myimage/',storage=ImageStorage(), blank=True,null=True)
    role = models.CharField(max_length=30)
    introduction = models.TextField(default="Hi")
    AboutMe = models.TextField()
    Resume = models.ImageField(upload_to = 'resume_pdf/',storage=ImageStorage(), blank= True , null=True)
    footer = models.CharField(max_length=20)

    def __str__(self):
        return self.profile_name
     
class Skill(models.Model):
    title = models.CharField(max_length=20)
    icon = models.CharField(max_length=50 , blank=True )

    def __str__(self):
        return self.title

class Project(models.Model):
    project_title = models.CharField(max_length=100)
    highlights = models.TextField(default="No highlights added yet.")
    project_image = models.ImageField(upload_to='project_image/',storage=ImageStorage(), blank=True , null = True)
    project_description = models.TextField()
    project_overview = models.TextField(default="Project description will be updated soon.")
    project_challenges = models.TextField(blank=True, null=True)
    github_link = models.URLField(blank=True,null=True)

    def __str__(self):
        return self.project_title
    
class contact(models.Model):
    visitor_name = models.CharField(max_length=50)
    visitor_email = models.EmailField()
    visitor_message = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.visitor_name
    
class SocialMedia(models.Model):
    linkedin = models.URLField(blank=True,null=True)
    github = models.URLField(blank=True,null=True)
    email = models.EmailField(blank=True,null=True)
    whatsapp = models.URLField(blank=True,null=True)

class Academic_Qualification(models.Model):
    degree_title = models.CharField(max_length=50)
    department = models.CharField(max_length=50,blank=True , null=True)
    start_year = models.PositiveIntegerField()
    end_year = models.PositiveIntegerField()
    institution_name = models.CharField(max_length=100)
    board = models.CharField(max_length=50 , blank=True , null=True)

    def __str__(self):
        return self.degree_title
    
class Academic_Result(models.Model):
    semester_number = models.PositiveIntegerField()
    SGPA_value = models.DecimalField(max_digits=4,decimal_places=2)
    result_pdf = models.ImageField(upload_to='result_pdf/',storage=ImageStorage(),blank=True,null=True)

    def __str__(self):
        return f"Semester  {self.semester_number}"
    
class Academic_Certificate(models.Model):
    certificate_title = models.CharField(max_length=50)
    certificate_pdf = models.ImageField(upload_to='certificate_pdf/',storage=ImageStorage(),blank=True,null=True)

    def __str__(self):
        return self.certificate_title
    
class Resume(models.Model):
    resume_title = models.CharField(max_length=50)
    resume_pdf = models.ImageField(upload_to='resume/',storage=ImageStorage())

    def __str__(self):
        return self.resume_title
    
class TechStack(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tech_stacks'
    )
    title = models.CharField(max_length=50)
    stack_list = models.TextField()

    def __str__(self):
        return f"{self.title} - {self.project.project_title}"
    


    
    





