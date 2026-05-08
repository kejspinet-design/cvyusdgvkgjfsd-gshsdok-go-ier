/**
 * Ultra-Premium Interactive Effects
 * Advanced JavaScript animations and interactions
 */

class UltraPremiumEffects {
    constructor() {
        this.init();
    }

    init() {
        this.initSmoothScroll();
        this.initNavbarEffects();
        this.initMagneticButtons();
        this.initParallax();
        this.initIntersectionObserver();
        this.initCursorEffects();
        this.initModalHandlers();
        this.initDropdownHandlers();
    }

    /**
     * Smooth scroll for anchor links
     */
    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Navbar scroll effects
     */
    initNavbarEffects() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        let lastScroll = 0;
        const scrollThreshold = 100;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            // Change navbar style on scroll
            if (currentScroll > scrollThreshold) {
                navbar.style.background = 'rgba(5, 5, 5, 0.95)';
                navbar.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.6)';
            } else {
                navbar.style.background = 'rgba(5, 5, 5, 0.7)';
                navbar.style.boxShadow = 'none';
            }

            // Hide/show navbar on scroll
            if (currentScroll > lastScroll && currentScroll > 500) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }

            lastScroll = currentScroll;
        });
    }

    /**
     * Magnetic button effect
     */
    initMagneticButtons() {
        const buttons = document.querySelectorAll('.btn, .magnetic');

        buttons.forEach(button => {
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                const moveX = x * 0.15;
                const moveY = y * 0.15;

                button.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = '';
            });
        });
    }

    /**
     * Parallax effect for hero section
     */
    initParallax() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxSpeed = 0.5;

            hero.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
            hero.style.opacity = 1 - (scrolled / 800);
        });
    }

    /**
     * Intersection Observer for fade-in animations
     */
    initIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    entry.target.classList.add('animated');
                }
            });
        }, observerOptions);

        // Observe elements
        const elements = document.querySelectorAll('.card, .stat-widget, .pricing-card, .feature-grid > *');
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            observer.observe(el);
        });
    }

    /**
     * Custom cursor effects
     */
    initCursorEffects() {
        // Create custom cursor
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(139, 92, 246, 0.5);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transition: transform 0.2s ease, opacity 0.2s ease;
            opacity: 0;
        `;
        document.body.appendChild(cursor);

        const cursorDot = document.createElement('div');
        cursorDot.className = 'custom-cursor-dot';
        cursorDot.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: rgba(139, 92, 246, 0.8);
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            transition: transform 0.1s ease;
            opacity: 0;
        `;
        document.body.appendChild(cursorDot);

        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX - 10 + 'px';
            cursor.style.top = e.clientY - 10 + 'px';
            cursor.style.opacity = '1';

            cursorDot.style.left = e.clientX - 2 + 'px';
            cursorDot.style.top = e.clientY - 2 + 'px';
            cursorDot.style.opacity = '1';
        });

        // Expand cursor on hover
        const interactiveElements = document.querySelectorAll('a, button, .btn, input, textarea');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'scale(1.5)';
                cursor.style.borderColor = 'rgba(139, 92, 246, 0.8)';
            });

            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'scale(1)';
                cursor.style.borderColor = 'rgba(139, 92, 246, 0.5)';
            });
        });
    }

    /**
     * Modal handlers
     */
    initModalHandlers() {
        // Open modal
        document.querySelectorAll('[data-modal-open]').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const modalId = trigger.getAttribute('data-modal-open');
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        // Close modal
        document.querySelectorAll('[data-modal-close]').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const modal = trigger.closest('.modal-backdrop');
                if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = '';
                }
            });
        });

        // Close on backdrop click
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    backdrop.style.display = 'none';
                    document.body.style.overflow = '';
                }
            });
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-backdrop').forEach(modal => {
                    modal.style.display = 'none';
                    document.body.style.overflow = '';
                });
            }
        });
    }

    /**
     * Dropdown handlers
     */
    initDropdownHandlers() {
        document.querySelectorAll('[data-dropdown-toggle]').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdownId = trigger.getAttribute('data-dropdown-toggle');
                const dropdown = document.getElementById(dropdownId);

                if (dropdown) {
                    const isVisible = dropdown.style.display === 'block';
                    
                    // Close all dropdowns
                    document.querySelectorAll('.dropdown-menu').forEach(d => {
                        d.style.display = 'none';
                    });

                    // Toggle current dropdown
                    dropdown.style.display = isVisible ? 'none' : 'block';
                }
            });
        });

        // Close dropdowns on outside click
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        });
    }

    /**
     * Add ripple effect to buttons
     */
    static addRippleEffect(button, e) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * Notification system
     */
    static showNotification(title, message, duration = 5000) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => notification.remove(), 400);
        }, duration);
    }

    /**
     * Loading overlay
     */
    static showLoading() {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(5, 5, 5, 0.9);
            backdrop-filter: blur(20px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        overlay.innerHTML = `
            <div class="spinner"></div>
        `;

        document.body.appendChild(overlay);
    }

    static hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
    }
}

// Add ripple animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new UltraPremiumEffects();
    });
} else {
    new UltraPremiumEffects();
}

// Add ripple to all buttons
document.addEventListener('click', (e) => {
    if (e.target.matches('.btn, button')) {
        UltraPremiumEffects.addRippleEffect(e.target, e);
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UltraPremiumEffects;
}
