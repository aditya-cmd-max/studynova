// app.js - Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Barba.js for page transitions
    barba.init({
        transitions: [{
            name: 'default',
            leave(data) {
                return gsap.to(data.current.container, {
                    opacity: 0,
                    y: 50,
                    duration: 0.5
                });
            },
            enter(data) {
                return gsap.from(data.next.container, {
                    opacity: 0,
                    y: 50,
                    duration: 0.5
                });
            }
        }],
        views: [{
            namespace: 'home',
            beforeEnter() {
                // Initialize home page specific elements
            }
        }, {
            namespace: 'notes',
            beforeEnter() {
                // Initialize notes page specific elements
                loadNotes();
            }
        }, {
            namespace: 'upload',
            beforeEnter() {
                // Initialize upload page specific elements
                if (!auth.currentUser) {
                    window.location.hash = '#home';
                    showError('You need to sign in to upload notes');
                }
            }
        }]
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                gsap.to(window, {
                    duration: 1,
                    scrollTo: {
                        y: targetElement,
                        offsetY: 80
                    },
                    ease: 'power3.out'
                });
            }
        });
    });
    
    // Initialize all modules
    initAuth();
    initNotes();
    initUpload();
    initAnimations();
    
    function initAuth() {
        // Auth system is initialized in auth.js
    }
    
    function initNotes() {
        // Notes system is initialized in notes.js
    }
    
    function initUpload() {
        // Upload system is initialized in upload.js
    }
    
    function initAnimations() {
        // Animations are initialized in animations.js
    }
});
