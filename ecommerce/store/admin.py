from django.contrib import admin
from .models import *

# Register your models here.
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display=('id','title',)
    search_fields=('title',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display=('id','product_name','category','price')
    list_filter=('category',)
    search_fields=('product_name','category__title',)
    list_editable=('price',)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display=('id','customer_name','product','quantity','total_price','order_date',)
    list_filter=('order_date','product',)
    search_fields=('customer_name','product__product_name',)
    readonly_fields=('order_date','total_price',)


