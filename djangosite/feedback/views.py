from django.shortcuts import render,redirect
from .forms import FeedbackForm
from rest_framework.viewsets import ModelViewSet
from .models import Feedback
from .serializer import FeedbackSerializer

# Create your views here.
def feedback_form(request):
    if request.method=='POST':
        form=FeedbackForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('feedback-success')
    
    else:
        form=FeedbackForm()

    return render(request, 'feedback_form.html',{'form':form})

def feedback_success(request):
    return render(request, 'feedback_success.html')

class FeedbackViewSet(ModelViewSet):
    queryset=Feedback.objects.all()
    serializer_class=FeedbackSerializer



