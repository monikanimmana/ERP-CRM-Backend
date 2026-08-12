from django.db import models

# Create your models here.
class Feedback(models.Model):
    name=models.CharField(max_length=100)
    email=models.EmailField()
    rating=models.IntegerField(choices=[
        (1, 'Very Bad'),
        (2, 'Bad'),
        (3, 'Average'),
        (4, 'Good'),
        (5, 'Excellent')
    ])
    comments=models.TextField(blank=True, null=True)
    submitted_at=models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.rating}"
