/* ============================================
   T.A. STATION SCREENSAVER MODULE
   Shared functionality for gallery.html and index.html
   ============================================ */

(function(window) {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
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
    const DEFAULT_SETTINGS = {
        // Screensaver display settings
        intervalTime: 5,
        transitionEffect: 'fade',
        showClock: true,
        showPhotoInfo: false,

        // Auto-timeout settings (only used on index.html)
        autoScreensaverEnabled: true,
        inactivityTimeout: 3, // minutes
        showWarning: true
    };

    // ============================================
    // STATE VARIABLES
    // ============================================
    let settings = { ...DEFAULT_SETTINGS };
    let screensaverInterval;
    let clockInterval;
    let shuffledImages = [];
    let currentIndex = 0;
    let images = [];
    let preloadedImages = new Map();

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    // Fisher-Yates shuffle algorithm
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
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
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Check if motion should be reduced
    function shouldReduceMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // ============================================
    // SETTINGS MANAGEMENT
    // ============================================

    function loadSettings() {
        if (!isLocalStorageAvailable()) {
            console.warn('localStorage not available, using default settings');
            return;
        }

        const saved = localStorage.getItem(CONFIG.LOCALSTORAGE_KEY);
        if (saved) {
            try {
                settings = { ...settings, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Failed to parse saved settings:', e);
            }
        }
    }

    function saveSettings() {
        if (!isLocalStorageAvailable()) {
            showNotification('Settings cannot be saved (localStorage unavailable)');
            return false;
        }

        try {
            localStorage.setItem(CONFIG.LOCALSTORAGE_KEY, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Failed to save settings:', e);
            showNotification('Failed to save settings');
            return false;
        }
    }

    // ============================================
    // IMAGE PRELOADING
    // ============================================

    function preloadNextImage() {
        if (shuffledImages.length === 0) return;

        // Clear old preloads if we have too many
        if (preloadedImages.size >= CONFIG.MAX_PRELOAD) {
            const firstKey = preloadedImages.keys().next().value;
            preloadedImages.delete(firstKey);
        }

        const nextIndex = (currentIndex + 1) % shuffledImages.length;
        const nextSrc = shuffledImages[nextIndex];

        if (!preloadedImages.has(nextSrc)) {
            const img = new Image();
            img.src = nextSrc;
            preloadedImages.set(nextSrc, img);
        }
    }

    // ============================================
    // CLOCK FUNCTIONS
    // ============================================

    function updateClock() {
        const clockEl = document.getElementById('screensaverClock');
        if (!clockEl) return;

        if (!settings.showClock) {
            clockEl.style.display = 'none';
            return;
        }

        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clockEl.textContent = `${hours}:${minutes}`;
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
        const photoInfoEl = document.querySelector('.photo-info');
        if (!photoInfoEl) return;

        if (!settings.showPhotoInfo) {
            photoInfoEl.style.display = 'none';
            return;
        }

        const photoNameEl = document.getElementById('photoName');
        const photoCountEl = document.getElementById('photoCount');

        if (photoNameEl && photoCountEl) {
            const filename = getFilename(shuffledImages[currentIndex]);
            photoNameEl.textContent = filename;
            photoCountEl.textContent = `${currentIndex + 1} of ${shuffledImages.length}`;
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

        const effect = settings.transitionEffect;

        if (effect === 'pan-zoom') {
            const panZoomVariants = ['pan-zoom-lr', 'pan-zoom-rl', 'pan-zoom-tb', 'pan-zoom-bt'];
            return panZoomVariants[Math.floor(Math.random() * panZoomVariants.length)];
        }

        return effect + '-transition';
    }

    // ============================================
    // LOADING INDICATOR
    // ============================================

    function showLoadingIndicator() {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = 'block';
        }
    }

    function hideLoadingIndicator() {
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    // ============================================
    // SHOW NEXT IMAGE
    // ============================================

    function showNextImage() {
        const container = document.getElementById('screensaverImage');
        if (!container) return;

        const img = new Image();

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

        const elem = document.documentElement;

        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {
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
            document.exitFullscreen().catch(err => {
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
        let toast = document.getElementById('toast');

        // Create toast if it doesn't exist
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.className = 'toast show';

        setTimeout(() => {
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
        const container = document.getElementById('screensaverContainer');
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
        const container = document.getElementById('screensaverContainer');
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

        console.log(`Screensaver initialized with ${images.length} images`);

        // Listen for fullscreen change events
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);
    }

    function handleFullscreenChange() {
        // If user exits fullscreen manually, stop screensaver
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            const container = document.getElementById('screensaverContainer');
            if (container && container.style.display === 'block') {
                stopScreensaver();
            }
        }
    }

    // ============================================
    // SETTINGS MODAL HELPER
    // ============================================

    function populateSettingsModal(modalId) {
        const intervalInput = document.getElementById('intervalTime');
        const transitionSelect = document.getElementById('transitionEffect');
        const clockCheckbox = document.getElementById('showClock');
        const photoInfoCheckbox = document.getElementById('showPhotoInfo');
        const autoScreensaverCheckbox = document.getElementById('enableAutoScreensaver');
        const inactivityTimeoutInput = document.getElementById('inactivityTimeout');

        if (intervalInput) intervalInput.value = settings.intervalTime;
        if (transitionSelect) transitionSelect.value = settings.transitionEffect;
        if (clockCheckbox) clockCheckbox.checked = settings.showClock;
        if (photoInfoCheckbox) photoInfoCheckbox.checked = settings.showPhotoInfo;
        if (autoScreensaverCheckbox) autoScreensaverCheckbox.checked = settings.autoScreensaverEnabled;
        if (inactivityTimeoutInput) inactivityTimeoutInput.value = settings.inactivityTimeout;
    }

    function saveSettingsFromModal() {
        const intervalInput = document.getElementById('intervalTime');
        const transitionSelect = document.getElementById('transitionEffect');
        const clockCheckbox = document.getElementById('showClock');
        const photoInfoCheckbox = document.getElementById('showPhotoInfo');
        const autoScreensaverCheckbox = document.getElementById('enableAutoScreensaver');
        const inactivityTimeoutInput = document.getElementById('inactivityTimeout');

        // Validate and update interval time
        if (intervalInput) {
            let intervalValue = parseInt(intervalInput.value);
            if (isNaN(intervalValue) || intervalValue < CONFIG.MIN_INTERVAL) {
                intervalValue = CONFIG.MIN_INTERVAL;
                intervalInput.value = CONFIG.MIN_INTERVAL;
                intervalInput.style.border = '2px solid orange';
                setTimeout(() => intervalInput.style.border = '1px solid #ddd', 2000);
            } else if (intervalValue > CONFIG.MAX_INTERVAL) {
                intervalValue = CONFIG.MAX_INTERVAL;
                intervalInput.value = CONFIG.MAX_INTERVAL;
                intervalInput.style.border = '2px solid orange';
                setTimeout(() => intervalInput.style.border = '1px solid #ddd', 2000);
            }
            settings.intervalTime = intervalValue;
        }

        // Validate and update inactivity timeout
        if (inactivityTimeoutInput) {
            let timeoutValue = parseInt(inactivityTimeoutInput.value);
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
        if (photoInfoCheckbox) settings.showPhotoInfo = photoInfoCheckbox.checked;
        if (autoScreensaverCheckbox) settings.autoScreensaverEnabled = autoScreensaverCheckbox.checked;

        // Save to localStorage
        if (saveSettings()) {
            showNotification('Settings saved successfully!');
            return true;
        }
        return false;
    }

    // ============================================
    // PUBLIC API
    // ============================================

    window.TAScreensaver = {
        initialize: initialize,
        start: startScreensaver,
        stop: stopScreensaver,
        getSettings: function() { return { ...settings }; },
        updateSettings: function(newSettings) {
            settings = { ...settings, ...newSettings };
            saveSettings();
        },
        populateSettingsModal: populateSettingsModal,
        saveSettingsFromModal: saveSettingsFromModal,
        showNotification: showNotification
    };

})(window);
