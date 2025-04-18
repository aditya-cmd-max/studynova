// Initialize Upload Page
function initUpload() {
    // Check auth state
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
        } else {
            // Load user data
            loadUserData(user.uid);
            
            // Initialize file upload
            initFileUpload();
            
            // Setup form navigation
            setupFormNavigation();
        }
    });
    
    // Setup event listeners
    setupEventListeners();
}

// Load user data
function loadUserData(userId) {
    db.collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                
                //Update UI with user data
document.getElementById('dropdown-username').textContent = userData.name;
document.getElementById('dropdown-useremail').textContent = userData.email;
                            // Update avatar if available
            if (userData.avatar) {
                document.getElementById('user-avatar').src = userData.avatar;
                document.querySelector('.dropdown-avatar').src = userData.avatar;
            }
        }
    })
    .catch((error) => {
        console.error("Error loading user data:", error);
    })
        ;}

// Initialize file upload
function initFileUpload() {
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const browseBtn = document.querySelector('.browse-btn');
const uploadProgress = document.getElementById('upload-progress');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const uploadPreview = document.getElementById('upload-preview');
const previewFilename = document.getElementById('preview-filename');
const previewFilesize = document.getElementById('preview-filesize');
const removeFileBtn = document.getElementById('remove-file');
const step1NextBtn = document.getElementById('step1-next');
    }

let selectedFile = null;

// Browse files button
browseBtn.addEventListener('click', () => {
    fileInput.click();
});

// File input change
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
    }
});

// Drag and drop events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    uploadArea.classList.add('drag-over');
}

function unhighlight() {
    uploadArea.classList.remove('drag-over');
}

// Handle drop
uploadArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    handleFileSelection(file);
});

// Handle file selection
function handleFileSelection(file) {
    // Validate file
    const validTypes = ['application/pdf', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'application/vnd.ms-powerpoint',
                       'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                       'image/jpeg', 'image/png'];
    
    if (!validTypes.includes(file.type)) {
        alert('Please select a valid file type (PDF, DOC, PPT, JPG, PNG)');
        return;
    }
    
    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
        alert('File size too large. Maximum allowed is 20MB.');
        return;
    }
    
    selectedFile = file;
    
    // Show preview
    previewFilename.textContent = file.name;
    previewFilesize.textContent = formatFileSize(file.size);
    uploadPreview.style.display = 'block';
    
    // Enable next button
    step1NextBtn.disabled = false;
}

// Remove file
removeFileBtn.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    uploadPreview.style.display = 'none';
    step1NextBtn.disabled = true;
});

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }


// Setup form navigation
function setupFormNavigation() {
const steps = document.querySelectorAll('.form-step');
const stepButtons = document.querySelectorAll('.step');
const prevButtons = document.querySelectorAll('.btn-prev');
const nextButtons = document.querySelectorAll('.btn-next');
    let currentStep = 0;

// Show current step
function showStep(stepIndex) {
    steps.forEach((step, index) => {
        step.classList.toggle('active', index === stepIndex);
    });
    
    stepButtons.forEach((step, index) => {
        step.classList.toggle('active', index <= stepIndex);
    });
    
    currentStep = stepIndex;
}

// Next button click
nextButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Validate current step before proceeding
        if (currentStep === 1 && !validateStep2()) {
            return;
        }
        
        if (currentStep === steps.length - 1) {
            // Submit form if on last step
            submitForm();
        } else {
            showStep(currentStep + 1);
        }
    });
});

// Previous button click
prevButtons.forEach(button => {
    button.addEventListener('click', () => {
        showStep(currentStep - 1);
    });
});

// Validate step 2 (details)
function validateStep2() {
    const title = document.getElementById('note-title').value.trim();
    const subject = document.getElementById('note-subject').value;
    const description = document.getElementById('note-description').value.trim();
    
    if (!title) {
        alert('Please enter a title for your notes');
        return false;
    }
    
    if (!subject) {
        alert('Please select a subject');
        return false;
    }
    
    if (!description) {
        alert('Please provide a description');
        return false;
    }
    
    return true;
}

// Submit form
function submitForm() {
    const fileInput = document.getElementById('file-input');
    const title = document.getElementById('note-title').value.trim();
    const subject = document.getElementById('note-subject').value;
    const course = document.getElementById('note-course').value.trim();
    const tags = document.getElementById('note-tags').value.trim();
    const description = document.getElementById('note-description').value.trim();
    const visibility = document.getElementById('note-visibility').value;
    
    if (!fileInput.files.length) {
        alert('Please select a file to upload');
        showStep(0);
        return;
    }
    
    const file = fileInput.files[0];
    const userId = auth.currentUser.uid;
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    
    // Show uploading progress
    document.getElementById('upload-progress').style.display = 'block';
    const progressBar = document.getElementById('progress-bar').querySelector('::after');
    const progressText = document.getElementById('progress-text');
    
    // Upload file to Firebase Storage
    const storageRef = storage.ref(`notes/${userId}/${Date.now()}_${file.name}`);
    const uploadTask = storageRef.put(file);
    
    uploadTask.on('state_changed',
        (snapshot) => {
            // Progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            document.getElementById('progress-bar').style.width = `${progress}%`;
            progressText.textContent = `Uploading: ${Math.round(progress)}%`;
        },
        (error) => {
            // Error
            console.error("Upload error:", error);
            alert("Error uploading file. Please try again.");
            showStep(0);
        },
        () => {
            // Complete
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                // Save note data to Firestore
                const noteData = {
                    title,
                    subject,
                    description,
                    fileUrl: downloadURL,
                    fileType: file.type,
                    fileSize: file.size,
                    fileName: file.name,
                    userId,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    downloadCount: 0,
                    viewCount: 0,
                    visibility,
                    course: course || null,
                    tags: tags ? tags.split(',').map(tag => tag.trim()) : []
                };
                
                db.collection('notes').add(noteData)
                    .then((docRef) => {
                        console.log("Document written with ID: ", docRef.id);
                        showStep(2); // Show completion step
                    })
                    .catch((error) => {
                        console.error("Error adding document: ", error);
                        alert("Error saving note details. Please try again.");
                        showStep(1);
                    });
            });
        }
    );
}

    // Setup event listeners
function setupEventListeners() {
// User dropdown toggle
const userAvatar = document.getElementById('user-avatar');
const userDropdown = document.getElementById('user-dropdown');
    userAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', () => {
    userDropdown.classList.remove('active');
});

// Prevent dropdown from closing when clicking inside it
userDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Sign out button
document.getElementById('signout-btn').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
});
    }

// Initialize upload page when DOM is loaded
document.addEventListener('DOMContentLoaded', initUpload);


   
