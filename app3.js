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
    
    // --- NEW: INACTIVITY AUTO-LOGOUT ---
    let inactivityTimer;
    const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes. You can change the '5' to any number.

    // This function signs the user out and reloads the page.
    const logoutUser = () => {
        auth.signOut();
        // We don't need window.location.reload() here because the onAuthStateChanged listener will handle everything.
    };

    // This function resets the timer whenever the user interacts with the page.
    const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer); // Clear the previous timer
        // Set a new timer
        inactivityTimer = setTimeout(logoutUser, INACTIVITY_TIMEOUT_MS);
    };

    // List of events that count as user activity
    const userActivityEvents = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
    
    // --- AUTHENTICATION LISTENER ---
    auth.onAuthStateChanged(user => {
        if (user) { // User is logged in
            authContainer.classList.add('hidden');
            mainContent.classList.remove('hidden');
            userEmailDisplay.textContent = `Signed in as: ${user.email}`;
            
            // NEW: Start the inactivity timer when the user logs in
            resetInactivityTimer();
            userActivityEvents.forEach(event => {
                window.addEventListener(event, resetInactivityTimer);
            });

            initializeDataListeners();
        } else { // User is logged out
            authContainer.classList.remove('hidden');
            mainContent.classList.add('hidden');
            userEmailDisplay.textContent = '';
            
            // NEW: Stop the inactivity timer when the user logs out
            clearTimeout(inactivityTimer);
            userActivityEvents.forEach(event => {
                window.removeEventListener(event, resetInactivityTimer);
            });

            db.ref('products').off();
            db.ref('requests').off();
        }
    });

    // --- LOGIN, SIGNUP, & LOGOUT ---
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    // ... (The rest of the file is the same as before)
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
                        <div class="list-item-meta">${request.requestedBy} / ${formattedDateTime}</div>
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
    document.getElementById('share-requests').addEventListener('click', async () => { /* ... */ });
    document.getElementById('backup-data').addEventListener('click', async () => { /* ... */ });
    document.getElementById('restore-data').addEventListener('click', () => { /* ... */ });

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

