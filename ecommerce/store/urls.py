from django.urls import path,include
from .views import *
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'category', CategoryViewSet)
router.register(r'product', ProductViewSet)
router.register(r'order', OrderViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('', home, name='home'),
    path('product/',product,name='product'),
    path("product/<int:id>/", product_detail, name="product_detail"),
    
]
