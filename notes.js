// Notes System
document.addEventListener('DOMContentLoaded', function() {
    // Load notes when page loads
    loadNotes();
    
    // Search functionality
    const searchInput = document.querySelector('.search-filter input');
    const searchButton = document.querySelector('.search-filter button');
    
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchNotes(searchInput.value);
        }
    });
    
    searchButton.addEventListener('click', () => {
        searchNotes(searchInput.value);
    });
});

function loadNotes() {
    const notesContainer = document.getElementById('notesContainer');
    notesContainer.innerHTML = '<div class="loading">Loading notes...</div>';
    
    db.collection('notes').orderBy('createdAt', 'desc').limit(20).get()
        .then((querySnapshot) => {
            notesContainer.innerHTML = '';
            
            if (querySnapshot.empty) {
                notesContainer.innerHTML = '<div class="empty">No notes found. Be the first to upload!</div>';
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const note = doc.data();
                createNoteCard(note, doc.id);
            });
        })
        .catch((error) => {
            notesContainer.innerHTML = `<div class="error">Error loading notes: ${error.message}</div>`;
        });
}

function searchNotes(query) {
    const notesContainer = document.getElementById('notesContainer');
    notesContainer.innerHTML = '<div class="loading">Searching notes...</div>';
    
    // Simple search implementation - can be enhanced with Algolia or similar
    db.collection('notes').orderBy('title').startAt(query).endAt(query + '\uf8ff').get()
        .then((querySnapshot) => {
            notesContainer.innerHTML = '';
            
            if (querySnapshot.empty) {
                notesContainer.innerHTML = '<div class="empty">No notes match your search.</div>';
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const note = doc.data();
                createNoteCard(note, doc.id);
            });
        })
        .catch((error) => {
            notesContainer.innerHTML = `<div class="error">Error searching notes: ${error.message}</div>`;
        });
}

function createNoteCard(note, noteId) {
    const notesContainer = document.getElementById('notesContainer');
    
    const noteCard = document.createElement('div');
    noteCard.className = 'note-card';
    noteCard.setAttribute('data-aos', 'fade-up');
    
    // Format the date
    const date = note.createdAt ? note.createdAt.toDate() : new Date();
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    noteCard.innerHTML = `
        <div class="note-image">
            <i class="fas fa-file-${note.fileType === 'pdf' ? 'pdf' : 'image'}"></i>
        </div>
        <div class="note-content">
            <h3 class="note-title">${note.title}</h3>
            <span class="note-subject">${note.subject}</span>
            <p class="note-description">${note.description || 'No description provided.'}</p>
            <div class="note-footer">
                <span>${formattedDate}</span>
                <div class="note-actions">
                    <button class="view-btn" data-id="${noteId}">View</button>
                    <button class="download-btn" data-id="${noteId}">Download</button>
                </div>
            </div>
        </div>
    `;
    
    notesContainer.appendChild(noteCard);
    
    // Add event listeners to buttons
    noteCard.querySelector('.view-btn').addEventListener('click', (e) => {
        viewNote(e.target.getAttribute('data-id'));
    });
    
    noteCard.querySelector('.download-btn').addEventListener('click', (e) => {
        downloadNote(e.target.getAttribute('data-id'));
    });
}

function viewNote(noteId) {
    // Implement note viewing functionality
    console.log('Viewing note:', noteId);
    // This would typically open a modal or new page with the note content
    // For PDFs, you might use PDF.js or similar
    alert('Note viewing functionality would open here for note ID: ' + noteId);
}

function downloadNote(noteId) {
    db.collection('notes').doc(noteId).get()
        .then((doc) => {
            if (doc.exists) {
                const note = doc.data();
                // Get download URL from Firebase Storage
                storage.ref(note.filePath).getDownloadURL()
                    .then((url) => {
                        // Create a temporary anchor element to trigger download
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = note.fileName || 'studynova-note';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        showSuccess('Download started');
                    })
                    .catch((error) => {
                        showError('Error getting download URL: ' + error.message);
                    });
            } else {
                showError('Note not found');
            }
        })
        .catch((error) => {
            showError('Error downloading note: ' + error.message);
        });
}
