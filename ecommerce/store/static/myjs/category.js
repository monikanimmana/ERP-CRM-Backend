const categoryGrid = document.querySelector(".category-grid");

async function loadCategory() {
    try{
        const response= await fetch("/api/category/");
        const categories = await response.json();

        categoryGrid.innerHTML="";

        categories.forEach(category => {
            categoryGrid.innerHTML += `
            <article class="category">
                <div class="category-inner">
                    <img
                        src="${category.category_image}"
                        alt="${category.title}"
                    />
                    <h3>${category.title}</h3>
                    <span>${category.title}</span>
                </div>
            </article>
            `;
            
        });
    }
    catch (error){
            console.log("Error loading category:", error);

    }
}
loadCategory();
