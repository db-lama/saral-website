// --- CATEGORY & PRODUCT LOGIC ---
let categories = ["Cosmetics", "Baby Toys", "Seasonal Items"];
let products = [];
let currentCategory = null; // Track the currently selected category

// Search functionality
let currentSearch = '';

function renderCategories() {
    const list = document.getElementById('category-list');
    list.innerHTML = '';
    
    // Add "All Categories" option
    const allCategoriesItem = document.createElement('button');
    allCategoriesItem.className = `list-group-item list-group-item-action ${!currentCategory ? 'active' : ''}`;
    allCategoriesItem.type = 'button';
    allCategoriesItem.innerHTML = '<span>All Categories</span>';
    allCategoriesItem.onclick = () => {
        currentCategory = null;
        renderCategories();
        filterAndDisplayProducts();
    };
    list.appendChild(allCategoriesItem);

    // Add individual categories
    categories.forEach((cat, idx) => {
        const item = document.createElement('button');
        item.className = `list-group-item list-group-item-action d-flex justify-content-between align-items-center ${currentCategory === cat ? 'active' : ''}`;
        item.type = 'button';
        item.innerHTML = `
            <span>${cat}</span>
            <span><button class="btn btn-sm btn-danger ms-2" onclick="removeCategory(${idx});event.stopPropagation();">&times;</button></span>
        `;
        item.onclick = () => {
            currentCategory = cat;
            renderCategories();
            filterAndDisplayProducts();
        };
        list.appendChild(item);
    });

    // Update product upload select
    const select = document.getElementById('productCategory');
    if (select) {
        select.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    // Update the category showcase
    updateCategoryShowcase();
}

function removeCategory(idx) {
    const categoryToRemove = categories[idx];
    categories.splice(idx, 1);
    // Remove products in this category
    products = products.filter(p => p.category !== categoryToRemove);
    
    // If the removed category was selected, reset to all categories
    if (currentCategory === categoryToRemove) {
        currentCategory = null;
    }
    
    renderCategories();
    filterAndDisplayProducts();
}

document.getElementById('addCategoryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const val = document.getElementById('newCategoryName').value.trim();
    if (val && !categories.includes(val)) {
        categories.push(val);
        renderCategories();
        document.getElementById('newCategoryName').value = '';
        bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
    }
});

// --- PRODUCT UPLOAD & DISPLAY ---
const uploadForm = document.getElementById('uploadForm');
const productList = document.getElementById('product-list');

uploadForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const description = document.getElementById('productDescription').value;
    const price = document.getElementById('productPrice').value;
    const inStock = document.getElementById('productInStock').checked;
    const imageInput = document.getElementById('productImage');
    const file = imageInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const newProduct = {
                id: 'product_' + Date.now(),
                name,
                category,
                description,
                price: parseFloat(price),
                inStock,
                image: event.target.result
            };
            products.unshift(newProduct);
            filterAndDisplayProducts();
            updateProductShowcase();
            updateCategoryShowcase();
            uploadForm.reset();
            document.getElementById('productInStock').checked = true;
            var uploadModal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
            uploadModal.hide();
        };
        reader.readAsDataURL(file);
    }
});

function filterAndDisplayProducts() {
    let filtered = products;
    
    // Apply category filter
    if (currentCategory) {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    
    // Apply search filter
    if (currentSearch) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(currentSearch) || 
            p.category.toLowerCase().includes(currentSearch)
        );
    }
    
    // Update category title and product count
    updateCategoryTitle(filtered.length);
    
    // Show search results alert if searching
    const searchAlert = document.getElementById('searchResultsAlert');
    const searchText = document.getElementById('searchResultsText');
    if (currentSearch) {
        searchAlert.classList.remove('d-none');
        searchText.textContent = `Found ${filtered.length} product${filtered.length !== 1 ? 's' : ''} matching "${currentSearch}"`;
    } else {
        searchAlert.classList.add('d-none');
    }
    
    // Render filtered products
    renderFilteredProducts(filtered);
}

function updateCategoryTitle(productCount) {
    const categoryTitle = document.getElementById('categoryTitle');
    const productCountElement = document.getElementById('productCount');
    
    if (currentCategory) {
        categoryTitle.textContent = currentCategory;
    } else {
        categoryTitle.textContent = 'All Products';
    }
    
    productCountElement.textContent = `${productCount} product${productCount !== 1 ? 's' : ''} available`;
}

function renderFilteredProducts(filteredProducts) {
    productList.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        let message = 'No products found.';
        if (currentSearch) {
            message = `No products found matching "${currentSearch}".`;
        } else if (currentCategory) {
            message = `No products found in "${currentCategory}" category.`;
        }
        productList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    ${message}
                </div>
            </div>`;
        return;
    }

    filteredProducts.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        col.setAttribute('data-product-id', product.id);
        col.innerHTML = `
            <div class="card h-100 shadow-sm ${!product.inStock ? 'out-of-stock' : ''}">
                <div class="position-relative">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: cover;">
                    ${!product.inStock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
                </div>
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text">
                        <span class="badge bg-primary">${product.category}</span>
                        ${!product.inStock ? '<span class="badge bg-danger ms-2">Out of Stock</span>' : ''}
                    </p>
                    <p class="card-text fw-bold text-primary">NPR ${product.price.toLocaleString()}</p>
                    <div class="d-grid gap-2">
                        <button class="btn btn-info text-white" onclick="viewProductDetails('${product.id}')">
                            <i class="bi bi-eye me-2"></i>View Details
                        </button>
                        ${product.inStock ? 
                            `<button class="btn btn-success" onclick="addToCart('${product.id}')">
                                <i class="bi bi-cart-plus me-2"></i>Add to Cart
                            </button>
                            <button class="btn btn-primary" onclick="buyProduct('${product.id}')">
                                <i class="bi bi-lightning-fill me-2"></i>Buy Now
                            </button>` : 
                            '<button class="btn btn-secondary" disabled>Out of Stock</button>'
                        }
                    </div>
                </div>
            </div>
        `;
        productList.appendChild(col);
    });
}

// Initialize everything when the page loads
window.onload = function() {
    renderCategories();
    filterAndDisplayProducts();
    updateProductShowcase();
    updateCategoryShowcase();
    
    // Initialize carousel with options
    const productShowcase = document.querySelector('#productShowcase');
    if (productShowcase) {
        new bootstrap.Carousel(productShowcase, {
            interval: 5000,
            wrap: true,
            keyboard: true,
            pause: 'hover'
        });
    }
};

// --- ORDER FORM (unchanged, but you can add delivery logic here if needed) ---
const orderForm = document.getElementById('orderForm');
orderForm.addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Thank you for your order! We will contact you soon.');
    orderForm.reset();
});

// --- RETURN FORM HANDLING ---
const returnForm = document.getElementById('returnForm');
const returnEvidence = document.getElementById('returnEvidence');

// Handle file upload validation
returnEvidence.addEventListener('change', function(e) {
    const files = e.target.files;
    if (files.length > 3) {
        alert('You can only upload up to 3 images.');
        e.target.value = '';
        return;
    }

    // Validate file types and sizes
    for (let file of files) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload only image files.');
            e.target.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Each image must be less than 5MB.');
            e.target.value = '';
            return;
        }
    }
});

// Form validation and submission
returnForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!returnForm.checkValidity()) {
        e.stopPropagation();
        returnForm.classList.add('was-validated');
        return;
    }

    // Collect form data
    const formData = {
        orderId: document.getElementById('returnOrderId').value,
        purchaseDate: document.getElementById('returnDate').value,
        name: document.getElementById('returnName').value,
        phone: document.getElementById('returnPhone').value,
        product: document.getElementById('returnProduct').value,
        reason: document.getElementById('returnReason').value,
        details: document.getElementById('returnDetails').value,
        complaint: document.getElementById('complaintMessage').value,
        evidence: returnEvidence.files
    };

    // Here you would typically send the data to your server
    // For now, we'll just show a success message
    const successMessage = `
        Thank you for your return request!
        We have received your request with the following details:
        - Order ID: ${formData.orderId}
        - Product: ${formData.product}
        - Reason: ${formData.reason}
        
        We will review your request and contact you within 2 business days.
        Please keep the product in its original condition until we process your request.
    `;

    // Show success message in a modal
    const modal = new bootstrap.Modal(document.createElement('div'));
    modal.element.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-success text-white">
                    <h5 class="modal-title">Return Request Submitted</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>${successMessage}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-success" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal.element);
    modal.show();

    // Reset form
    returnForm.reset();
    returnForm.classList.remove('was-validated');

    // Remove modal from DOM after it's hidden
    modal.element.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modal.element);
    });
});

// Add phone number validation
document.getElementById('returnPhone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    e.target.value = value;
});

// Product Showcase Functions
function updateProductShowcase() {
    const carouselInner = document.querySelector('#productShowcase .carousel-inner');
    const carouselIndicators = document.querySelector('#productShowcase .carousel-indicators');
    
    // Clear existing content
    carouselInner.innerHTML = '';
    carouselIndicators.innerHTML = '';
    
    // Get latest products (last 5 uploaded)
    const latestProducts = products.slice(-5).reverse();
    
    if (latestProducts.length === 0) {
        // Show default content if no products
        carouselInner.innerHTML = `
            <div class="carousel-item active">
                <img src="https://via.placeholder.com/1200x600/2c3e50/ffffff?text=Welcome+to+SCASS" class="d-block w-100" alt="Welcome">
                <div class="carousel-caption">
                    <h3>Welcome to SCASS</h3>
                    <p>Start adding products to showcase them here!</p>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#uploadModal">
                        <i class="bi bi-plus-lg me-2"></i>Upload Your First Product
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    // Add products to carousel
    latestProducts.forEach((product, index) => {
        // Create carousel item
        const carouselItem = document.createElement('div');
        carouselItem.className = `carousel-item ${index === 0 ? 'active' : ''}`;
        carouselItem.innerHTML = `
            <img src="${product.image}" class="d-block w-100" alt="${product.name}">
            <div class="carousel-caption">
                <h3>${product.name}</h3>
                <p>${product.category}</p>
                <div class="price">NPR ${product.price.toLocaleString()}</div>
                <button class="btn btn-primary" onclick="scrollToProduct('${product.id}')">
                    <i class="bi bi-eye me-2"></i>View Details
                </button>
            </div>
        `;
        carouselInner.appendChild(carouselItem);
        
        // Create indicator
        const indicator = document.createElement('button');
        indicator.type = 'button';
        indicator.setAttribute('data-bs-target', '#productShowcase');
        indicator.setAttribute('data-bs-slide-to', index);
        if (index === 0) indicator.classList.add('active');
        indicator.setAttribute('aria-label', `Slide ${index + 1}`);
        carouselIndicators.appendChild(indicator);
    });
}

function scrollToProduct(productId) {
    const productElement = document.querySelector(`[data-product-id="${productId}"]`);
    if (productElement) {
        productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight the product briefly
        productElement.classList.add('highlight-product');
        setTimeout(() => {
            productElement.classList.remove('highlight-product');
        }, 2000);
    }
}

// Add highlight animation for products
const style = document.createElement('style');
style.textContent = `
    @keyframes highlightProduct {
        0% { transform: scale(1); box-shadow: var(--card-shadow); }
        50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(52, 152, 219, 0.5); }
        100% { transform: scale(1); box-shadow: var(--card-shadow); }
    }
    
    .highlight-product {
        animation: highlightProduct 1s ease-in-out;
    }
`;
document.head.appendChild(style);

// Search functionality
document.getElementById('searchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    currentSearch = searchTerm;
    filterAndDisplayProducts();
});

function clearSearch() {
    currentSearch = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResultsAlert').classList.add('d-none');
    filterAndDisplayProducts();
}

// Category Showcase Functions
function updateCategoryShowcase() {
    const showcaseGrid = document.getElementById('category-showcase-grid');
    if (!showcaseGrid) return;
    
    showcaseGrid.innerHTML = '';
    
    categories.forEach(category => {
        // Get products for this category
        const categoryProducts = products.filter(p => p.category === category);
        const featuredProducts = categoryProducts.slice(0, 3); // Get up to 3 featured products
        
        // Create category card
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        // Use the first product's image as category image, or a default image
        const categoryImage = categoryProducts.length > 0 ? 
            categoryProducts[0].image : 
            'https://via.placeholder.com/600x400/2c3e50/ffffff?text=' + category;
        
        col.innerHTML = `
            <div class="category-card" onclick="navigateToCategory('${category}')">
                <img src="${categoryImage}" alt="${category}">
                <div class="overlay">
                    <div class="category-title">${category}</div>
                    <div class="product-count">${categoryProducts.length} product${categoryProducts.length !== 1 ? 's' : ''}</div>
                    <a href="#categories" class="view-more" onclick="event.stopPropagation(); navigateToCategory('${category}')">
                        View Products <i class="bi bi-arrow-right ms-2"></i>
                    </a>
                </div>
                ${featuredProducts.length > 0 ? `
                    <div class="featured-products">
                        ${featuredProducts.map(p => `
                            <img src="${p.image}" alt="${p.name}" title="${p.name}">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        showcaseGrid.appendChild(col);
    });
}

function navigateToCategory(category) {
    // Set the current category
    currentCategory = category;
    
    // Update the category list
    renderCategories();
    
    // Filter and display products
    filterAndDisplayProducts();
    
    // Scroll to the categories section
    document.getElementById('categories').scrollIntoView({ behavior: 'smooth' });
}

// Add simple buy function
function buyProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Pre-fill the order form
    document.getElementById('orderProduct').value = product.name;
    
    // Scroll to order section
    document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
}

// Add view details function
function viewProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Create and show modal
    const modal = new bootstrap.Modal(document.createElement('div'));
    modal.element.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${product.name}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <img src="${product.image}" class="img-fluid rounded" alt="${product.name}" style="max-height: 400px; width: 100%; object-fit: cover;">
                        </div>
                        <div class="col-md-6">
                            <div class="product-details">
                                <h4 class="mb-3">${product.name}</h4>
                                <p class="mb-2">
                                    <span class="badge bg-primary">${product.category}</span>
                                    ${!product.inStock ? '<span class="badge bg-danger ms-2">Out of Stock</span>' : ''}
                                </p>
                                <p class="h3 text-primary mb-4">NPR ${product.price.toLocaleString()}</p>
                                <div class="mb-4">
                                    <h6 class="mb-2">Description:</h6>
                                    <p class="mb-0">${product.description || 'No description available.'}</p>
                                </div>
                                <div class="mb-4">
                                    <h6 class="mb-2">Availability:</h6>
                                    <p class="mb-0">${product.inStock ? 
                                        '<span class="text-success"><i class="bi bi-check-circle-fill me-2"></i>In Stock</span>' : 
                                        '<span class="text-danger"><i class="bi bi-x-circle-fill me-2"></i>Out of Stock</span>'
                                    }</p>
                                </div>
                                <div class="d-grid gap-2">
                                    ${product.inStock ? 
                                        `<button class="btn btn-success" onclick="addToCart('${product.id}'); bootstrap.Modal.getInstance(modal.element).hide();">
                                            <i class="bi bi-cart-plus me-2"></i>Add to Cart
                                        </button>
                                        <button class="btn btn-primary" onclick="buyProduct('${product.id}'); bootstrap.Modal.getInstance(modal.element).hide();">
                                            <i class="bi bi-lightning-fill me-2"></i>Buy Now
                                        </button>` : 
                                        '<button class="btn btn-secondary" disabled>Out of Stock</button>'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal.element);
    modal.show();

    // Remove modal from DOM after it's hidden
    modal.element.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modal.element);
    });
} 