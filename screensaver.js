/* ============================================
   T.A. STATION SCREENSAVER MODULE
   Shared functionality for gallery.html and index.html
   ============================================ */

(function(window) {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    var CONFIG = {
        MIN_INTERVAL: 1,
        MAX_INTERVAL: 60,
        DEFAULT_INTERVAL: 5,
        MAX_PRELOAD: 3,
        CLOCK_UPDATE_MS: 1000,
        TOAST_DURATION_MS: 3000,
        LOCALSTORAGE_KEY: 'tastation-screensaver-settings'
    };

    // ============================================
    // DEFAULT SETTINGS
    // ============================================
    var DEFAULT_SETTINGS = {
        // Venue / Establishment Name
        establishmentName: 'T.A. Station',

        // Screensaver display settings
        intervalTime: 5,
        transitionEffect: 'fade',
        showClock: true,
        clockFormat: '24', // '12' or '24'
        showPhotoInfo: false,

        // Auto-timeout settings (only used on index.html)
        autoScreensaverEnabled: true,
        inactivityTimeout: 3, // minutes
        showWarning: true
    };

    // ============================================
    // STATE VARIABLES
    // ============================================
    var settings = {};
    // Shallow copy DEFAULT_SETTINGS to settings
    for (var key in DEFAULT_SETTINGS) {
        if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) {
            settings[key] = DEFAULT_SETTINGS[key];
        }
    }

    var screensaverInterval;
    var clockInterval;
    var shuffledImages = [];
    var currentIndex = 0;
    var images = [];
    var preloadedImages = {}; // Using an object as a simple Map replacement for ES5

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    // Fisher-Yates shuffle algorithm
    function shuffleArray(array) {
        var shuffled = array.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled;
    }

    // Extract filename from path
    function getFilename(path) {
        return path.split('/').pop();
    }

    // Check if localStorage is available
    function isLocalStorageAvailable() {
        try {
            var test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Check if motion should be reduced
    function shouldReduceMotion() {
        if (window.matchMedia) {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        return false;
    }

    // ============================================
    // SETTINGS MANAGEMENT
    // ============================================

    function loadSettings() {
        if (!isLocalStorageAvailable()) {
            console.warn('localStorage not available, using default settings');
            return;
        }

        var saved = localStorage.getItem(CONFIG.LOCALSTORAGE_KEY);
        if (saved) {
            try {
                var parsed = JSON.parse(saved);
                for (var key in parsed) {
                    if (Object.prototype.hasOwnProperty.call(parsed, key)) {
                        settings[key] = parsed[key];
                    }
                }
            } catch (e) {
                console.error('Failed to parse saved settings:', e);
            }
        }
    }

    function saveSettings() {
        if (isLocalStorageAvailable()) {
            try {
                localStorage.setItem(CONFIG.LOCALSTORAGE_KEY, JSON.stringify(settings));
            } catch (e) {
                console.warn('Could not persist settings to localStorage:', e);
            }
        }
        return true;
    }

    // ============================================
    // IMAGE PRELOADING
    // ============================================

    function preloadNextImage() {
        if (shuffledImages.length === 0) return;

        // Simple preloadedImages cleanup
        var keys = [];
        for (var k in preloadedImages) {
            if (preloadedImages.hasOwnProperty(k)) keys.push(k);
        }
        
        if (keys.length >= CONFIG.MAX_PRELOAD) {
            delete preloadedImages[keys[0]];
        }

        var nextIndex = (currentIndex + 1) % shuffledImages.length;
        var nextSrc = shuffledImages[nextIndex];

        if (!preloadedImages[nextSrc]) {
            var img = new Image();
            img.src = nextSrc;
            preloadedImages[nextSrc] = img;
        }
    }

    // ============================================
    // CLOCK FUNCTIONS
    // ============================================

    function updateClock() {
        var clockEl = document.getElementById('screensaverClock');
        if (!clockEl) return;

        if (!settings.showClock) {
            clockEl.style.display = 'none';
            return;
        }

        var now = new Date();
        var hours = now.getHours();
        var mins = now.getMinutes();
        var minutes = (mins < 10 ? '0' : '') + mins;

        var timeString;
        if (settings.clockFormat === '12') {
            // 12-hour format with AM/PM
            var ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 should be 12
            timeString = hours + ':' + minutes + ' ' + ampm;
        } else {
            // 24-hour format
            var hStr = (hours < 10 ? '0' : '') + hours;
            timeString = hStr + ':' + minutes;
        }

        clockEl.textContent = timeString;
        clockEl.style.display = 'block';
    }

    function startClock() {
        updateClock();
        clockInterval = setInterval(updateClock, CONFIG.CLOCK_UPDATE_MS);
    }

    function stopClock() {
        if (clockInterval) {
            clearInterval(clockInterval);
            clockInterval = null;
        }
    }

    // ============================================
    // PHOTO INFO FUNCTIONS
    // ============================================

    function updatePhotoInfo() {
        var photoInfoEl = document.querySelector('.photo-info');
        if (!photoInfoEl) return;

        if (!settings.showPhotoInfo) {
            photoInfoEl.style.display = 'none';
            return;
        }

        var photoNameEl = document.getElementById('photoName');
        var photoCountEl = document.getElementById('photoCount');

        if (photoNameEl && photoCountEl) {
            var filename = getFilename(shuffledImages[currentIndex]);
            photoNameEl.textContent = filename;
            photoCountEl.textContent = (currentIndex + 1) + ' of ' + shuffledImages.length;
            photoInfoEl.style.display = 'block';
        }
    }

    // ============================================
    // TRANSITION SELECTION
    // ============================================

    function getTransitionClass() {
        if (shouldReduceMotion()) {
            return 'fade-transition';
        }

        var effect = settings.transitionEffect;

        if (effect === 'pan-zoom') {
            var panZoomVariants = ['pan-zoom-lr', 'pan-zoom-rl', 'pan-zoom-tb', 'pan-zoom-bt'];
            return panZoomVariants[Math.floor(Math.random() * panZoomVariants.length)];
        }

        return effect + '-transition';
    }

    // ============================================
    // LOADING INDICATOR
    // ============================================

    function showLoadingIndicator() {
        var indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = 'block';
        }
    }

    function hideLoadingIndicator() {
        var indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    // ============================================
    // SHOW NEXT IMAGE
    // ============================================

    function showNextImage() {
        var container = document.getElementById('screensaverImage');
        if (!container) return;

        var img = new Image();

        // Error handling for failed image loads
        img.onerror = function() {
            console.error('Failed to load image:', shuffledImages[currentIndex]);
            hideLoadingIndicator();

            // Skip to next image
            currentIndex = (currentIndex + 1) % shuffledImages.length;
            if (currentIndex !== 0) {
                showNextImage(); // Recursive call to try next image
            } else {
                // All images failed
                showNotification('Unable to load images');
                stopScreensaver();
            }
        };

        img.onload = function() {
            hideLoadingIndicator();

            // Only display if image loaded successfully
            img.className = getTransitionClass();
            img.alt = getFilename(shuffledImages[currentIndex]);

            container.innerHTML = '';
            container.appendChild(img);

            // Update photo info overlay
            updatePhotoInfo();

            // Move to next image
            currentIndex = (currentIndex + 1) % shuffledImages.length;

            // Reshuffle when we complete the cycle
            if (currentIndex === 0) {
                shuffledImages = shuffleArray(images);
            }

            // Preload next image for smooth transition
            preloadNextImage();
        };

        showLoadingIndicator();
        img.src = shuffledImages[currentIndex];
    }

    // ============================================
    // FULLSCREEN MANAGEMENT
    // ============================================

    function isFullscreenSupported() {
        return !!(
            document.fullscreenEnabled ||
            document.webkitFullscreenEnabled ||
            document.msFullscreenEnabled
        );
    }

    function enterFullscreen() {
        if (!isFullscreenSupported()) {
            console.warn('Fullscreen not supported, using overlay mode');
            return;
        }

        var elem = document.documentElement;

        if (elem.requestFullscreen) {
            elem.requestFullscreen()['catch'](function(err) {
                console.log('Fullscreen request failed:', err);
            });
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    }

    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen()['catch'](function(err) {
                console.log('Exit fullscreen failed:', err);
            });
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================

    function showNotification(message) {
        var toast = document.getElementById('toast');

        // Create toast if it doesn't exist
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.className = 'toast show';

        setTimeout(function() {
            toast.className = 'toast';
        }, CONFIG.TOAST_DURATION_MS);
    }

    // ============================================
    // START/STOP SCREENSAVER
    // ============================================

    function startScreensaver() {
        // Validate we have images
        if (images.length === 0) {
            showNotification('No images found in gallery!');
            return;
        }

        // Shuffle images for random display
        shuffledImages = shuffleArray(images);
        currentIndex = 0;

        // Show screensaver container
        var container = document.getElementById('screensaverContainer');
        if (!container) {
            console.error('Screensaver container not found');
            return;
        }

        container.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Enter fullscreen mode
        enterFullscreen();

        // Start clock
        startClock();

        // Show first image immediately
        showNextImage();

        // Set interval for subsequent images
        screensaverInterval = setInterval(showNextImage, settings.intervalTime * 1000);
    }

    function stopScreensaver() {
        // Clear intervals
        if (screensaverInterval) {
            clearInterval(screensaverInterval);
            screensaverInterval = null;
        }
        stopClock();

        // Hide screensaver
        var container = document.getElementById('screensaverContainer');
        if (container) {
            container.style.display = 'none';
        }
        document.body.style.overflow = 'auto';

        // Exit fullscreen
        exitFullscreen();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    function initialize(imageArray) {
        // Store images
        images = imageArray || [];

        // Load saved settings
        loadSettings();

        console.log('Screensaver initialized with ' + images.length + ' images');

        // Listen for fullscreen change events
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);
    }

    function handleFullscreenChange() {
        // If user exits fullscreen manually, stop screensaver
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            var container = document.getElementById('screensaverContainer');
            if (container && container.style.display === 'block') {
                stopScreensaver();
            }
        }
    }

    // ============================================
    // SETTINGS MODAL HELPER
    // ============================================

    function populateSettingsModal(modalId) {
        var establishmentNameInput = document.getElementById('establishmentName');
        var intervalInput = document.getElementById('intervalTime');
        var transitionSelect = document.getElementById('transitionEffect');
        var clockCheckbox = document.getElementById('showClock');
        var clockFormatSelect = document.getElementById('clockFormat');
        var photoInfoCheckbox = document.getElementById('showPhotoInfo');
        var autoScreensaverCheckbox = document.getElementById('enableAutoScreensaver');
        var inactivityTimeoutInput = document.getElementById('inactivityTimeout');

        if (establishmentNameInput) establishmentNameInput.value = settings.establishmentName || 'T.A. Station';
        if (intervalInput) intervalInput.value = settings.intervalTime;
        if (transitionSelect) transitionSelect.value = settings.transitionEffect;
        if (clockCheckbox) clockCheckbox.checked = settings.showClock;
        if (clockFormatSelect) clockFormatSelect.value = settings.clockFormat || '24';
        if (photoInfoCheckbox) photoInfoCheckbox.checked = settings.showPhotoInfo;
        if (autoScreensaverCheckbox) autoScreensaverCheckbox.checked = settings.autoScreensaverEnabled;
        if (inactivityTimeoutInput) inactivityTimeoutInput.value = settings.inactivityTimeout;
    }

    function saveSettingsFromModal() {
        var establishmentNameInput = document.getElementById('establishmentName');
        var intervalInput = document.getElementById('intervalTime');
        var transitionSelect = document.getElementById('transitionEffect');
        var clockCheckbox = document.getElementById('showClock');
        var clockFormatSelect = document.getElementById('clockFormat');
        var photoInfoCheckbox = document.getElementById('showPhotoInfo');
        var autoScreensaverCheckbox = document.getElementById('enableAutoScreensaver');
        var inactivityTimeoutInput = document.getElementById('inactivityTimeout');

        if (establishmentNameInput && establishmentNameInput.value.trim()) {
            settings.establishmentName = establishmentNameInput.value.trim();
        }

        // Validate and update interval time
        if (intervalInput) {
            var intervalValue = parseInt(intervalInput.value);
            if (isNaN(intervalValue) || intervalValue < CONFIG.MIN_INTERVAL) {
                intervalValue = CONFIG.MIN_INTERVAL;
                intervalInput.value = CONFIG.MIN_INTERVAL;
                intervalInput.style.border = '2px solid orange';
                setTimeout(function() { intervalInput.style.border = '1px solid #ddd'; }, 2000);
            } else if (intervalValue > CONFIG.MAX_INTERVAL) {
                intervalValue = CONFIG.MAX_INTERVAL;
                intervalInput.value = CONFIG.MAX_INTERVAL;
                intervalInput.style.border = '2px solid orange';
                setTimeout(function() { intervalInput.style.border = '1px solid #ddd'; }, 2000);
            }
            settings.intervalTime = intervalValue;
        }

        // Validate and update inactivity timeout
        if (inactivityTimeoutInput) {
            var timeoutValue = parseInt(inactivityTimeoutInput.value);
            if (isNaN(timeoutValue) || timeoutValue < 1) {
                timeoutValue = 1;
                inactivityTimeoutInput.value = 1;
            } else if (timeoutValue > 30) {
                timeoutValue = 30;
                inactivityTimeoutInput.value = 30;
            }
            settings.inactivityTimeout = timeoutValue;
        }

        if (transitionSelect) settings.transitionEffect = transitionSelect.value;
        if (clockCheckbox) settings.showClock = clockCheckbox.checked;
        if (clockFormatSelect) settings.clockFormat = clockFormatSelect.value;
        if (photoInfoCheckbox) settings.showPhotoInfo = photoInfoCheckbox.checked;
        if (autoScreensaverCheckbox) settings.autoScreensaverEnabled = autoScreensaverCheckbox.checked;

        // Save settings to memory and storage
        saveSettings();
        showNotification('Settings saved successfully!');
        return true;
    }

    // ============================================
    // PUBLIC API
    // ============================================

    window.TAScreensaver = {
        initialize: initialize,
        start: startScreensaver,
        stop: stopScreensaver,
        getSettings: function() { 
            var copy = {};
            for (var k in settings) {
                if (settings.hasOwnProperty(k)) copy[k] = settings[k];
            }
            return copy;
        },
        updateSettings: function(newSettings) {
            for (var k in newSettings) {
                if (newSettings.hasOwnProperty(k)) {
                    settings[k] = newSettings[k];
                }
            }
            saveSettings();
        },
        getEstablishmentName: function() {
            return settings.establishmentName || 'T.A. Station';
        },
        setEstablishmentName: function(name) {
            settings.establishmentName = (name && name.trim()) ? name.trim() : 'T.A. Station';
            saveSettings();
        },
        populateSettingsModal: populateSettingsModal,
        saveSettingsFromModal: saveSettingsFromModal,
        showNotification: showNotification
    };

})(window);
