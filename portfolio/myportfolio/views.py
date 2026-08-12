from django.shortcuts import render , get_object_or_404 ,redirect
from .models import *

# Create your views here.

def Home(request):
    intro = Intro.objects.first()
    skill = Skill.objects.all()
    projects = Project.objects.all()
    url_link = SocialMedia.objects.first()
    return render(request, 'portfolio_html/index.html' , {
        'intro' : intro,
        'skill': skill,
        'projects': projects,
        'url_link' : url_link,
    })

def Projects(request, id):
    project = get_object_or_404(Project, id=id)
    intro = Intro.objects.first()

    return render(request, 'portfolio_html/project.html', {
        'project': project,
        'intro': intro,
    })
    
def Contact(request):
    if request.method == 'POST':
        visitor_name = request.POST.get('name')
        visitor_email = request.POST.get('email')
        visitor_message = request.POST.get('message')

        contact.objects.create(
            visitor_name = visitor_name,
            visitor_email = visitor_email,
            visitor_message = visitor_message,
        )

        return redirect('/')

def Academic(request):
    intro = Intro.objects.first()
    academic_qualification = Academic_Qualification.objects.all()
    academic_result = Academic_Result.objects.all()
    academic_certificate = Academic_Certificate.objects.all()
    resume = Resume.objects.first()
    return render(request , 'portfolio_html/academic.html' , {
        'intro' : intro,
        'academic_qualification' : academic_qualification,
        'academic_result' : academic_result,
        'academic_certificate' : academic_certificate,
        'resume' : resume,
    })



