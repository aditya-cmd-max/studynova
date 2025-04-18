
## App JavaScript (app.js)

```javascript
// Common app functionality
function initApp() {
    // Check auth state for all pages except index.html
    if (!window.location.pathname.includes('index.html')) {
        auth.onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = 'index.html';
            }
        });
    }
    
    // Initialize tooltips
    initTooltips();
    
    // Initialize theme (dark mode by default)
    initTheme();
}

// Initialize tooltips
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        const tooltipText = element.getAttribute('data-tooltip');
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = tooltipText;
        document.body.appendChild(tooltip);
        
        element.addEventListener('mouseenter', (e) => {
            const rect = e.target.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
            tooltip.style.opacity = '1';
        });
        
        element.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });
    });
}

// Initialize theme
function initTheme() {
    // Set dark mode by default
    document.body.classList.add('dark-mode');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('studynova-theme');
    if (savedTheme) {
        document.body.classList.toggle('dark-mode', savedTheme === 'dark');
    }
    
    // Theme toggle button (if exists)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('studynova-theme', isDark ? 'dark' : 'light');
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
