/* ========================================
   LANDING PAGE JAVASCRIPT - DRESS CODE DETECTION SYSTEM
   ======================================== */

// Landing page specific functionality
class LandingPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupScrollEffects();
        this.setupAnimations();
        this.setupEventListeners();
    }

    setupNavigation() {
        // Navbar background change on scroll
        window.addEventListener('scroll', Utils.throttle(() => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, 100));
    }

    setupScrollEffects() {
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    Utils.smoothScrollTo(target, 80); // Account for fixed navbar
                }
            });
        });
    }

    setupAnimations() {
        // Observe feature cards for animation
        ScrollObserver.observeAll('.feature-card');
        ScrollObserver.observeAll('.stat-item');
        ScrollObserver.observeAll('.hero-content');
        ScrollObserver.observeAll('.hero-image');
    }

    setupEventListeners() {
        // CTA button click tracking
        document.querySelectorAll('.btn-primary-custom').forEach(button => {
            button.addEventListener('click', (e) => {
                this.trackCTAClick(e.target);
            });
        });

        // Feature card hover effects
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                Animation.pulse(card, 1000);
            });
        });

        // Demo preview interaction
        const demoImage = document.querySelector('.demo-image');
        if (demoImage) {
            demoImage.addEventListener('click', () => {
                this.showDemoModal();
            });
        }
    }

    trackCTAClick(button) {
        // Track CTA button clicks for analytics
        const buttonText = button.textContent.trim();
        console.log(`CTA clicked: ${buttonText}`);
        
        // You can add analytics tracking here
        // Example: gtag('event', 'click', { event_category: 'CTA', event_label: buttonText });
    }

    showDemoModal() {
        // Create and show demo modal
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-video me-2"></i>
                            Live Detection Demo
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div class="demo-preview-large">
                            <div class="demo-image-large">
                                <i class="fas fa-camera fa-4x mb-3" style="color: var(--primary-orange);"></i>
                                <h4>Real-time Dress Code Detection</h4>
                                <p class="text-muted">AI-powered monitoring with instant alerts</p>
                                <div class="mt-4">
                                    <a href="/detect" class="btn btn-primary-custom btn-lg">
                                        <i class="fas fa-play me-2"></i>Try Live Demo
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Initialize Bootstrap modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Clean up when modal is hidden
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    // Parallax effect for hero section
    setupParallax() {
        window.addEventListener('scroll', Utils.throttle(() => {
            const scrolled = window.pageYOffset;
            const hero = document.querySelector('.hero');
            if (hero) {
                const rate = scrolled * -0.5;
                hero.style.transform = `translateY(${rate}px)`;
            }
        }, 10));
    }

    // Counter animation for stats
    animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        const animateCounter = (counter) => {
            const target = parseInt(counter.textContent);
            const increment = target / 100;
            let current = 0;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current);
                }
            }, 20);
        };

        // Start animation when stats section is in view
        const statsSection = document.querySelector('.stats');
        if (statsSection) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        counters.forEach(animateCounter);
                        observer.unobserve(entry.target);
                    }
                });
            });
            observer.observe(statsSection);
        }
    }

    // Typing effect for hero title
    setupTypingEffect() {
        const titleElement = document.querySelector('.hero h1');
        if (titleElement) {
            const text = titleElement.textContent;
            titleElement.textContent = '';
            
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    titleElement.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 100);
                }
            };
            
            // Start typing effect after a short delay
            setTimeout(typeWriter, 500);
        }
    }
}

// Initialize landing page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LandingPage();
});

// Add custom styles for demo modal
const style = document.createElement('style');
style.textContent = `
    .demo-preview-large {
        padding: 2rem;
    }
    
    .demo-image-large {
        background: linear-gradient(135deg, var(--primary-orange), var(--secondary-orange));
        border-radius: 15px;
        padding: 3rem;
        color: white;
        margin: 1rem 0;
    }
    
    .demo-image-large i {
        color: white !important;
    }
    
    .modal-content {
        border: none;
        border-radius: 15px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }
    
    .modal-header {
        background: var(--dark-bg);
        color: white;
        border-radius: 15px 15px 0 0;
    }
    
    .modal-header .btn-close {
        filter: invert(1);
    }
`;
document.head.appendChild(style);
