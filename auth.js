// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const googleSignInBtn = document.getElementById('google-signin');
const tabBtns = document.querySelectorAll('.tab-btn');
const authForms = document.querySelectorAll('.auth-form');

// Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        
        // Update active tab button
        tabBtns.forEach(tb => tb.classList.remove('active'));
        btn.classList.add('active');
        
        // Show corresponding form
        authForms.forEach(form => {
            form.classList.remove('active');
            if (form.id === `${tabId}-form`) {
                form.classList.add('active');
            }
        });
    });
});

// Login with Email/Password
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            showAuthError(errorMessage);
        });
});

// Register with Email/Password
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    const role = document.getElementById('register-role').value;
    
    if (password !== confirmPassword) {
        showAuthError("Passwords don't match");
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed up
            const user = userCredential.user;
            
            // Save additional user data to Firestore
            return db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6c5ce7&color=fff`
            });
        })
        .then(() => {
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            showAuthError(errorMessage);
        });
});

// Google Sign-In
googleSignInBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
        .then((result) => {
            // This gives you a Google Access Token
            const credential = result.credential;
            const token = credential.accessToken;
            const user = result.user;
            
            // Check if user exists in Firestore
            const userRef = db.collection('users').doc(user.uid);
            
            userRef.get().then((doc) => {
                if (!doc.exists) {
                    // Create new user document
                    return userRef.set({
                        name: user.displayName,
                        email: user.email,
                        role: 'student', // Default role
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        avatar: user.photoURL
                    });
                }
            }).then(() => {
                window.location.href = 'dashboard.html';
            });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            showAuthError(errorMessage);
        });
});

// Show error message
function showAuthError(message) {
    // Remove any existing error messages
    const existingError = document.querySelector('.auth-error');
    if (existingError) {
        existingError.remove();
    }
    
    const errorElement = document.createElement('div');
    errorElement.className = 'auth-error';
    errorElement.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Insert error message
    const activeForm = document.querySelector('.auth-form.active');
    activeForm.insertBefore(errorElement, activeForm.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        errorElement.classList.add('fade-out');
        setTimeout(() => {
            errorElement.remove();
        }, 300);
    }, 5000);
}

// Check auth state
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        window.location.href = 'dashboard.html';
    }
});
