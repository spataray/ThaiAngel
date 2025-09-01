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

    // --- FIREBASE DATABASE SETUP ---
    const db = firebase.database();
    let products = [];
    let requests = [];

    // --- REAL-TIME DATA LISTENERS ---
    // This is the magic! This function listens for any change in the 'products' data in Firebase
    // and automatically updates the app.
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        products = data ? data : []; // If there's data, use it, otherwise use an empty array
        renderAll(); // Re-render everything whenever products change
    });

    // This listener does the same for 'requests'
    db.ref('requests').on('value', (snapshot) => {
        const data = snapshot.val();
        requests = data ? data : [];
        renderRequests(); // Just need to re-render the requests list
    });


    // --- PAGE NAVIGATION (No changes here) ---
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
    // --- RENDERING FUNCTIONS (No changes here, they still use the local products/requests arrays) ---
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
    const renderAll = () => {
        renderProducts();
        renderProductSelect();
        renderRequests();
    };

    // --- EVENT LISTENERS (Now write to Firebase instead of localStorage) ---
    
    // Add a new product
    document.getElementById('add-product-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const newProduct = {
            name: document.getElementById('product-name').value,
            distributor: document.getElementById('product-distributor').value
        };
        const updatedProducts = [...products, newProduct];
        // Save the entire updated array to Firebase
        db.ref('products').set(updatedProducts);
        
        document.getElementById('add-product-form').reset();
    });

    // Delete a product
    document.getElementById('products-list').addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const index = event.target.dataset.index;
            const updatedProducts = [...products];
            updatedProducts.splice(index, 1);
            // Save the new, smaller array to Firebase
            db.ref('products').set(updatedProducts);
        }
    });

    // Request an item
    document.getElementById('request-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const selectedProductName = document.getElementById('product-select').value;
        if (selectedProductName && !requests.some(req => req.name === selectedProductName)) {
            const updatedRequests = [...requests, { name: selectedProductName }];
            // Save the updated requests array to Firebase
            db.ref('requests').set(updatedRequests);
        }
        document.getElementById('request-form').reset();
    });
    
    // Remove a requested item
    document.getElementById('requests-list').addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const productNameToRemove = event.target.dataset.name;
            const updatedRequests = requests.filter(req => req.name !== productNameToRemove);
            // Save the filtered array to Firebase
            db.ref('requests').set(updatedRequests);
        }
    });

    // --- SETTINGS (Share, Backup, Restore functionality has no major changes) ---
    // The backup/restore functions now work with the live Firebase data!
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
    document.getElementById('backup-data').addEventListener('click', async () => { /* ... */ });
    document.getElementById('restore-data').addEventListener('click', () => {
        const backupString = prompt("Please paste your backup data below to restore it to Firebase:");
        if (!backupString) return;
        try {
            const restoredData = JSON.parse(backupString);
            if (restoredData.products && restoredData.requests) {
                // Instead of saving locally, we push the restored data to Firebase
                db.ref('products').set(restoredData.products);
                db.ref('requests').set(restoredData.requests);
                alert('Data restored successfully! All devices will now be updated.');
            } else { alert('Invalid backup data format.'); }
        } catch (error) { alert('Could not restore data.'); }
    });
});
