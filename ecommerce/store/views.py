from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from .serializer import *
from .models import *
from django.contrib.auth.decorators import login_required


# Create your views here.
class CategoryViewSet(ModelViewSet):
    queryset=Category.objects.all()
    serializer_class=CategorySerializer

class ProductViewSet(ModelViewSet):
    queryset=Product.objects.all()
    serializer_class=ProductSerializer

class OrderViewSet(ModelViewSet):
    queryset=Order.objects.all()
    serializer_class=OrderSerializer

def home(request):
    return render(request, 'home.html')

def product(request):
    return render(request, 'product.html')

def product_detail(request, id):
    return render(request, "productdetails.html", {"product_id": id})





