// Authentication System
document.addEventListener('DOMContentLoaded', function() {
    // Auth Modal Elements
    const authModal = document.getElementById('authModal');
    const signInButton = document.getElementById('signInButton');
    const signUpButton = document.getElementById('signUpButton');
    const closeModal = document.querySelector('.close-modal');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const googleBtn = document.querySelector('.google-btn');
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    const signOutButton = document.getElementById('signOutButton');
    const profileDropdown = document.getElementById('profile-dropdown');
    const authButtons = document.getElementById('auth-buttons');

    // Open modal for sign in
    signInButton.addEventListener('click', () => {
        authModal.style.display = 'block';
        switchTab('signin');
    });

    // Open modal for sign up
    signUpButton.addEventListener('click', () => {
        authModal.style.display = 'block';
        switchTab('signup');
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        authModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
    });

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            if (tabId !== 'google') {
                switchTab(tabId);
            }
        });
    });

    function switchTab(tabId) {
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            }
        });

        tabContents.forEach(content => {
            content.style.display = 'none';
            if (content.id === tabId) {
                content.style.display = 'block';
            }
        });
    }

    // Google Sign In
    googleBtn.addEventListener('click', signInWithGoogle);

    // Email Sign In
    signInForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signInEmail').value;
        const password = document.getElementById('signInPassword').value;
        
        signInWithEmail(email, password);
    });

    // Email Sign Up
    signUpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signUpName').value;
        const email = document.getElementById('signUpEmail').value;
        const password = document.getElementById('signUpPassword').value;
        const confirmPassword = document.getElementById('signUpConfirmPassword').value;
        const userType = document.getElementById('userType').value;
        
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        signUpWithEmail(name, email, password, userType);
    });

    // Sign Out
    signOutButton.addEventListener('click', signOut);

    // Check auth state on load
    checkAuthState();

    // Auth state observer
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            authButtons.style.display = 'none';
            profileDropdown.style.display = 'flex';
            
            // Set profile picture initial
            const profilePic = profileDropdown.querySelector('.profile-pic');
            const displayName = user.displayName || user.email.split('@')[0];
            profilePic.textContent = displayName.charAt(0).toUpperCase();
            
            // Store user data in Firestore if new user
            if (user.metadata.creationTime === user.metadata.lastSignInTime) {
                storeUserData(user.uid, {
                    name: user.displayName || displayName,
                    email: user.email,
                    userType: 'student', // Default, can be updated in profile
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // Update last login time
                updateUserData(user.uid, {
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            // Close auth modal if open
            authModal.style.display = 'none';
        } else {
            // User is signed out
            authButtons.style.display = 'flex';
            profileDropdown.style.display = 'none';
        }
    });
});

// Auth Functions
function checkAuthState() {
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            document.getElementById('auth-buttons').style.display = 'none';
            document.getElementById('profile-dropdown').style.display = 'flex';
        } else {
            // User is signed out
            document.getElementById('auth-buttons').style.display = 'flex';
            document.getElementById('profile-dropdown').style.display = 'none';
        }
    });
}

function signInWithEmail(email, password) {
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in successfully
            showSuccess('Signed in successfully');
        })
        .catch((error) => {
            showError(error.message);
        });
}

function signUpWithEmail(name, email, password, userType) {
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Update user profile with display name
            return userCredential.user.updateProfile({
                displayName: name
            });
        })
        .then(() => {
            showSuccess('Account created successfully!');
            // Additional user data will be stored by the auth state observer
        })
        .catch((error) => {
            showError(error.message);
        });
}

function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            // Google sign in successful
            showSuccess('Signed in with Google');
        })
        .catch((error) => {
            showError(error.message);
        });
}

function signOut() {
    auth.signOut()
        .then(() => {
            showSuccess('Signed out successfully');
        })
        .catch((error) => {
            showError(error.message);
        });
}

function storeUserData(userId, data) {
    db.collection('users').doc(userId).set(data)
        .then(() => {
            console.log('User data stored successfully');
        })
        .catch((error) => {
            console.error('Error storing user data:', error);
        });
}

function updateUserData(userId, data) {
    db.collection('users').doc(userId).update(data)
        .then(() => {
            console.log('User data updated successfully');
        })
        .catch((error) => {
            console.error('Error updating user data:', error);
        });
}

// Notification functions
function showSuccess(message) {
    // Implement a nice notification system
    console.log('Success:', message);
    alert(message); // Replace with a proper notification system
}

function showError(message) {
    console.error('Error:', message);
    alert(message); // Replace with a proper notification system
}
