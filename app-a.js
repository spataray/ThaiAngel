document.addEventListener('DOMContentLoaded', () => {

    // --- RANDOM BACKGROUND ---
    const setRandomBackground = () => {
        const backgroundImages = [
           "images/TAStation-1.JPG", "images/TAStation-2.JPG", "images/TAStation-3.JPG", 
           "images/TAStation-4.JPG", "images/TAStation-5.JPG", "images/TAStation-6.JPG", 
           "images/TAStation-7.JPG", "images/TAStation-8.JPG", "images/TAStation-9.JPG",
           "images/TAStation-10.JPG", "images/TAStation-11.JPG", "images/TAStation-12.JPG",
           "images/TAStation-13.JPG", "images/TAStation-14.JPG", "images/TAStation-15.JPG",
           "images/TAStation-16.JPG", "images/TAStation-17.JPG", "images/TAStation-18.JPG",
           "images/TAStation-19.JPG", "images/TAStation-20.JPG", "images/TAStation-21.JPG",
           "images/TAStation-22.JPG"
        ];
        const randomIndex = Math.floor(Math.random() * backgroundImages.length);
        const selectedImage = backgroundImages[randomIndex];
        document.body.style.backgroundImage = `url("${selectedImage}")`;
    };
    setRandomBackground();

    // --- DATA MANAGEMENT ---
    const getData = (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    };
    const saveData = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    let products = getData('products');
    let requests = getData('requests');

    // --- PAGE NAVIGATION ---
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('nav a');
    const showPage = (pageId) => {
        pages.forEach(page => page.classList.toggle('active', page.id === pageId));
        navLinks.forEach(link => link.classList.toggle('active', link.id === `nav-${pageId.split('-')[1]}`));
    };
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const pageId = `page-${link.id.split('-')[1]}`;
            showPage(pageId);
        });
    });

    // --- RENDERING FUNCTIONS ---
    const renderProducts = () => {
        const productsList = document.getElementById('products-list');
        productsList.innerHTML = '';
        products.forEach((product, index) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div>
                    <span class="list-item-details">${product.name}</span>
                    <span class="list-item-distributor">(${product.distributor})</span>
                </div>
                <button class="delete-btn" data-index="${index}">Delete</button>
            `;
            productsList.appendChild(item);
        });
    };
    const renderProductSelect = () => {
        const productSelect = document.getElementById('product-select');
        productSelect.innerHTML = '<option value="">--Please choose a product--</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.name;
            option.textContent = `${product.name} (${product.distributor})`;
            productSelect.appendChild(option);
        });
    };

    // --- UPDATED RENDER REQUESTS FUNCTION ---
    // This function now groups items by distributor.
    const renderRequests = () => {
        const requestsList = document.getElementById('requests-list');
        requestsList.innerHTML = ''; // Clear current list

        if (requests.length === 0) {
            return; // Exit if there's nothing to render
        }

        // Create an object to hold requests grouped by distributor
        const requestsByDistributor = {};

        // Loop through each request
        requests.forEach(request => {
            // Find the full product info to get the distributor
            const product = products.find(p => p.name === request.name);
            const distributor = product ? product.distributor : 'Unknown Distributor';

            // If we haven't seen this distributor yet, create an array for them
            if (!requestsByDistributor[distributor]) {
                requestsByDistributor[distributor] = [];
            }
            // Add the product name to the correct distributor's array
            requestsByDistributor[distributor].push(request.name);
        });

        // Now, build the HTML from the grouped object
        for (const distributor in requestsByDistributor) {
            const distributorHeader = document.createElement('h3');
            distributorHeader.textContent = distributor;
            distributorHeader.style.cssText = 'border-bottom: 1px solid var(--neutral-color); padding-bottom: 5px; margin-top: 20px;';
            requestsList.appendChild(distributorHeader);

            requestsByDistributor[distributor].forEach(productName => {
                const item = document.createElement('div');
                item.className = 'list-item';
                item.innerHTML = `
                    <span class="list-item-details">${productName}</span>
                    <button class="delete-btn" data-name="${productName}">Ordered / Remove</button>
                `;
                requestsList.appendChild(item);
            });
        }
    };
    
    // --- EVENT LISTENERS FOR FORMS AND BUTTONS ---
    document.getElementById('add-product-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const nameInput = document.getElementById('product-name');
        const distributorInput = document.getElementById('product-distributor');
        products.push({ name: nameInput.value, distributor: distributorInput.value });
        saveData('products', products);
        renderProducts();
        renderProductSelect();
        nameInput.value = '';
        distributorInput.value = '';
    });

    document.getElementById('products-list').addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const index = event.target.dataset.index;
            products.splice(index, 1);
            saveData('products', products);
            renderProducts();
            renderProductSelect();
        }
    });

    document.getElementById('request-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const productSelect = document.getElementById('product-select');
        const selectedProductName = productSelect.value;
        if (selectedProductName && !requests.some(req => req.name === selectedProductName)) {
            requests.push({ name: selectedProductName });
            saveData('requests', requests);
            renderRequests();
        }
        productSelect.value = '';
    });
    
    // Updated logic to remove items by name instead of index
    document.getElementById('requests-list').addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const productNameToRemove = event.target.dataset.name;
            // Find the index of the request with that product name
            const indexToRemove = requests.findIndex(req => req.name === productNameToRemove);
            if (indexToRemove > -1) {
                requests.splice(indexToRemove, 1);
                saveData('requests', requests);
                renderRequests();
            }
        }
    });

    // --- NEW: SHARE FUNCTIONALITY ---
    document.getElementById('share-requests').addEventListener('click', async () => {
        if (requests.length === 0) {
            alert("There are no items in the order list to share.");
            return;
        }

        // Group the requests just like in the render function
        const requestsByDistributor = {};
        requests.forEach(request => {
            const product = products.find(p => p.name === request.name);
            const distributor = product ? product.distributor : 'Unknown Distributor';
            if (!requestsByDistributor[distributor]) {
                requestsByDistributor[distributor] = [];
            }
            requestsByDistributor[distributor].push(request.name);
        });

        // Format the grouped list into a clean text string
        const today = new Date();
        const dateString = today.toLocaleDateString('en-US'); // e.g., 9/1/2025
        let shareText = `T.A. Station Liquor Order - ${dateString}\n\n`;

        for (const distributor in requestsByDistributor) {
            shareText += `--- ${distributor} ---\n`;
            requestsByDistributor[distributor].forEach(productName => {
                shareText += `- ${productName}\n`;
            });
            shareText += '\n'; // Add a space between distributors
        }

        // Use the Web Share API if available
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `T.A. Station Liquor Order`,
                    text: shareText,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback for browsers that don't support sharing (like some desktops)
            try {
                await navigator.clipboard.writeText(shareText);
                alert("Order list copied to clipboard! You can now paste it into any app.");
            } catch (err) {
                console.error('Failed to copy text: ', err);
                alert("Could not copy the list. Please select and copy it manually.");
            }
        }
    });

    // --- SETTINGS: BACKUP AND RESTORE ---
    document.getElementById('backup-data').addEventListener('click', () => { /* ... (no changes) ... */ });
    document.getElementById('restore-data').addEventListener('click', () => { /* ... (no changes) ... */ });
    document.getElementById('restore-file-input').addEventListener('change', (event) => { /* ... (no changes) ... */ });

    // --- INITIAL RENDER ---
    const renderAll = () => {
        renderProducts();
        renderProductSelect();
        renderRequests();
    };
    renderAll();
});

