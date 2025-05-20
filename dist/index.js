/**
 * GamblingDetector Script Loader
 * Safely loads the GamblingDetector module in both Node.js and browser environments
 * Version: 1.1.2
 */
const version = "1.1.2";

(function(global) {
    'use strict';

    // Configuration
    const config = {
        cdnUrl: 'https://cdn.jsdelivr.net/npm/gbdetector',
        scriptPath: '/dist/detector.min.js', // Example integrity hash - update with actual hash
        timeoutMs: 10000, // 10 seconds timeout for script loading
        retryAttempts: 2,
        retryDelayMs: 2000
    };

    /**
     * Logs an error with consistent formatting
     * @param {string} message - Error message
     * @param {Error} [error] - Optional error object
     */
    function logError(message, error) {
        if (typeof console !== 'undefined') {
            console.error(`[GamblingDetector] ${message}`, error || '');
        }
    }

    /**
     * Creates a safe event handler that catches errors
     * @param {Function} fn - Function to wrap
     * @returns {Function} Error-catching wrapper function
     */
    function safeEventHandler(fn) {
        return function(event) {
            try {
                fn.call(this, event);
            } catch (err) {
                logError('Error in event handler:', err);
            }
        };
    }

    /**
     * Loads the GamblingDetector script in a browser environment
     */
    function loadInBrowser() {
        // Check if already loaded
        if (typeof global.GamblingDetector !== 'undefined') {
            console.log('[GamblingDetector] Module already loaded.');
            return;
        }

        let attempts = 0;

        /**
         * Attempts to load the script with retry capability
         */
        function attemptLoad() {
            attempts++;

            const script = document.createElement('script');
            script.src = `${config.cdnUrl}@${version}${config.scriptPath}`;
            script.type = 'text/javascript';
            script.defer = true;
            script.async = true;
            script.id = `GamblingDetector-${version.replace(/\./g, '-')}`;

            // Set loading timeout
            const timeoutId = setTimeout(() => {
                if (script.parentNode) {
                    script.onload = script.onerror = null;
                    script.parentNode.removeChild(script);

                    if (attempts <= config.retryAttempts) {
                        console.warn(`[GamblingDetector] Loading timed out, retrying (${attempts}/${config.retryAttempts})...`);
                        setTimeout(attemptLoad, config.retryDelayMs);
                    } else {
                        logError(`Failed to load after ${config.retryAttempts} attempts.`);
                    }
                }
            }, config.timeoutMs);

            // Success handler
            script.onload = safeEventHandler(() => {
                clearTimeout(timeoutId);

                if (typeof global.GamblingDetector !== 'undefined') {
                    console.log('[GamblingDetector] Successfully loaded version:', version);

                    // Initialize detector if callback function exists
                    if (typeof global.onGamblingDetectorReady === 'function') {
                        try {
                            global.onGamblingDetectorReady(global.GamblingDetector);
                        } catch (err) {
                            logError('Error in initialization callback:', err);
                        }
                    }
                } else {
                    logError('Script loaded but GamblingDetector is not defined.');
                }
            });

            // Error handler
            script.onerror = safeEventHandler(() => {
                clearTimeout(timeoutId);
                script.parentNode.removeChild(script);

                if (attempts <= config.retryAttempts) {
                    console.warn(`[GamblingDetector] Loading failed, retrying (${attempts}/${config.retryAttempts})...`);
                    setTimeout(attemptLoad, config.retryDelayMs);
                } else {
                    logError(`Failed to load after ${config.retryAttempts} attempts.`);
                }
            });

            // Add script to document
            document.head.appendChild(script);
        }

        // Start loading process
        attemptLoad();
    }

    // Handle Node.js environment
    if (typeof module !== 'undefined' && module.exports) {
        try {
            const {
                GamblingDetector
            } = require('./detector');
            module.exports = {GamblingDetector , GbDetector:GamblingDetector, version};
        } catch (err) {
            logError('Failed to load GamblingDetector in Node.js:', err);
            module.exports = null;
        }
    }
    // Handle browser environment
    else if (typeof window !== 'undefined') {
        // Make sure DOM is ready before loading
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', safeEventHandler(loadInBrowser));
        } else {
            loadInBrowser();
        }

        // Export a simple API for manually initializing
        global.loadGamblingDetector = function(options) {
            // Merge user options with defaults
            if (options) {
                Object.keys(options).forEach(key => {
                    if (config.hasOwnProperty(key)) {
                        config[key] = options[key];
                    }
                });
            }
            loadInBrowser();
        };
    }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));


/**
 * The 'GB' class is designed to detect and handle comments that may contain elements of gambling promotions.
 * It detects the environment (browser or Node.js) where the application is running and loads the appropriate `GamblingDetector`.
 */
class GB {
    // Static property that stores the platform type (either "browser" or "node")
    static platform = null;

    /**
     * Initializes the class by detecting the platform (browser or node).
     * This method should be called first to properly set the platform.
     */
    static init() {
        this.platform = this.getEnvironment(); // Determine and store the platform where the application is running (browser or node)
    }

    /**
     * Static getter for the GamblingDetector.
     * The method returns the appropriate GamblingDetector based on the platform.
     * If running in Node.js, it imports the GamblingDetector from a local module.
     * If running in the browser, it checks for a specific DOM element to verify if the GamblingDetector is available.
     */
    static get GamblingDetector() {
        // Check if the platform is Node.js, then require the GamblingDetector from a local file
        if (this.platform === "node") {
            const {
                GamblingDetector
            } = require('./detector'); // Import GamblingDetector for Node.js
            return GamblingDetector; // Return the GamblingDetector module for Node.js
        } else if (this.platform === "browser") {
            // If the platform is the browser, check for the DOM element that indicates GamblingDetector is loaded
            const isRunning = document?.getElementById(`GamblingDetector-${version.replace(/\./g, '-')}`) || null;
            if (isRunning) {
                return GamblingDetector; // If the GamblingDetector is already loaded in the browser, return it
            }
        }

        // If GamblingDetector is not available or cannot be found in the current environment, throw an error
        throw new Error("GamblingDetector is not available in the current environment. Ensure it is loaded properly.");
    }

    /**
     * Private method to check if the current environment is a browser.
     * It checks for the presence of `window` and `document` objects, which are typically available in a browser.
     */
    static #isBrowser() {
        return typeof window !== 'undefined' && typeof window.document !== 'undefined'; // True if running in a browser
    }

    /**
     * Private method to check if the current environment is Node.js.
     * It checks for the presence of `process` and the `node` version, which are specific to Node.js.
     */
    static #isNode() {
        return typeof process !== 'undefined' && process.versions != null && process.versions.node != null; // True if running in Node.js
    }

    /**
     * Determines the current environment (browser, node, or unknown).
     * Uses the private methods #isBrowser() and #isNode() to check the platform.
     * 
     * @returns {string} The environment type: 'browser', 'node', or 'unknown'.
     */
    static getEnvironment() {
        if (this.#isBrowser()) return 'browser'; // Return 'browser' if running in the browser
        if (this.#isNode()) return 'node'; // Return 'node' if running in Node.js
        return 'unknown'; // Return 'unknown' if neither browser nor Node.js
    }
}

// Inisialisasi untuk menentukan platform
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = {
      GB
    };

} else if (typeof exports !== 'undefined' && typeof exports?.default !== 'undefined') {
    // Export for ES modules
    exports.default = {
      GB
    };
};