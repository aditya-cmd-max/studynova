
## Notes JavaScript (notes.js)

```javascript
// Initialize Notes Page
function initNotes() {
    // Check auth state
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
        } else {
            // Load user data
            loadUserData(user.uid);
            
            // Load notes
            loadNotes(user.uid);
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
                
                // Update UI with user data
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
        });
}

// Load notes
function loadNotes(userId, filters = {}) {
    const notesGrid = document.getElementById('notes-grid');
    
    // Show loading state
    notesGrid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading your notes...</p>
        </div>
    `;
    
    let query = db.collection('notes').where('userId', '==', userId);
    
    // Apply subject filter if set
    if (filters.subject && filters.subject !== 'all') {
        query = query.where('subject', '==', filters.subject);
    }
    
    // Apply sorting
    if (filters.sort === 'oldest') {
        query = query.orderBy('createdAt', 'asc');
    } else if (filters.sort === 'title-asc') {
        query = query.orderBy('title', 'asc');
    } else if (filters.sort === 'title-desc') {
        query = query.orderBy('title', 'desc');
    } else {
        // Default: newest first
        query = query.orderBy('createdAt', 'desc');
    }
    
    query.get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                notesGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <p>You haven't uploaded any notes yet</p>
                        <a href="upload.html" class="btn-primary">Upload Your First Notes</a>
                    </div>
                `;
                return;
            }
            
            // Clear grid
            notesGrid.innerHTML = '';
            
            querySnapshot.forEach((doc) => {
                const note = doc.data();
                const noteCard = document.createElement('div');
                noteCard.className = 'note-card';
                noteCard.innerHTML = `
                    <div class="note-header">
                        <div class="note-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div class="note-title">
                            <h3>${note.title}</h3>
                            <p>${note.subject} • ${formatDate(note.createdAt)}</p>
                        </div>
                    </div>
                    <div class="note-body">
                        <p class="note-description">${note.description || 'No description provided'}</p>
                        <div class="note-meta">
                            <span><i class="fas fa-file"></i> ${note.fileType || 'PDF'}</span>
                            <span><i class="fas fa-download"></i> ${note.downloadCount || 0}</span>
                        </div>
                    </div>
                    <div class="note-actions">
                        <button class="note-action-btn view-note" data-id="${doc.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="note-action-btn download-note" data-id="${doc.id}">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                `;
                
                notesGrid.appendChild(noteCard);
            });
            
            // Add event listeners to action buttons
            document.querySelectorAll('.view-note').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const noteId = e.currentTarget.getAttribute('data-id');
                    viewNote(noteId);
                });
            });
            
            document.querySelectorAll('.download-note').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const noteId = e.currentTarget.getAttribute('data-id');
                    downloadNote(noteId);
                });
            });
        })
        .catch((error) => {
            console.error("Error loading notes:", error);
            notesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading notes. Please try again.</p>
                </div>
            `;
        });
}

// View note
function viewNote(noteId) {
    window.location.href = `note-view.html?id=${noteId}`;
}

// Download note
function downloadNote(noteId) {
    // Get note data
    db.collection('notes').doc(noteId).get()
        .then((doc) => {
            if (doc.exists) {
                const note = doc.data();
                
                // Increment download count
                db.collection('notes').doc(noteId).update({
                    downloadCount: (note.downloadCount || 0) + 1
                });
                
                // Create download link
                const link = document.createElement('a');
                link.href = note.fileUrl;
                link.download = note.title || 'studynova-note';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        })
        .catch((error) => {
            console.error("Error downloading note:", error);
            alert("Error downloading note. Please try again.");
        });
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
    
    // Filter apply button
    document.querySelector('.apply-filter').addEventListener('click', () => {
        const subject = document.getElementById('subject-filter').value;
        const sort = document.getElementById('sort-filter').value;
        
        auth.onAuthStateChanged((user) => {
            if (user) {
                loadNotes(user.uid, { subject, sort });
            }
        });
    });
    
    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = e.target.value.trim().toLowerCase();
            
            if (searchTerm) {
                auth.onAuthStateChanged((user) => {
                    if (user) {
                        searchNotes(user.uid, searchTerm);
                    }
                });
            }
        }
    });
}

// Search notes
function searchNotes(userId, searchTerm) {
    const notesGrid = document.getElementById('notes-grid');
    
    // Show loading state
    notesGrid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Searching notes...</p>
        </div>
    `;
    
    db.collection('notes')
        .where('userId', '==', userId)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                notesGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <p>No notes found matching your search</p>
                    </div>
                `;
                return;
            }
            
            // Clear grid
            notesGrid.innerHTML = '';
            
            let foundResults = false;
            
            querySnapshot.forEach((doc) => {
                const note = doc.data();
                const searchContent = `${note.title} ${note.description} ${note.subject}`.toLowerCase();
                
                if (searchContent.includes(searchTerm)) {
                    foundResults = true;
                    
                    const noteCard = document.createElement('div');
                    noteCard.className = 'note-card';
                    noteCard.innerHTML = `
                        <div class="note-header">
                            <div class="note-icon">
                                <i class="fas fa-file-alt"></i>
                            </div>
                            <div class="note-title">
                                <h3>${note.title}</h3>
                                <p>${note.subject} • ${formatDate(note.createdAt)}</p>
                            </div>
                        </div>
                        <div class="note-body">
                            <p class="note-description">${note.description || 'No description provided'}</p>
                            <div class="note-meta">
                                <span><i class="fas fa-file"></i> ${note.fileType || 'PDF'}</span>
                                <span><i class="fas fa-download"></i> ${note.downloadCount || 0}</span>
                            </div>
                        </div>
                        <div class="note-actions">
                            <button class="note-action-btn view-note" data-id="${doc.id}">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="note-action-btn download-note" data-id="${doc.id}">
                                <i class="fas fa-download"></i> Download
                            </button>
                        </div>
                    `;
                    
                    notesGrid.appendChild(noteCard);
                }
            });
            
            if (!foundResults) {
                notesGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <p>No notes found matching your search</p>
                    </div>
                `;
            } else {
                // Add event listeners to action buttons
                document.querySelectorAll('.view-note').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const noteId = e.currentTarget.getAttribute('data-id');
                        viewNote(noteId);
                    });
                });
                
                document.querySelectorAll('.download-note').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const noteId = e.currentTarget.getAttribute('data-id');
                        downloadNote(noteId);
                    });
                });
            }
        })
        .catch((error) => {
            console.error("Error searching notes:", error);
            notesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error searching notes. Please try again.</p>
                </div>
            `;
        });
}

// Format date
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Initialize notes page when DOM is loaded
document.addEventListener('DOMContentLoaded', initNotes);
