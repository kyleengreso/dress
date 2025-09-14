/* ========================================
   SHARED JAVASCRIPT UTILITIES - DRESS CODE DETECTION SYSTEM
   ======================================== */

// Global configuration
const CONFIG = {
    API_BASE_URL: '',
    WEBSOCKET_URL: 'ws://localhost:8000/ws/camera',
    DETECTION_ENDPOINT: '/detect',
    CAMERA_START_ENDPOINT: '/camera/start',
    CAMERA_STOP_ENDPOINT: '/camera/stop',
    CAMERA_STATUS_ENDPOINT: '/camera/status',
    HEALTH_ENDPOINT: '/health'
};

// Utility functions
const Utils = {
    // Show error message
    showError: function(message, container = null) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
        alertDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const targetContainer = container || document.querySelector('.upload-section');
        if (targetContainer) {
            targetContainer.appendChild(alertDiv);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    },

    // Show success message
    showSuccess: function(message, container = null) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
        alertDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const targetContainer = container || document.querySelector('.upload-section');
        if (targetContainer) {
            targetContainer.appendChild(alertDiv);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 3000);
        }
    },

    // Show info message
    showInfo: function(message, container = null) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-info alert-dismissible fade show mt-3';
        alertDiv.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const targetContainer = container || document.querySelector('.upload-section');
        if (targetContainer) {
            targetContainer.appendChild(alertDiv);
        }
    },

    // Format timestamp
    formatTimestamp: function(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    },

    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Check if element is in viewport
    isInViewport: function(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // Smooth scroll to element
    smoothScrollTo: function(element, offset = 0) {
        if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    },

    // Play notification sound
    playNotificationSound: function() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    },

    // Show browser notification
    showBrowserNotification: function(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: options.body || '',
                icon: options.icon || '/static/favicon.ico',
                tag: options.tag || 'dress-code-notification',
                ...options
            });
        }
    },

    // Request notification permission
    requestNotificationPermission: async function() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }
};

// API helper functions
const API = {
    // Make HTTP request
    request: async function(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    // Health check
    checkHealth: async function() {
        try {
            const result = await this.request(CONFIG.HEALTH_ENDPOINT);
            console.log('Server health:', result);
            return result;
        } catch (error) {
            console.error('Server health check failed:', error);
            return null;
        }
    },

    // Start camera
    startCamera: async function() {
        return await this.request(CONFIG.CAMERA_START_ENDPOINT, {
            method: 'POST'
        });
    },

    // Stop camera
    stopCamera: async function() {
        return await this.request(CONFIG.CAMERA_STOP_ENDPOINT, {
            method: 'POST'
        });
    },

    // Get camera status
    getCameraStatus: async function() {
        return await this.request(CONFIG.CAMERA_STATUS_ENDPOINT);
    }
};

// Animation helper
const Animation = {
    // Fade in up animation
    fadeInUp: function(element, delay = 0) {
        if (element) {
            setTimeout(() => {
                element.classList.add('fade-in-up');
            }, delay);
        }
    },

    // Slide in animation
    slideIn: function(element, delay = 0) {
        if (element) {
            setTimeout(() => {
                element.classList.add('slide-in');
            }, delay);
        }
    },

    // Scale in animation
    scaleIn: function(element, delay = 0) {
        if (element) {
            setTimeout(() => {
                element.classList.add('scale-in');
            }, delay);
        }
    },

    // Pulse animation
    pulse: function(element, duration = 2000) {
        if (element) {
            element.classList.add('pulse');
            setTimeout(() => {
                element.classList.remove('pulse');
            }, duration);
        }
    }
};

// Scroll observer for animations
const ScrollObserver = {
    observer: null,
    
    init: function() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        }, observerOptions);
    },

    observe: function(element) {
        if (this.observer && element) {
            this.observer.observe(element);
        }
    },

    observeAll: function(selector) {
        if (this.observer) {
            document.querySelectorAll(selector).forEach(element => {
                this.observe(element);
            });
        }
    }
};

// Initialize shared functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize scroll observer
    ScrollObserver.init();
    
    // Request notification permission
    Utils.requestNotificationPermission();
    
    // Check server health
    API.checkHealth();
    
    // Setup smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                Utils.smoothScrollTo(target);
            }
        });
    });
});

// Export for use in other modules
window.Utils = Utils;
window.API = API;
window.Animation = Animation;
window.ScrollObserver = ScrollObserver;
window.CONFIG = CONFIG;
