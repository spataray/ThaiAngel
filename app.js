document.addEventListener('DOMContentLoaded', () => {
    // --- (The Random Background function is the same) ---
    const setRandomBackground = () => { /* ... */ };
    setRandomBackground();

    // --- NEW: UI STATE MANAGEMENT ---
    const loadingIndicator = document.getElementById('loading-indicator');
    const mainContent = document.getElementById('main-content');

    // --- FIREBASE DATABASE SETUP ---
    const db = firebase.database();
    let products = [];
    let requests = [];

    // --- REAL-TIME DATA LISTENERS ---
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        products = data ? data : []; 
        renderAll();

        // **KEY CHANGE**: Once the first set of data is loaded, show the app.
        loadingIndicator.classList.add('hidden');
        mainContent.classList.remove('hidden');
    }, (error) => {
        // If there's an error connecting, show it.
        console.error("Firebase connection error:", error);
        loadingIndicator.innerHTML = `<h2>Error connecting to database. Please check your Firebase setup and security rules.</h2><p>${error.message}</p>`;
    });

    db.ref('requests').on('value', (snapshot) => {
        const data = snapshot.val();
        requests = data ? data : [];
        renderRequests();
    });

    // --- (The rest of the file is exactly the same as before) ---
    // PAGE NAVIGATION, RENDERING FUNCTIONS, EVENT LISTENERS, SETTINGS
    // ...
});
