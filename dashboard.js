// Initialize Dashboard
function initDashboard() {
    // Check auth state
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
        } else {
            // Load user data
            loadUserData(user.uid);
            
            // Load dashboard data
            loadDashboardData(user.uid);
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
                document.getElementById('username').textContent = userData.name.split(' ')[0];
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

// Load dashboard data
function loadDashboardData(userId) {
    // Load user's notes count
    db.collection('notes').where('userId', '==', userId).get()
        .then((querySnapshot) => {
            document.getElementById('notes-count').textContent = querySnapshot.size;
        });
    
    // Load user's courses count
    db.collection('user_courses').where('userId', '==', userId).get()
        .then((querySnapshot) => {
            document.getElementById('courses-count').textContent = querySnapshot.size;
        });
    
    // Load user's discussions count
    db.collection('discussions').where('userId', '==', userId).get()
        .then((querySnapshot) => {
            document.getElementById('discussions-count').textContent = querySnapshot.size;
        });
    
    // Load recent notes
    loadRecentNotes(userId);
    
    // Load popular courses
    loadPopularCourses();
    
    // Load recent discussions
    loadRecentDiscussions();
}

// Load recent notes
function loadRecentNotes(userId) {
    const recentNotesContainer = document.getElementById('recent-notes');
    
    db.collection('notes')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(3)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                return; // Keep the empty state
            }
            
            // Clear empty state
            recentNotesContainer.innerHTML = '';
            
            querySnapshot.forEach((doc) => {
                const note = doc.data();
                const noteItem = document.createElement('div');
                noteItem.className = 'note-item';
                noteItem.innerHTML = `
                    <div class="note-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="note-info">
                        <h3>${note.title}</h3>
                        <p>${note.subject} • ${formatDate(note.createdAt)}</p>
                    </div>
                `;
                
                noteItem.addEventListener('click', () => {
                    window.location.href = `notes.html?note=${doc.id}`;
                });
                
                recentNotesContainer.appendChild(noteItem);
            });
        })
        .catch((error) => {
            console.error("Error loading recent notes:", error);
        });
}

// Load popular courses
function loadPopularCourses() {
    const popularCoursesContainer = document.getElementById('popular-courses');
    
    db.collection('courses')
        .orderBy('enrollmentCount', 'desc')
        .limit(2)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                // Add some default courses if none exist
                popularCoursesContainer.innerHTML = `
                    <div class="course-card">
                        <div class="course-image" style="background-image: url('images/course-math.jpg')"></div>
                        <div class="course-info">
                            <h3>Advanced Mathematics</h3>
                            <p>Explore advanced mathematical concepts</p>
                            <div class="course-meta">
                                <span><i class="fas fa-book"></i> 12 Notes</span>
                                <span><i class="fas fa-star"></i> 4.8</span>
                            </div>
                        </div>
                    </div>
                    <div class="course-card">
                        <div class="course-image" style="background-image: url('images/course-physics.jpg')"></div>
                        <div class="course-info">
                            <h3>Modern Physics</h3>
                            <p>Understanding the universe</p>
                            <div class="course-meta">
                                <span><i class="fas fa-book"></i> 8 Notes</span>
                                <span><i class="fas fa-star"></i> 4.6</span>
                            </div>
                        </div>
                    </div>
                `;
                return;
            }
            
            // Clear container
            popularCoursesContainer.innerHTML = '';
            
            querySnapshot.forEach((doc) => {
                const course = doc.data();
                const courseCard = document.createElement('div');
                courseCard.className = 'course-card';
                courseCard.innerHTML = `
                    <div class="course-image" style="background-image: url('${course.image || 'images/course-default.jpg'}')"></div>
                    <div class="course-info">
                        <h3>${course.title}</h3>
                        <p>${course.description || 'No description available'}</p>
                        <div class="course-meta">
                            <span><i class="fas fa-book"></i> ${course.noteCount || 0} Notes</span>
                            <span><i class="fas fa-star"></i> ${course.rating || 0}</span>
                        </div>
                    </div>
                `;
                
                courseCard.addEventListener('click', () => {
                    window.location.href = `courses.html?course=${doc.id}`;
                });
                
                popularCoursesContainer.appendChild(courseCard);
            });
        })
        .catch((error) => {
            console.error("Error loading popular courses:", error);
        });
}

// Load recent discussions
function loadRecentDiscussions() {
    const recentDiscussionsContainer = document.getElementById('recent-discussions');
    
    db.collection('discussions')
        .orderBy('createdAt', 'desc')
        .limit(2)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                // Add some default discussions if none exist
                recentDiscussionsContainer.innerHTML = `
                    <div class="discussion-item">
                        <img src="images/default-avatar.jpg" alt="User Avatar" class="discussion-avatar">
                        <div class="discussion-content">
                            <h3>Question about Calculus</h3>
                            <p>Posted by <span>Jane Smith</span> in <span>Mathematics</span></p>
                            <div class="discussion-meta">
                                <span><i class="fas fa-comment"></i> 5 replies</span>
                                <span><i class="fas fa-clock"></i> 2 hours ago</span>
                            </div>
                        </div>
                    </div>
                    <div class="discussion-item">
                        <img src="images/default-avatar.jpg" alt="User Avatar" class="discussion-avatar">
                        <div class="discussion-content">
                            <h3>Help with Physics Problem</h3>
                            <p>Posted by <span>Mike Johnson</span> in <span>Physics</span></p>
                            <div class="discussion-meta">
                                <span><i class="fas fa-comment"></i> 3 replies</span>
                                <span><i class="fas fa-clock"></i> 5 hours ago</span>
                            </div>
                        </div>
                    </div>
                `;
                return;
            }
            
            // Clear container
            recentDiscussionsContainer.innerHTML = '';
            
            querySnapshot.forEach((doc) => {
                const discussion = doc.data();
                const discussionItem = document.createElement('div');
                discussionItem.className = 'discussion-item';
                discussionItem.innerHTML = `
                    <img src="${discussion.userAvatar || 'images/default-avatar.jpg'}" alt="User Avatar" class="discussion-avatar">
                    <div class="discussion-content">
                        <h3>${discussion.title}</h3>
                        <p>Posted by <span>${discussion.userName}</span> in <span>${discussion.category || 'General'}</span></p>
                        <div class="discussion-meta">
                            <span><i class="fas fa-comment"></i> ${discussion.replyCount || 0} replies</span>
                            <span><i class="fas fa-clock"></i> ${formatTimeAgo(discussion.createdAt)}</span>
                        </div>
                    </div>
                `;
                
                discussionItem.addEventListener('click', () => {
                    window.location.href = `discussions.html?topic=${doc.id}`;
                });
                
                recentDiscussionsContainer.appendChild(discussionItem);
            });
        })
        .catch((error) => {
            console.error("Error loading recent discussions:", error);
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

// Format time ago
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Unknown time';
    
    const date = timestamp.toDate();
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
    
    return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);
