// animations.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS (Animate On Scroll)
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });
    
    // GSAP Animations
    gsap.registerPlugin(ScrollTrigger);
    
    // Hero section animation
    gsap.from('.hero-title', {
        duration: 1,
        y: 50,
        opacity: 0,
        ease: 'power3.out'
    });
    
    gsap.from('.hero-subtitle', {
        duration: 1,
        y: 50,
        opacity: 0,
        ease: 'power3.out',
        delay: 0.2
    });
    
    gsap.from('.hero-buttons', {
        duration: 1,
        y: 50,
        opacity: 0,
        ease: 'power3.out',
        delay: 0.4
    });
    
    // Section animations
    gsap.utils.toArray('section').forEach(section => {
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        });
    });
    
    // Note card animations
    gsap.utils.toArray('.note-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            y: 50,
            opacity: 0,
            duration: 0.5,
            delay: i * 0.1,
            ease: 'power3.out'
        });
    });
    
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Anime.js animation for menu items
        if (navMenu.classList.contains('active')) {
            anime({
                targets: '.nav-item',
                translateY: [-20, 0],
                opacity: [0, 1],
                duration: 800,
                delay: anime.stagger(100),
                easing: 'easeOutExpo'
            });
        }
    });
    
    // Theme switcher
    const themeSwitch = document.getElementById('checkbox');
    themeSwitch.addEventListener('change', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Save preference to localStorage
        localStorage.setItem('theme', newTheme);
        
        // Animation for theme switch
        anime({
            targets: 'body',
            backgroundColor: newTheme === 'dark' ? '#1e272e' : '#f5f6fa',
            color: newTheme === 'dark' ? '#f5f6fa' : '#2d3436',
            duration: 500,
            easing: 'easeInOutQuad'
        });
    });
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeSwitch.checked = savedTheme === 'light';
    
    // Hover effects for cards
    const cards = document.querySelectorAll('.note-card, .feature-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            anime({
                targets: card,
                scale: 1.03,
                boxShadow: '0 15px 30px rgba(108, 92, 231, 0.3)',
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
        
        card.addEventListener('mouseleave', () => {
            anime({
                targets: card,
                scale: 1,
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
    });
    
    // Glow effect for buttons
    const glowButtons = document.querySelectorAll('.btn-glow');
    glowButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            anime({
                targets: button,
                boxShadow: [
                    { value: '0 0 0 0 rgba(108, 92, 231, 0.4)', duration: 0 },
                    { value: '0 0 0 10px rgba(108, 92, 231, 0)', duration: 1000 }
                ],
                easing: 'easeOutQuad'
            });
        });
    });
});
