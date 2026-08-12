from django.db import models

# Create your models here.
class Category(models.Model):
    title=models.CharField(max_length=100)
    category_img=models.ImageField(upload_to='category/',null=True,blank=True)

    def __str__(self):
        return self.title
    

class Product(models.Model):
    product_name=models.CharField(max_length=100)
    description=models.TextField()
    price=models.DecimalField(max_digits=10,decimal_places=2)
    stock=models.IntegerField(default=0)
    product_img=models.ImageField(upload_to='products/',null=True,blank=True)
    category=models.ForeignKey(Category,on_delete=models.CASCADE)

    def __str__(self):
        return self.product_name
    
class Order(models.Model):
    customer_name=models.CharField(max_length=100)
    product=models.ForeignKey(Product,on_delete=models.CASCADE)
    quantity=models.PositiveIntegerField()
    total_price=models.DecimalField(max_digits=10,decimal_places=2)
    order_date=models.DateTimeField(auto_now_add=True)

    def save(self,*args,**kwargs):
        self.total_price= self.product.price * self.quantity
        super().save(*args,**kwargs)

    def __str__(self):
        return f"order {self.id} - {self.customer_name}"
