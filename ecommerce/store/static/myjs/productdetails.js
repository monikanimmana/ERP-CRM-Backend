async function loadProduct() {
    const response = await fetch(`/api/products/${PRODUCT_ID}/`);
    const product = await response.json();

    document.getElementById("productImage").src = product.product_img;
    document.getElementById("productName").innerText = product.product_name;
    document.getElementById("productPrice").innerText = "₹ " + product.price;

    // Description as bullet list
    const descList = document.getElementById("productDescription");
    descList.innerHTML = "";

    product.description.split(".").forEach(line => {
        if (line.trim()) {
            descList.innerHTML += `<li>${line}</li>`;
        }
    });
}

function addToCart() {
    alert("Added to cart (next step)");
}

loadProduct();
