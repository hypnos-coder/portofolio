// ===================================
// Matrix Portfolio - JavaScript
// ===================================

// === Matrix Rain Animation ===
class MatrixRain {
    constructor() {
        this.canvas = document.getElementById('matrix-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?';
        this.fontSize = 14;
        this.columns = 0;
        this.drops = [];

        this.init();
        this.animate();

        // Resize handler
        window.addEventListener('resize', () => this.init());
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.drops = Array(this.columns).fill(1);
    }

    draw() {
        // Semi-transparent black to create fade effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Matrix green text
        this.ctx.fillStyle = '#00FF41';
        this.ctx.font = `${this.fontSize}px monospace`;

        for (let i = 0; i < this.drops.length; i++) {
            // Random character
            const char = this.characters[Math.floor(Math.random() * this.characters.length)];
            const x = i * this.fontSize;
            const y = this.drops[i] * this.fontSize;

            this.ctx.fillText(char, x, y);

            // Reset drop to top randomly
            if (y > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }

            this.drops[i]++;
        }
    }

    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// === Typing Animation ===
class TypingEffect {
    constructor(element, text, speed = 100) {
        this.element = element;
        this.text = text;
        this.speed = speed;
        this.index = 0;

        this.type();
    }

    type() {
        if (this.index < this.text.length) {
            this.element.textContent += this.text.charAt(this.index);
            this.index++;
            setTimeout(() => this.type(), this.speed);
        }
    }
}

// === Smooth Scroll ===
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');

            if (targetId === '#') return;

            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed nav
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// === Scroll Animations ===
class ScrollAnimations {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            this.observerOptions
        );

        this.init();
    }

    init() {
        // Observe section titles
        const titles = document.querySelectorAll('.section-title');
        titles.forEach(title => this.observer.observe(title));

        // Observe skill cards
        const skillCards = document.querySelectorAll('.skill-card');
        skillCards.forEach((card, index) => {
            card.style.transitionDelay = `${index * 0.1}s`;
            this.observer.observe(card);
        });

        // Observe project cards
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach((card, index) => {
            card.style.transitionDelay = `${index * 0.15}s`;
            this.observer.observe(card);
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve after animation to improve performance
                this.observer.unobserve(entry.target);
            }
        });
    }
}

// === Navigation Background on Scroll ===
function initNavScroll() {
    const nav = document.getElementById('main-nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            nav.style.background = 'rgba(0, 0, 0, 0.95)';
            nav.style.boxShadow = '0 4px 20px rgba(0, 255, 65, 0.1)';
        } else {
            nav.style.background = 'rgba(0, 0, 0, 0.9)';
            nav.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    });
}

// === Interactive Skill Cards ===
function initSkillCards() {
    const skillCards = document.querySelectorAll('.skill-card');

    skillCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const icon = card.querySelector('.skill-icon');
            icon.style.transform = 'scale(1.2) rotate(5deg)';
            icon.style.transition = 'transform 0.3s ease';
        });

        card.addEventListener('mouseleave', () => {
            const icon = card.querySelector('.skill-icon');
            icon.style.transform = 'scale(1) rotate(0deg)';
        });
    });
}

// === Project Card Interactions ===
function initProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = 'var(--accent-cyan)';
            card.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.borderColor = 'rgba(0, 255, 65, 0.2)';
            card.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5)';
        });
    });
}

// === Contact Card Pulse Effect ===
function initContactCards() {
    const contactCards = document.querySelectorAll('.contact-card');

    contactCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const icon = card.querySelector('.contact-icon');
            icon.style.transform = 'scale(1.2)';
            icon.style.transition = 'transform 0.3s ease';
        });

        card.addEventListener('mouseleave', () => {
            const icon = card.querySelector('.contact-icon');
            icon.style.transform = 'scale(1)';
        });
    });
}

// === Hide Scroll Indicator on Scroll ===
function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 200) {
            scrollIndicator.style.opacity = '0';
            scrollIndicator.style.pointerEvents = 'none';
        } else {
            scrollIndicator.style.opacity = '1';
            scrollIndicator.style.pointerEvents = 'auto';
        }
    });
}

// === Initialize Everything ===
document.addEventListener('DOMContentLoaded', () => {
    // Start Matrix rain
    new MatrixRain();

    // Typing effect for hero
    const typingElement = document.getElementById('typing-text');
    if (typingElement) {
        new TypingEffect(typingElement, 'Data Scientist', 120);
    }

    // Initialize smooth scrolling
    initSmoothScroll();

    // Initialize scroll animations
    new ScrollAnimations();

    // Initialize navigation scroll effect
    initNavScroll();

    // Initialize interactive elements
    initSkillCards();
    initProjectCards();
    initContactCards();
    initScrollIndicator();

    // Add initial fade-in to hero
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.opacity = '0';
        setTimeout(() => {
            hero.style.transition = 'opacity 1s ease';
            hero.style.opacity = '1';
        }, 100);
    }
});

// === Performance: Debounce resize events ===
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// === Easter Egg: Konami Code ===
(function () {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                activateMatrixMode();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    function activateMatrixMode() {
        document.body.style.animation = 'matrixPulse 2s ease';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 2000);
    }
})();
