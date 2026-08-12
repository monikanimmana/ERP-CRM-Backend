const productGrid = document.querySelector(".products-grid");

async function loadProducts() {
    try{
        const response = await fetch("/api/product/");
        const products = await response.json();
        productGrid.innerHTML="";

        products.forEach( product => {
            productGrid.innerHTML += `
            <article class="product" onclick="goToProduct(${product.id})">

            <article class="product">
                    <div class="product-img-wrap">
                        <img src="${product.product_img}" alt="${product.product_name}">
                        <div class="product-tag">New</div>
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.product_name}</h3>
                        <div class="product-meta">
                            <span class="price">$${product.price}</span>
                        </div>
                    </div>
                </article>
             `;
            });
        }catch (error){
            console.log("Error loading products:", error);
        }
    }

function goToProduct(id) {
    window.location.href = `/product/${id}/`;
}



loadProducts();

    

