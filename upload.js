// Upload System
document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseFiles = document.getElementById('browseFiles');
    const fileInfo = document.getElementById('fileInfo');
    const uploadForm = document.querySelector('.upload-form');
    const uploadButton = document.getElementById('uploadButton');
    
    let selectedFiles = [];
    
    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // Browse files
    browseFiles.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });
    
    // Handle selected files
    function handleFiles(files) {
        selectedFiles = [...files];
        updateFileInfo();
    }
    
    function updateFileInfo() {
        if (selectedFiles.length === 0) {
            fileInfo.innerHTML = 'No files selected';
            return;
        }
        
        fileInfo.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileElement = document.createElement('div');
            fileElement.className = 'file-item';
            fileElement.innerHTML = `
                <span>${file.name} (${formatFileSize(file.size)})</span>
                <button class="remove-file" data-index="${index}">&times;</button>
            `;
            fileInfo.appendChild(fileElement);
            
            fileElement.querySelector('.remove-file').addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                selectedFiles.splice(index, 1);
                updateFileInfo();
            });
        });
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Form submission
    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (selectedFiles.length === 0) {
            showError('Please select at least one file to upload');
            return;
        }
        
        const title = document.getElementById('noteTitle').value;
        const subject = document.getElementById('noteSubject').value;
        const description = document.getElementById('noteDescription').value;
        const tags = document.getElementById('noteTags').value.split(',').map(tag => tag.trim());
        
        if (!title) {
            showError('Please enter a title for your notes');
            return;
        }
        
        uploadButton.disabled = true;
        uploadButton.textContent = 'Uploading...';
        
        // Get current user
        const user = auth.currentUser;
        if (!user) {
            showError('You need to be signed in to upload notes');
            uploadButton.disabled = false;
            uploadButton.textContent = 'Upload Notes';
            return;
        }
        
        // Upload each file
        const uploadPromises = selectedFiles.map(file => {
            const filePath = `notes/${user.uid}/${Date.now()}_${file.name}`;
            const fileRef = storage.ref(filePath);
            
            return fileRef.put(file).then(snapshot => {
                // For each file, create a note document
                return db.collection('notes').add({
                    title,
                    subject,
                    description,
                    tags,
                    filePath,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    uploadedBy: user.uid,
                    uploaderName: user.displayName || user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    downloadCount: 0,
                    viewCount: 0
                });
            });
        });
        
        Promise.all(uploadPromises)
            .then(() => {
                showSuccess('Notes uploaded successfully!');
                uploadForm.reset();
                selectedFiles = [];
                updateFileInfo();
                loadNotes(); // Refresh the notes list
            })
            .catch(error => {
                showError('Error uploading notes: ' + error.message);
            })
            .finally(() => {
                uploadButton.disabled = false;
                uploadButton.textContent = 'Upload Notes';
            });
    });
});
