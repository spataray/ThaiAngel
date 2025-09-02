document.addEventListener('DOMContentLoaded', () => {
    setRandomBackground();

    // --- UI ELEMENT & FIREBASE SETUP ---
    const authContainer = document.getElementById('auth-container');
    const mainContent = document.getElementById('main-content');
    const userEmailDisplay = document.getElementById('user-email');
    const db = firebase.database();
    const auth = firebase.auth();
    let products = [];
    let requests = [];
    
    // --- AUTHENTICATION LISTENER ---
    auth.onAuthStateChanged(user => {
        if (user) { // User is logged in
            authContainer.classList.add('hidden');
            mainContent.classList.remove('hidden');
            userEmailDisplay.textContent = `Signed in as: ${user.email}`;
            initializeDataListeners();
        } else { // User is logged out
            authContainer.classList.remove('hidden');
            mainContent.classList.add('hidden');
            userEmailDisplay.textContent = '';
            db.ref('products').off();
            db.ref('requests').off();
        }
    });

    // --- LOGIN, SIGNUP, & LOGOUT ---
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');

    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        loginError.textContent = '';
        auth.signInWithEmailAndPassword(email, password).catch(err => {
            loginError.textContent = err.message;
        });
    });

    signupForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        signupError.textContent = '';
        auth.createUserWithEmailAndPassword(email, password).catch(err => {
            signupError.textContent = err.message;
        });
    });

    document.getElementById('sign-out-btn').addEventListener('click', () => auth.signOut());
    
    document.getElementById('show-signup').addEventListener('click', e => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });
    document.getElementById('show-login').addEventListener('click', e => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // --- REAL-TIME DATA LISTENERS ---
    function initializeDataListeners() {
        db.ref('products').on('value', snapshot => {
            products = snapshot.val() || [];
            renderAll();
        });
        db.ref('requests').on('value', snapshot => {
            requests = snapshot.val() || [];
            renderRequests();
        });
    }

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

    const renderRequests = () => {
        const requestsList = document.getElementById('requests-list');
        requestsList.innerHTML = '';
        if (!requests || requests.length === 0) return;
        const requestsByDistributor = {};
        requests.forEach(request => {
            const product = products.find(p => p.name === request.name);
            const distributor = product ? product.distributor : 'Unknown';
            if (!requestsByDistributor[distributor]) {
                requestsByDistributor[distributor] = [];
            }
            requestsByDistributor[distributor].push(request);
        });
        for (const distributor in requestsByDistributor) {
            const distributorHeader = document.createElement('h3');
            distributorHeader.textContent = distributor;
            distributorHeader.style.cssText = 'border-bottom: 1px solid var(--neutral-color); padding-bottom: 5px; margin-top: 20px;';
            requestsList.appendChild(distributorHeader);
            requestsByDistributor[distributor].forEach(request => {
                const item = document.createElement('div');
                item.className = 'list-item';
                const date = new Date(request.timestamp);
                const formattedDateTime = date.toLocaleString('en-US', {
                    month: '2-digit', day: '2-digit', year: 'numeric',
                    hour: 'numeric', minute: '2-digit', hour12: true
                }).replace(',', '');
                item.innerHTML = `
                    <div>
                        <span class="list-item-details">${request.name}</span>
                        <div class="list-item-meta">${request.requestedBy} <br> ${formattedDateTime}</div>
                    </div>
                    <button class="delete-btn" data-name="${request.name}">Ordered / Remove</button>
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

    // --- EVENT LISTENERS ---
    document.getElementById('add-product-form').addEventListener('submit', e => {
        e.preventDefault();
        const newProduct = {
            name: document.getElementById('product-name').value,
            distributor: document.getElementById('product-distributor').value
        };
        const updatedProducts = [...products, newProduct];
        db.ref('products').set(updatedProducts);
        e.target.reset();
    });

    document.getElementById('products-list').addEventListener('click', e => {
        if (e.target.classList.contains('delete-btn')) {
            const index = e.target.dataset.index;
            const updatedProducts = [...products];
            updatedProducts.splice(index, 1);
            db.ref('products').set(updatedProducts);
        }
    });

    document.getElementById('request-form').addEventListener('submit', e => {
        e.preventDefault();
        const selectedProductName = document.getElementById('product-select').value;
        const currentUser = auth.currentUser;
        if (selectedProductName && currentUser && !requests.some(req => req.name === selectedProductName)) {
            const newRequest = {
                name: selectedProductName,
                requestedBy: currentUser.email,
                timestamp: Date.now()
            };
            const updatedRequests = [...requests, newRequest];
            db.ref('requests').set(updatedRequests);
        }
        e.target.reset();
    });
    
    document.getElementById('requests-list').addEventListener('click', e => {
        if (e.target.classList.contains('delete-btn')) {
            const productNameToRemove = e.target.dataset.name;
            const updatedRequests = requests.filter(req => req.name !== productNameToRemove);
            db.ref('requests').set(updatedRequests);
        }
    });

    // --- SETTINGS EVENT LISTENERS ---
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
                    title: `T.A. Station Ordering Requests`,
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
    document.getElementById('backup-data').addEventListener('click', () => {
        const backupData = { products: products, requests: requests };
        const csvContent = "data:text/csv;charset=utf-8," + JSON.stringify(backupData);
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ta_station_backup.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
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

    function setRandomBackground() {
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
    }
});

