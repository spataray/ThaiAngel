// --- FIREBASE V8 CONFIGURATION ---
var firebaseConfig = {
  apiKey: "AIzaSyD3K1ITOltWrNHYptqAV7CTYchnyTuvO7w",
  authDomain: "ta-station-ordering.firebaseapp.com",
  databaseURL: "https://ta-station-ordering-default-rtdb.firebaseio.com",
  projectId: "ta-station-ordering",
  storageBucket: "ta-station-ordering.appspot.com",
  messagingSenderId: "298390246369",
  appId: "1:298390246369:web:0002aaacc11f4542b878a0"
};

// --- INITIALIZE FIREBASE & SERVICES ---
firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();
var db = firebase.database();

document.addEventListener('DOMContentLoaded', function() {
    setRandomBackground();

    // --- GLOBAL VARIABLES & UI ELEMENTS ---
    var authContainer = document.getElementById('auth-container');
    var mainContent = document.getElementById('main-content');
    var userDisplay = document.getElementById('user-display');
    var loginForm = document.getElementById('login-form');
    var signupForm = document.getElementById('signup-form');
    var manageProductsNavLink = document.getElementById('nav-products');
    var products = [];
    var requests = [];
    var isAdmin = false;
    var inactivityTimer = null;
    var INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    var userActivityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    function resetInactivityTimer() {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }
        inactivityTimer = setTimeout(function() {
            if (auth.currentUser) {
                auth.signOut().then(function() {
                    alert('You have been logged out due to inactivity.');
                });
            }
        }, INACTIVITY_TIMEOUT);
    }

    // --- VENUE NAME MANAGEMENT ---
    function getVenueName() {
        try {
            var saved = localStorage.getItem('tastation-screensaver-settings');
            if (saved) {
                var parsed = JSON.parse(saved);
                if (parsed.establishmentName && parsed.establishmentName.trim()) {
                    return parsed.establishmentName.trim();
                }
            }
        } catch(e) {}
        return localStorage.getItem('thaiangel_venue_name') || 'T.A. Station';
    }

    function setVenueName(name) {
        var cleanName = (name && name.trim()) ? name.trim() : 'T.A. Station';
        localStorage.setItem('thaiangel_venue_name', cleanName);
        try {
            var saved = localStorage.getItem('tastation-screensaver-settings');
            var parsed = saved ? JSON.parse(saved) : {};
            parsed.establishmentName = cleanName;
            localStorage.setItem('tastation-screensaver-settings', JSON.stringify(parsed));
        } catch(e) {}
        updateOrderingVenueUI();
    }

    function updateOrderingVenueUI() {
        var name = getVenueName();
        var docTitle = document.getElementById('ordering-doc-title');
        var loginTitle = document.getElementById('login-title');
        var orderingTitle = document.getElementById('ordering-title');
        var venueInput = document.getElementById('setting-venue-name');

        if (docTitle) document.title = name + ' Ordering';
        if (loginTitle) loginTitle.textContent = name + ' Login';
        if (orderingTitle) orderingTitle.textContent = name + ' Ordering';
        if (venueInput && document.activeElement !== venueInput) venueInput.value = name;
    }

    updateOrderingVenueUI();

    // --- HELPER FUNCTION FOR USERNAME AUTH ---
    var getCredentialsFromUsername = function(username) {
        var sanitizedUsername = username.toLowerCase().trim();
        return {
            email: sanitizedUsername + "@ta-station.local",
            password: sanitizedUsername + "_secret_pwd"
        };
    };

    // --- PARSE USERNAME HELPER ---
    var getUsernameFromUser = function(user) {
        if (user && user.email) {
            return user.email.split('@')[0];
        }
        return 'guest';
    };

    // --- ADMIN ROLE FUNCTIONS ---
    var checkAdminStatus = function(user) {
        if (!user) {
            isAdmin = false;
            return Promise.resolve();
        }
        return db.ref('admins/' + user.uid).once('value').then(function(snapshot) {
            isAdmin = snapshot.exists() && snapshot.val() === true;
        });
    };

    var updateUserUI = function(user) {
        var username = getUsernameFromUser(user);
        if (isAdmin) {
            userDisplay.textContent = 'Welcome, ' + username + '! (Admin)';
            manageProductsNavLink.classList.remove('hidden');
        } else {
            userDisplay.textContent = 'Welcome, ' + username + '!';
            manageProductsNavLink.classList.add('hidden');
        }
    };

    // --- AUTHENTICATION STATE OBSERVER ---
    auth.onAuthStateChanged(function(user) {
        if (user) { // User is logged in
            authContainer.classList.add('hidden');
            mainContent.classList.remove('hidden');

            checkAdminStatus(user).then(function() {
                updateUserUI(user);

                // Start the inactivity timer
                resetInactivityTimer();
                for (var i = 0; i < userActivityEvents.length; i++) {
                    window.addEventListener(userActivityEvents[i], resetInactivityTimer);
                }

                initializeDataListeners();
            });
        } else { // User is logged out
            isAdmin = false;
            authContainer.classList.remove('hidden');
            mainContent.classList.add('hidden');
            userDisplay.textContent = '';

            // Stop the inactivity timer
            clearTimeout(inactivityTimer);
            if (userActivityEvents) {
                for (var j = 0; j < userActivityEvents.length; j++) {
                    window.removeEventListener(userActivityEvents[j], resetInactivityTimer);
                }
            }

            // Reset forms and clear errors
            if(loginForm) loginForm.reset();
            if(signupForm) signupForm.reset();
            var loginError = document.getElementById('login-error');
            var signupError = document.getElementById('signup-error');
            if(loginError) loginError.textContent = '';
            if(signupError) signupError.textContent = '';

            db.ref('products').off();
            db.ref('requests').off();
        }
    });

    // --- LOGIN, SIGNUP, & LOGOUT ---
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var username = document.getElementById('login-username').value;
        var creds = getCredentialsFromUsername(username);
        var loginError = document.getElementById('login-error');
        loginError.textContent = '';

        auth.signInWithEmailAndPassword(creds.email, creds.password)
            .catch(function(err) {
                loginError.textContent = "Invalid username.";
            });
    });

    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var username = document.getElementById('signup-username').value;
        var creds = getCredentialsFromUsername(username);
        var signupError = document.getElementById('signup-error');
        signupError.textContent = '';

        auth.createUserWithEmailAndPassword(creds.email, creds.password)
            .catch(function(err) {
                if (err.code === 'auth/email-already-in-use') {
                    signupError.textContent = 'This username is already taken.';
                } else {
                    signupError.textContent = 'Could not create account.';
                }
            });
    });

    document.getElementById('sign-out-btn').addEventListener('click', function() { auth.signOut(); });

    // --- FORM TOGGLING ---
    document.getElementById('show-signup').addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });
    document.getElementById('show-login').addEventListener('click', function(e) {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // --- REAL-TIME DATA LISTENERS ---
    function initializeDataListeners() {
        db.ref('products').on('value', function(snapshot) {
            products = snapshot.val() || [];
            renderAll();
        });
        db.ref('requests').on('value', function(snapshot) {
            requests = snapshot.val() || [];
            renderRequests();
        });
    }

    // --- PAGE NAVIGATION ---
    var pages = document.querySelectorAll('.page');
    var navLinks = document.querySelectorAll('nav a');
    var showPage = function(pageId) {
        for (var i = 0; i < pages.length; i++) {
            pages[i].classList.toggle('active', pages[i].id === pageId);
        }
        for (var j = 0; j < navLinks.length; j++) {
            navLinks[j].classList.toggle('active', navLinks[j].id === 'nav-' + pageId.split('-')[1]);
        }
    };
    for (var k = 0; k < navLinks.length; k++) {
        navLinks[k].addEventListener('click', function(event) {
            event.preventDefault();
            var pId = 'page-' + this.id.split('-')[1];
            showPage(pId);
        });
    }

    // --- RENDERING FUNCTIONS ---
    var renderProducts = function() {
        var productsList = document.getElementById('products-list');
        productsList.innerHTML = '';
        for (var i = 0; i < products.length; i++) {
            var product = products[i];
            var item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = '<div><span class="list-item-details">' + product.name + '</span> ' +
                             '<span class="list-item-distributor">(' + product.distributor + ')</span></div>' +
                             '<button class="delete-btn" data-index="' + i + '">Delete</button>';
            productsList.appendChild(item);
        }
    };

    var renderProductSelect = function() {
        var productSelect = document.getElementById('product-select');
        productSelect.innerHTML = '<option value="">--Please choose a product--</option>';
        for (var i = 0; i < products.length; i++) {
            var product = products[i];
            var option = document.createElement('option');
            option.value = product.name;
            option.textContent = product.name + ' (' + product.distributor + ')';
            productSelect.appendChild(option);
        }
    };

    var renderRequests = function() {
        var requestsList = document.getElementById('requests-list');
        requestsList.innerHTML = '';
        if (!requests || requests.length === 0) return;

        var requestsByDistributor = {};
        for (var i = 0; i < requests.length; i++) {
            var request = requests[i];
            var product = null;
            for (var j = 0; j < products.length; j++) {
                if (products[j].name === request.name) {
                    product = products[j];
                    break;
                }
            }
            var distributor = product ? product.distributor : 'Unknown';
            if (!requestsByDistributor[distributor]) {
                requestsByDistributor[distributor] = [];
            }
            requestsByDistributor[distributor].push(request);
        }

        for (var dist in requestsByDistributor) {
            var distributorHeader = document.createElement('h3');
            distributorHeader.textContent = dist;
            distributorHeader.style.cssText = 'border-bottom: 1px solid var(--neutral-color); padding-bottom: 5px; margin-top: 20px;';
            requestsList.appendChild(distributorHeader);

            var distRequests = requestsByDistributor[dist];
            for (var k = 0; k < distRequests.length; k++) {
                var req = distRequests[k];
                var item = document.createElement('div');
                item.className = 'list-item';
                var date = new Date(req.timestamp);
                var formattedDateTime = date.toLocaleString('en-US', {
                    month: '2-digit', day: '2-digit', year: 'numeric',
                    hour: 'numeric', minute: '2-digit', hour12: true
                }).replace(',', '');

                item.innerHTML = '<div><span class="list-item-details">' + req.name + '</span>' +
                                 '<div class="list-item-meta">' + req.requestedBy + ' <br> ' + formattedDateTime + '</div></div>' +
                                 '<button class="delete-btn" data-name="' + req.name + '">Ordered / Remove</button>';
                requestsList.appendChild(item);
            }
        }
    };

    var renderAll = function() {
        renderProducts();
        renderProductSelect();
        renderRequests();
    };

    // --- EVENT LISTENERS FOR DATA MANIPULATION ---
    document.getElementById('add-product-form').addEventListener('submit', function(e) {
        e.preventDefault();
        var newProduct = {
            name: document.getElementById('product-name').value,
            distributor: document.getElementById('product-distributor').value
        };
        var updatedProducts = products.concat([newProduct]);
        db.ref('products').set(updatedProducts);
        e.target.reset();
    });

    document.getElementById('products-list').addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            var index = parseInt(e.target.dataset.index);
            var updatedProducts = [].concat(products);
            updatedProducts.splice(index, 1);
            db.ref('products').set(updatedProducts);
        }
    });

    document.getElementById('request-form').addEventListener('submit', function(e) {
        e.preventDefault();
        var selectedProductName = document.getElementById('product-select').value;
        var currentUser = auth.currentUser;
        var alreadyRequested = false;
        for (var i = 0; i < requests.length; i++) {
            if (requests[i].name === selectedProductName) {
                alreadyRequested = true;
                break;
            }
        }
        if (selectedProductName && currentUser && !alreadyRequested) {
            var newRequest = {
                name: selectedProductName,
                requestedBy: getUsernameFromUser(currentUser),
                timestamp: Date.now()
            };
            var updatedRequests = requests.concat([newRequest]);
            db.ref('requests').set(updatedRequests);
        }
        e.target.reset();
    });

    document.getElementById('requests-list').addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            var productNameToRemove = e.target.dataset.name;
            var updatedRequests = [];
            for (var i = 0; i < requests.length; i++) {
                if (requests[i].name !== productNameToRemove) {
                    updatedRequests.push(requests[i]);
                }
            }
            db.ref('requests').set(updatedRequests);
        }
    });

    // --- SETTINGS EVENT LISTENERS ---
    document.getElementById('share-requests').addEventListener('click', function() {
        if (requests.length === 0) {
            alert("There are no items in the order list to share.");
            return;
        }

        var requestsByDistributor = {};
        for (var i = 0; i < requests.length; i++) {
            var req = requests[i];
            var product = null;
            for (var j = 0; j < products.length; j++) {
                if (products[j].name === req.name) {
                    product = products[j];
                    break;
                }
            }
            var distributor = product ? product.distributor : 'Unknown Distributor';
            if (!requestsByDistributor[distributor]) {
                requestsByDistributor[distributor] = [];
            }
            requestsByDistributor[distributor].push(req.name);
        }

        var today = new Date();
        var dateString = today.toLocaleDateString('en-US');
        var venueName = getVenueName();
        var shareText = venueName + ' Order List - ' + dateString + '\n\n';

        for (var dist in requestsByDistributor) {
            shareText += '--- ' + dist + ' ---\n';
            var distItems = requestsByDistributor[dist];
            for (var k = 0; k < distItems.length; k++) {
                shareText += '- ' + distItems[k] + '\n';
            }
            shareText += '\n';
        }

        if (navigator.share) {
            navigator.share({
                title: venueName + ' Ordering Requests',
                text: shareText
            }).catch(function(error) {
                console.error('Error sharing:', error);
            });
        } else {
            try {
                var textArea = document.createElement("textarea");
                textArea.value = shareText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert("Order list copied to clipboard!");
            } catch (err) {
                console.error('Failed to copy text: ', err);
                alert("Could not copy the list.");
            }
        }
    });

    document.getElementById('backup-data').addEventListener('click', function() {
        var backupData = JSON.stringify({ products: products, requests: requests }, null, 2);
        var blob = new Blob([backupData], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'ta_station_backup_' + Date.now() + '.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    document.getElementById('restore-data').addEventListener('click', function() {
        var backupString = prompt("Paste your backup data below to restore it to Firebase:");
        if (!backupString) return;
        try {
            var restoredData = JSON.parse(backupString);
            if (restoredData.products && restoredData.requests) {
                if (confirm("This will overwrite all current products and requests. Are you sure?")) {
                    db.ref('products').set(restoredData.products);
                    db.ref('requests').set(restoredData.requests);
                    alert('Data restored successfully!');
                }
            } else { alert('Invalid backup data format.'); }
        } catch (error) { alert('Could not parse restore data. Please check the format.'); }
    });

    var saveVenueBtn = document.getElementById('save-venue-name-btn');
    if (saveVenueBtn) {
        saveVenueBtn.addEventListener('click', function() {
            var venueInput = document.getElementById('setting-venue-name');
            if (venueInput) {
                setVenueName(venueInput.value);
                alert('Venue name saved successfully!');
            }
        });
    }

    // --- BACKGROUND IMAGE FUNCTION ---
    function setRandomBackground() {
        var backgroundImages = [
            "images/TAStation-1.JPG", "images/TAStation-2.JPG", "images/TAStation-3.JPG",
            "images/TAStation-4.JPG", "images/TAStation-5.JPG", "images/TAStation-6.JPG",
            "images/TAStation-7.JPG", "images/TAStation-8.JPG", "images/TAStation-9.JPG",
            "images/TAStation-10.JPG", "images/TAStation-11.JPG", "images/TAStation-12.JPG",
            "images/TAStation-13.JPG", "images/TAStation-14.JPG", "images/TAStation-15.JPG",
            "images/TAStation-16.JPG", "images/TAStation-17.JPG", "images/TAStation-18.JPG",
            "images/TAStation-19.JPG", "images/TAStation-20.JPG", "images/TAStation-21.JPG",
            "images/TAStation-22.JPG"
        ];
        var randomIndex = Math.floor(Math.random() * backgroundImages.length);
        document.body.style.backgroundImage = 'url("' + backgroundImages[randomIndex] + '")';
    }
});
