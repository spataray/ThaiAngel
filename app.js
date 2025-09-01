document.addEventListener('DOMContentLoaded', () => {
    // --- (The Random Background function is the same) ---
    const setRandomBackground = () => { /* ... */ };
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
    const showPage = (pageId) => { /* ... */ };
    navLinks.forEach(link => { /* ... */ });
    
    // --- RENDERING FUNCTIONS (No changes here, they still use the local products/requests arrays) ---
    const renderProducts = () => { /* ... */ };
    const renderProductSelect = () => { /* ... */ };
    const renderRequests = () => { /* ... */ };
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
    document.getElementById('share-requests').addEventListener('click', async () => { /* ... */ });
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
