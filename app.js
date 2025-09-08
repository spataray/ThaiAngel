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
    off,
    get // NEW: Import 'get' for a one-time data read
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
    const manageProductsNavLink = document.getElementById('nav-products'); // Get the nav link
    let products = [];
    let requests = [];
    let isAdmin = false; // NEW: Variable to track admin status
    
    // --- INACTIVITY AUTO-LOGOUT ---
    let inactivityTimer;
    const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
    const logoutUser = () => signOut(auth);
    const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(logoutUser, INACTIVITY_TIMEOUT_MS);
    };
    const userActivityEvents = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];

    // --- NEW: FUNCTION TO CHECK ADMIN STATUS ---
    const checkAdminStatus = async (user) => {
        if (!user) {
            isAdmin = false;
            return;
        }
        const adminRef = ref(db, `admins/${user.uid}`);
        const snapshot = await get(adminRef); // Perform a one-time read
        isAdmin = snapshot.exists() && snapshot.val() === true;
    };
    
    // --- NEW: FUNCTION TO UPDATE UI BASED ON ROLE ---
    const updateUserUI = (user) => {
        const username = getUsernameFromUser(user);
        if (isAdmin) {
            userDisplay.textContent = `Welcome, ${username}! (Admin)`;
            manageProductsNavLink.classList.remove('hidden'); // Show the nav link
        } else {
            userDisplay.textContent = `Welcome, ${username}!`;
            manageProductsNavLink.classList.add('hidden'); // Hide the nav link for non-admins
        }
    };

    // --- AUTHENTICATION STATE OBSERVER (UPDATED) ---
    onAuthStateChanged(auth, async user => {
        if (user) { // User is logged in
            authContainer.classList.add('hidden');
            mainContent.classList.remove('hidden');
            
            await checkAdminStatus(user); // Wait for the admin check to complete
            updateUserUI(user); // Update the UI with the result

            resetInactivityTimer();
            userActivityEvents.forEach(event => window.addEventListener(event, resetInactivityTimer));

            initializeDataListeners(user.uid);
        } else { // User is logged out
            isAdmin = false; // Reset admin status on logout
            authContainer.classList.remove('hidden');
            mainContent.classList.add('hidden');
            userDisplay.textContent = '';

            clearTimeout(inactivityTimer);
            userActivityEvents.forEach(event => window.removeEventListener(event, resetInactivityTimer));
            
            if(loginForm) loginForm.reset();
            if(signupForm) signupForm.reset();
            const loginError = document.getElementById('login-error');
            const signupError = document.getElementById('signup-error');
            if(loginError) loginError.textContent = '';
            if(signupError) signupError.textContent = '';

            off(ref(db, 'products'));
            off(ref(db, 'requests'));
        }
    });

    // --- HELPER FUNCTIONS ---
    const getCredentialsFromUsername = (username) => {
        const sanitizedUsername = username.toLowerCase().trim();
        return {
            email: `${sanitizedUsername}@ta-station.local`,
            password: `${sanitizedUsername}_secret_pwd`
        };
    };
    
    const getUsernameFromUser = (user) => {
        if (user && user.email) {
            return user.email.split('@')[0];
        }
        return 'guest';
    };

    // --- LOGIN, SIGNUP, & LOGOUT ---
    loginForm.addEventListener('submit', e => { /* ... (no changes) ... */ });
    signupForm.addEventListener('submit', e => { /* ... (no changes) ... */ });
    document.getElementById('sign-out-btn').addEventListener('click', () => signOut(auth));
    document.getElementById('show-signup').addEventListener('click', e => { /* ... (no changes) ... */ });
    document.getElementById('show-login').addEventListener('click', e => { /* ... (no changes) ... */ });

    // --- REAL-TIME DATA LISTENERS ---
    function initializeDataListeners() { /* ... (no changes) ... */ }

    // --- PAGE NAVIGATION ---
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('nav a');
    const showPage = (pageId) => { /* ... (no changes) ... */ };
    navLinks.forEach(link => { /* ... (no changes) ... */ });
    
    // --- RENDERING FUNCTIONS ---
    const renderProducts = () => { /* ... (no changes) ... */ };
    const renderProductSelect = () => { /* ... (no changes) ... */ };
    const renderRequests = () => { /* ... (no changes) ... */ };
    const renderAll = () => { /* ... (no changes) ... */ };

    // --- EVENT LISTENERS FOR DATA MANIPULATION ---
    document.getElementById('add-product-form').addEventListener('submit', e => { /* ... (no changes) ... */ });
    document.getElementById('products-list').addEventListener('click', e => { /* ... (no changes) ... */ });
    document.getElementById('request-form').addEventListener('submit', e => { /* ... (no changes) ... */ });
    document.getElementById('requests-list').addEventListener('click', e => { /* ... (no changes) ... */ });

    // --- SETTINGS EVENT LISTENERS ---
    document.getElementById('share-requests').addEventListener('click', async () => { /* ... (no changes) ... */ });
    document.getElementById('backup-data').addEventListener('click', () => { /* ... (no changes) ... */ });
    document.getElementById('restore-data').addEventListener('click', () => { /* ... (no changes) ... */ });

    // --- BACKGROUND IMAGE FUNCTION ---
    function setRandomBackground() { /* ... (no changes) ... */ }
});
