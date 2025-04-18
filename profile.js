// Profile System
document.addEventListener('DOMContentLoaded', function() {
    // Check auth state
    checkAuthState();
    
    // Load user data
    loadUserProfile();
    
    // Setup tab switching
    setupProfileTabs();
    
    // Setup profile picture upload
    setupProfilePictureUpload();
    
    // Setup form submissions
    setupProfileForms();
});

function loadUserProfile() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Set basic user info
    document.getElementById('profileUserName').textContent = user.displayName || 'User';
    document.getElementById('profileUserEmail').textContent = user.email;
    document.getElementById('securityEmail').textContent = user.email;
    
    // Set profile picture
    const profileImage = document.getElementById('profileLargeImage');
    if (user.photoURL) {
        profileImage.src = user.photoURL;
    } else {
        profileImage.style.display = 'none';
        const profilePic = document.getElementById('profilePicLarge');
        profilePic.textContent = user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
    }
    
    // Set join date
    const joinDate = user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date();
    document.getElementById('profileJoinDate').textContent = `Joined ${joinDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
    
    // Get additional user data from Firestore
    db.collection('users').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Set user type
                document.getElementById('profileUserType').textContent = userData.userType === 'tutor' ? 'Tutor' : 'Student';
                document.getElementById('userTypeSelect').value = userData.userType || 'student';
                
                // Set form values
                if (userData.displayName) {
                    document.getElementById('displayName').value = userData.displayName;
                } else if (user.displayName) {
                    document.getElementById('displayName').value = user.displayName;
                }
                
                document.getElementById('userBio').value = userData.bio || '';
                document.getElementById('userEducation').value = userData.education || '';
                document.getElementById('userInstitution').value = userData.institution || '';
                
                // Set preferences
                if (userData.preferences) {
                    document.getElementById('darkModePref').checked = userData.preferences.darkMode !== false;
                    document.getElementById('languagePref').value = userData.preferences.language || 'en';
                    document.getElementById('fontSizePref').value = userData.preferences.fontSize || 'medium';
                }
                
                // Set notification preferences
                if (userData.notifications) {
                    document.getElementById('emailNotifications').checked = userData.notifications.email !== false;
                    document.getElementById('downloadNotifications').checked = userData.notifications.downloads !== false;
                    document.getElementById('ratingNotifications').checked = userData.notifications.ratings !== false;
                    document.getElementById('newsletterNotifications').checked = userData.notifications.newsletter !== false;
                }
                
                // Check Google account connection
                if (userData.providerData && userData.providerData.some(provider => provider.providerId === 'google.com')) {
                    document.getElementById('googleAccountStatus').textContent = 'Connected';
                    document.getElementById('connectGoogleBtn').textContent = 'Disconnect';
                }
            }
        })
        .catch(error => {
            console.error('Error getting user profile data:', error);
        });
}

function setupProfileTabs() {
    const tabLinks = document.querySelectorAll('.profile-nav a');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active tab
            tabLinks.forEach(tab => tab.classList.remove('active'));
            link.classList.add('active');
            
            // Show corresponding content
            const tabId = link.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
}

function setupProfilePictureUpload() {
    const editBtn = document.getElementById('editProfilePicBtn');
    const fileInput = document.getElementById('profilePicInput');
    
    editBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file
        if (!file.type.match('image.*')) {
            showError('Please select an image file');
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) {
            showError('Image must be less than 2MB');
            return;
        }
        
        // Show loading state
        editBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Upload to Firebase Storage
        const user = auth.currentUser;
        const storageRef = storage.ref(`profile_pictures/${user.uid}/${file.name}`);
        const uploadTask = storageRef.put(file);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                // Progress monitoring can be added here
            },
            (error) => {
                showError('Error uploading profile picture: ' + error.message);
                editBtn.innerHTML = '<i class="fas fa-camera"></i>';
            },
            () => {
                // Upload complete
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    // Update user profile
                    return user.updateProfile({
                        photoURL: downloadURL
                    });
                })
                .then(() => {
                    // Update Firestore
                    return db.collection('users').doc(user.uid).update({
                        photoURL: downloadURL
                    });
                })
                .then(() => {
                    // Update UI
                    const profileImage = document.getElementById('profileLargeImage');
                    profileImage.src = downloadURL;
                    profileImage.style.display = 'block';
                    
                    // Update nav profile pic
                    const navProfilePic = document.querySelector('.profile-pic');
                    if (navProfilePic) {
                        navProfilePic.innerHTML = `<img src="${downloadURL}" alt="Profile Picture">`;
                    }
                    
                    editBtn.innerHTML = '<i class="fas fa-camera"></i>';
                    showSuccess('Profile picture updated successfully!');
                })
                .catch((error) => {
                    showError('Error updating profile: ' + error.message);
                    editBtn.innerHTML = '<i class="fas fa-camera"></i>';
                });
            }
        );
    });
}

function setupProfileForms() {
    // Personal Info Form
    document.getElementById('personalInfoForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const user = auth.currentUser;
        if (!user) return;
        
        const displayName = document.getElementById('displayName').value;
        const bio = document.getElementById('userBio').value;
        const userType = document.getElementById('userTypeSelect').value;
        const education = document.getElementById('userEducation').value;
        const institution = document.getElementById('userInstitution').value;
        
        const updates = {
            displayName,
            bio,
            userType,
            education,
            institution,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Update Firestore
        db.collection('users').doc(user.uid).update(updates)
            .then(() => {
                // Update auth profile if display name changed
                if (displayName !== user.displayName) {
                    return user.updateProfile({
                        displayName: displayName
                    });
                }
            })
            .then(() => {
                showSuccess('Profile updated successfully!');
                
                // Update UI
                document.getElementById('profileUserName').textContent = displayName || 'User';
                document.getElementById('profileUserType').textContent = userType === 'tutor' ? 'Tutor' : 'Student';
                
                // Update nav user name if exists
                const navUserName = document.querySelector('.profile-pic + h3');
                if (navUserName) {
                    navUserName.textContent = displayName || 'User';
                }
            })
            .catch(error => {
                showError('Error updating profile: ' + error.message);
            });
    });
    
    // Security Form
    document.getElementById('securityForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const user = auth.currentUser;
        if (!user) return;
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
        if (!currentPassword) {
            showError('Please enter your current password');
            return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showError('New passwords do not match');
        return;
    }
    
    if (newPassword.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    // Reauthenticate user
    const credential = firebase.auth.EmailAuthProvider.credential(
        user.email,
        currentPassword
    );
    
    user.reauthenticateWithCredential(credential)
        .then(() => {
            // Update password
            return user.updatePassword(newPassword);
        })
        .then(() => {
            showSuccess('Password updated successfully!');
            document.getElementById('securityForm').reset();
        })
        .catch(error => {
            showError('Error updating password: ' + error.message);
        });
});

// Connect Google Account
document.getElementById('connectGoogleBtn').addEventListener('click', (e) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) return;
    
    const btn = e.target;
    const isConnected = btn.textContent === 'Disconnect';
    
    if (isConnected) {
        // Disconnect Google
        // Note: This is complex as you need to ensure user has another auth provider
        showError('Please add email/password authentication before disconnecting Google');
    } else {
        // Connect Google
        const provider = new firebase.auth.GoogleAuthProvider();
        user.linkWithPopup(provider)
            .then((result) => {
                // Update UI
                document.getElementById('googleAccountStatus').textContent = 'Connected';
                btn.textContent = 'Disconnect';
                showSuccess('Google account connected successfully!');
                
                // Update user data in Firestore
                return db.collection('users').doc(user.uid).update({
                    providerData: result.user.providerData.map(p => ({
                        providerId: p.providerId,
                        uid: p.uid,
                        displayName: p.displayName,
                        email: p.email,
                        photoURL: p.photoURL
                    }))
                });
            })
            .catch(error => {
                showError('Error connecting Google account: ' + error.message);
            });
    }
});

// Preferences Form
document.getElementById('preferencesForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) return;
    
    const darkMode = document.getElementById('darkModePref').checked;
    const language = document.getElementById('languagePref').value;
    const fontSize = document.getElementById('fontSizePref').value;
    
    db.collection('users').doc(user.uid).update({
        preferences: {
            darkMode,
            language,
            fontSize,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }
    })
    .then(() => {
        showSuccess('Preferences saved!');
        
        // Apply dark mode immediately
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        
        // Apply font size
        document.body.style.fontSize = fontSize === 'small' ? '14px' : 
                                     fontSize === 'large' ? '18px' : '16px';
    })
    .catch(error => {
        showError('Error saving preferences: ' + error.message);
    });
});

// Notifications Form
document.getElementById('notificationsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) return;
    
    const emailNotifications = document.getElementById('emailNotifications').checked;
    const downloadNotifications = document.getElementById('downloadNotifications').checked;
    const ratingNotifications = document.getElementById('ratingNotifications').checked;
    const newsletterNotifications = document.getElementById('newsletterNotifications').checked;
    
    db.collection('users').doc(user.uid).update({
        notifications: {
            email: emailNotifications,
            downloads: downloadNotifications,
            ratings: ratingNotifications,
            newsletter: newsletterNotifications,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }
    })
    .then(() => {
        showSuccess('Notification settings saved!');
    })
    .catch(error => {
        showError('Error saving notification settings: ' + error.message);
    });
});
