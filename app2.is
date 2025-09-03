// Import functions from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
// If you use Realtime Database, you'll need its functions too
// import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";


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


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// const database = getDatabase(app); // Uncomment if you are using Realtime Database

// --- DOM ELEMENTS ---
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authContainer = document.getElementById('auth-container');
const mainContent = document.getElementById('main-content');
const signOutBtn = document.getElementById('sign-out-btn');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const userDisplay = document.getElementById('user-display');

// --- HELPER FUNCTION ---
// This function creates the synthetic credentials from a username
const getCredentialsFromUsername = (username) => {
    // Make username lowercase and remove spaces to create a valid email prefix
    const sanitizedUsername = username.toLowerCase().trim();
    return {
        email: `${sanitizedUsername}@ta-station.local`, // Use a dummy domain
        password: `${sanitizedUsername}_secret_pwd`   // Create a predictable, non-secure password
    };
};

// --- AUTHENTICATION LOGIC ---

// Login Event Listener
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const { email, password } = getCredentialsFromUsername(username);
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = ''; // Clear previous errors

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('User signed in:', userCredential.user.uid);
        })
        .catch((error) => {
            console.error('Login Error:', error.code);
            errorEl.textContent = 'Invalid username.';
        });
});

// Signup Event Listener
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    if (!username || username.length < 3) {
        document.getElementById('signup-error').textContent = 'Username must be at least 3 characters.';
        return;
    }
    const { email, password } = getCredentialsFromUsername(username);
    const errorEl = document.getElementById('signup-error');
    errorEl.textContent = ''; // Clear previous errors

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('User created:', userCredential.user.uid);
            // After signup, the user is automatically logged in.
        })
        .catch((error) => {
            console.error('Signup Error:', error.code);
            if (error.code === 'auth/email-already-in-use') {
                errorEl.textContent = 'This username is already taken.';
            } else {
                errorEl.textContent = 'Could not create account.';
            }
        });
});

// Sign Out Event Listener
signOutBtn.addEventListener('click', () => {
    signOut(auth).catch(error => console.error('Sign Out Error:', error));
});


// --- AUTH STATE OBSERVER ---
// This function checks if the user is logged in or not and shows the correct content.
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        authContainer.classList.add('hidden');
        mainContent.classList.remove('hidden');
        
        // Display the user's "username" by parsing their email
        const username = user.email.split('@')[0];
        userDisplay.textContent = `Welcome, ${username}!`;

        // TODO: Call the function to load your app's data for the logged-in user
        // Example: loadUserProducts(user.uid);
    } else {
        // User is signed out
        authContainer.classList.remove('hidden');
        mainContent.classList.add('hidden');
        userDisplay.textContent = '';
    }
});


// --- UI/FORM TOGGLING ---
showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});


// --- ADD THE REST OF YOUR APPLICATION LOGIC BELOW ---
// (e.g., functions to manage products, handle requests, database interactions, etc.)

console.log("App loaded. Waiting for user authentication.");
