// --- FIREBASE V9+ MODULAR IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    set, 
    onValue, 
    off 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// ▼▼▼ PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE ▼▼▼
const firebaseConfig = {
  apiKey: "AIzaSyD3K1ITOltWrNHYptqAV7CTYchnyTuvO7w",
  authDomain: "ta-station-ordering.firebaseapp.com",
  databaseURL: "https://ta-station-ordering-default-rtdb.firebaseio.com",
  projectId: "ta-station-ordering",
  storageBucket: "ta-station-ordering.appspot.com",
  messagingSenderId: "298390246369",
  appId: "1:298390246369:web:0002aaacc11f4542b878a0"
};
// ▲▲▲ END OF FIREBASE CONFIGURATION ▲▲▲

// --- INITIALIZE FIREBASE & SERVICES ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
    setRandomBackground();

    // --- GLOBAL VARIABLES & UI ELEMENTS ---
    const authContainer = document.getElementById('auth-container');
    const mainContent = document.getElementById('main-content');
    const userDisplay = document.getElementById('user-display');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    let products = [];
    let requests = [];
    
    // --- NEW: INACTIVITY AUTO-LOGOUT ---
    let inactivityTimer;
    const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes. Change '5' to adjust.

    const logoutUser = () => {
        signOut(auth);
    };

    const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(logoutUser, INACTIVITY_TIMEOUT_MS);
    };

    const userActivityEvents = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
    // --- END OF NEW SECTION ---


    // --- HELPER FUNCTION FOR USERNAME AUTH ---
    const getCredentialsFromUsername = (username) => {
        const sanitizedUsername = username.toLowerCase().trim();
        return {
            email: `${sanitizedUsername}@ta-station.local`,
            password: `${sanitizedUsername}_secret_pwd`
        };
    };
    
    // --- PARSE USERNAME HELPER ---
    const getUsernameFromUser = (user) => {
        if (user && user.email) {
            return user.email.split('@')[0];
        }
        return 'guest';
    };

    // --- AUTHENTICATION STATE OBSERVER ---
    onAuthStateChanged(auth, user => {
        if (user) { // User is logged in
            authContainer.classList.add('hidden');
            mainContent.classList.remove('hidden');
            userDisplay.textContent = `Welcome, ${getUsernameFromUser(user)}!`;
            
            // NEW: Start the inactivity timer
            resetInactivityTimer();
            userActivityEvents.forEach(event => window.addEventListener(event, resetInactivityTimer));

            initializeDataListeners(user.uid);
        } else { // User is logged out
            authContainer.classList.remove('hidden');
            mainContent.classList.add('hidden');
            userDisplay.textContent = '';

            // NEW: Stop the inactivity timer
            clearTimeout(inactivityTimer);
            userActivityEvents.forEach(event => window.removeEventListener(event, resetInactivityTimer));
            
            off(ref(db, 'products'));
            off(ref(db, 'requests'));
        }
    });

    // --- LOGIN, SIGNUP, & LOGOUT ---
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const { email, password } = getCredentialsFromUsername(username);
        const loginError = document.getElementById('login-error');
        loginError.textContent = '';
        
        signInWithEmailAndPassword(auth, email, password)
            .catch(err => {
                loginError.textContent = "Invalid username.";
            });
    });

    signupForm.addEventListener('submit', e => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const { email, password } = getCredentialsFromUsername(username);
        const signupError = document.getElementById('signup-error');
        signupError.textContent = '';
        
        createUserWithEmailAndPassword(auth, email, password)
            .catch(err => {
                if (err.code === 'auth/email-already-in-use') {
                    signupError.textContent = 'This username is already taken.';
                } else {
                    signupError.textContent = 'Could not create account.';
                }
            });
    });

    document.getElementById('sign-out-btn').addEventListener('click', () => signOut(auth));
    
    // --- FORM TOGGLING ---
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
        onValue(ref(db, 'products'), snapshot => {
            products = snapshot.val() || [];
            renderAll();
        });
        onValue(ref(db, 'requests'), snapshot => {
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

    // --- EVENT LISTENERS FOR DATA MANIPULATION ---
    document.getElementById('add-product-form').addEventListener('submit', e => {
        e.preventDefault();
        const newProduct = {
            name: document.getElementById('product-name').value,
            distributor: document.getElementById('product-distributor').value
        };
        const updatedProducts = [...products, newProduct];
        set(ref(db, 'products'), updatedProducts);
        e.target.reset();
    });

    document.getElementById('products-list').addEventListener('click', e => {
        if (e.target.classList.contains('delete-btn')) {
            const index = e.target.dataset.index;
            const updatedProducts = [...products];
            updatedProducts.splice(index, 1);
            set(ref(db, 'products'), updatedProducts);
        }
    });

    document.getElementById('request-form').addEventListener('submit', e => {
        e.preventDefault();
        const selectedProductName = document.getElementById('product-select').value;
        const currentUser = auth.currentUser;
        if (selectedProductName && currentUser && !requests.some(req => req.name === selectedProductName)) {
            const newRequest = {
                name: selectedProductName,
                requestedBy: getUsernameFromUser(currentUser), // Use username, not email
                timestamp: Date.now()
            };
            const updatedRequests = [...requests, newRequest];
            set(ref(db, 'requests'), updatedRequests);
        }
        e.target.reset();
    });
    
    document.getElementById('requests-list').addEventListener('click', e => {
        if (e.target.classList.contains('delete-btn')) {
            const productNameToRemove = e.target.dataset.name;
            const updatedRequests = requests.filter(req => req.name !== productNameToRemove);
            set(ref(db, 'requests'), updatedRequests);
        }
    });

    // --- SETTINGS EVENT LISTENERS ---
    document.getElementById('share-requests').addEventListener('click', async () => {
        if (requests.length === 0) {
            alert("There are no items in the order list to share.");
            return;
        }

        const requestsByDistributor = {};
        requests.forEach(request => {
            const product = products.find(p => p.name === request.name);
            const distributor = product ? product.distributor : 'Unknown Distributor';
            if (!requestsByDistributor[distributor]) {
                requestsByDistributor[distributor] = [];
            }
            requestsByDistributor[distributor].push(request.name);
        });

        const today = new Date();
        const dateString = today.toLocaleDateString('en-US');
        let shareText = `T.A. Station Liquor Order - ${dateString}\n\n`;

        for (const distributor in requestsByDistributor) {
            shareText += `--- ${distributor} ---\n`;
            requestsByDistributor[distributor].forEach(productName => {
                shareText += `- ${productName}\n`;
            });
            shareText += '\n';
        }

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
            try {
                await navigator.clipboard.writeText(shareText);
                alert("Order list copied to clipboard!");
            } catch (err) {
                console.error('Failed to copy text: ', err);
                alert("Could not copy the list.");
            }
        }
    });

    document.getElementById('backup-data').addEventListener('click', () => {
        const backupData = JSON.stringify({ products: products, requests: requests }, null, 2);
        const blob = new Blob([backupData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ta_station_backup_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });
    
    document.getElementById('restore-data').addEventListener('click', () => {
        const backupString = prompt("Paste your backup data below to restore it to Firebase:");
        if (!backupString) return;
        try {
            const restoredData = JSON.parse(backupString);
            if (restoredData.products && restoredData.requests) {
                if (confirm("This will overwrite all current products and requests. Are you sure?")) {
                    set(ref(db, 'products'), restoredData.products);
                    set(ref(db, 'requests'), restoredData.requests);
                    alert('Data restored successfully!');
                }
            } else { alert('Invalid backup data format.'); }
        } catch (error) { alert('Could not parse restore data. Please check the format.'); }
    });

    // --- BACKGROUND IMAGE FUNCTION ---
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
        document.body.style.backgroundImage = `url("${backgroundImages[randomIndex]}")`;
    }
});
