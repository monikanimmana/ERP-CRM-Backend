from rest_framework import serializers
from .models import *

class CategorySerializer(serializers.ModelSerializer):
    category_img = serializers.ImageField(use_url=True)
    class Meta:
        model=Category
        fields='__all__'

class ProductSerializer(serializers.ModelSerializer):
    product_img = serializers.ImageField(use_url=True)
    class Meta:
        model=Product
        fields='__all__'

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model=Order
        fields='__all__'
        read_only_fields=('total_price',)