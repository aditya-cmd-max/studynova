// Enhanced Upload System with PDF preview and validation
document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseFiles = document.getElementById('browseFiles');
    const fileInfo = document.getElementById('fileInfo');
    const uploadForm = document.querySelector('.upload-form');
    const uploadButton = document.getElementById('uploadButton');
    const previewContainer = document.getElementById('previewContainer');
    const pdfPreview = document.getElementById('pdfPreview');
    const imagePreview = document.getElementById('imagePreview');
    const removePreviewBtn = document.getElementById('removePreview');
    
    let selectedFile = null;
    let pdfjsLib = null;

    // Load PDF.js library dynamically
    const pdfjsScript = document.createElement('script');
    pdfjsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js';
    pdfjsScript.onload = () => {
        pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
    };
    document.head.appendChild(pdfjsScript);

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

    // Handle selected file
    function handleFiles(files) {
        if (files.length === 0) return;
        
        // Only allow single file upload for this version
        const file = files[0];
        
        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            showError('Only PDF and image files are allowed');
            return;
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showError('File size must be less than 10MB');
            return;
        }
        
        selectedFile = file;
        updateFileInfo();
        showPreview(file);
    }

    function updateFileInfo() {
        if (!selectedFile) {
            fileInfo.innerHTML = 'No file selected';
            return;
        }
        
        fileInfo.innerHTML = `
            <div class="file-item">
                <span>${selectedFile.name} (${formatFileSize(selectedFile.size)})</span>
                <button class="remove-file" id="removeFileBtn">&times;</button>
            </div>
        `;
        
        document.getElementById('removeFileBtn').addEventListener('click', () => {
            selectedFile = null;
            updateFileInfo();
            hidePreview();
        });
    }

    function showPreview(file) {
        previewContainer.style.display = 'block';
        
        if (file.type === 'application/pdf') {
            // Show PDF preview
            pdfPreview.style.display = 'block';
            imagePreview.style.display = 'none';
            
            // Render first page of PDF
            const fileReader = new FileReader();
            fileReader.onload = function() {
                const typedarray = new Uint8Array(this.result);
                
                pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
                    pdf.getPage(1).then(function(page) {
                        const viewport = page.getViewport({ scale: 1.0 });
                        const canvas = document.getElementById('pdfCanvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        
                        page.render({
                            canvasContext: context,
                            viewport: viewport
                        });
                    });
                });
            };
            fileReader.readAsArrayBuffer(file);
        } else {
            // Show image preview
            pdfPreview.style.display = 'none';
            imagePreview.style.display = 'block';
            
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function hidePreview() {
        previewContainer.style.display = 'none';
    }

    removePreviewBtn.addEventListener('click', hidePreview);

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!selectedFile) {
            showError('Please select a file to upload');
            return;
        }
        
        const title = document.getElementById('noteTitle').value;
        const subject = document.getElementById('noteSubject').value;
        const description = document.getElementById('noteDescription').value;
        const tags = document.getElementById('noteTags').value.split(',').map(tag => tag.trim());
        const course = document.getElementById('noteCourse').value;
        const isPublic = document.getElementById('isPublic').checked;
        
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
        
        try {
            // Upload file to storage
            const filePath = `notes/${user.uid}/${Date.now()}_${selectedFile.name}`;
            const fileRef = storage.ref(filePath);
            const uploadTask = fileRef.put(selectedFile);
            
            // Show upload progress
            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    uploadButton.textContent = `Uploading ${Math.round(progress)}%`;
                },
                (error) => {
                    throw error;
                }
            );
            
            // Wait for upload to complete
            await uploadTask;
            
            // Get download URL
            const downloadURL = await fileRef.getDownloadURL();
            
            // Create note document in Firestore
            await db.collection('notes').add({
                title,
                subject,
                description,
                tags,
                course,
                isPublic,
                filePath,
                downloadURL,
                fileName: selectedFile.name,
                fileType: selectedFile.type,
                fileSize: selectedFile.size,
                uploadedBy: user.uid,
                uploaderName: user.displayName || user.email,
                uploaderPhotoURL: user.photoURL || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                downloadCount: 0,
                viewCount: 0,
                rating: 0,
                ratingCount: 0
            });
            
            showSuccess('Notes uploaded successfully!');
            uploadForm.reset();
            selectedFile = null;
            updateFileInfo();
            hidePreview();
            
            // Redirect to notes page or user's dashboard
            window.location.href = 'dashboard.html';
        } catch (error) {
            showError('Error uploading notes: ' + error.message);
        } finally {
            uploadButton.disabled = false;
            uploadButton.textContent = 'Upload Notes';
        }
    });
});
