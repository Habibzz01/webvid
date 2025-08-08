document.addEventListener('DOMContentLoaded', function() {
    // Tab switching (same as before)
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // File upload functionality - REVISED WITHOUT SIMULATION
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const progressContainer = document.querySelector('.progress-container');
    const progressBar = document.getElementById('upload-progress');
    const progressText = document.getElementById('progress-text');
    const uploadResult = document.getElementById('upload-result');
    const fileUrl = document.getElementById('file-url');
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    dropArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFiles);
    
    uploadBtn.addEventListener('click', () => {
        if (fileInput.files.length > 0) {
            handleFiles({ target: fileInput });
        } else {
            alert('Please select files first');
        }
    });
    
    // REAL UPLOAD FUNCTION WITH PROPER PROGRESS
    function uploadFiles(files) {
        progressContainer.classList.remove('hidden');
        uploadResult.classList.add('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('reqtype', 'fileupload');
            formData.append('userhash', ''); // Anonymous upload
            formData.append('fileToUpload', files[i]);
        }
        
        const xhr = new XMLHttpRequest();
        
        // REAL progress tracking
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = percentComplete + '%';
                progressText.textContent = percentComplete + '%';
            }
        }, false);
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    fileUrl.value = xhr.responseText.trim();
                    uploadResult.classList.remove('hidden');
                } else {
                    alert('Upload failed: ' + xhr.statusText);
                    progressContainer.classList.add('hidden');
                }
            }
        };
        
        xhr.open('POST', 'https://catbox.moe/user/api.php', true);
        xhr.send(formData);
    }
    
    // REAL SHORTLINK IMPLEMENTATION
    const originalUrlInput = document.getElementById('original-url');
    const customNameInput = document.getElementById('custom-name');
    const namePreview = document.getElementById('name-preview');
    const createShortlinkBtn = document.getElementById('create-shortlink');
    const shortlinkResult = document.getElementById('shortlink-result');
    const shortlinkUrl = document.getElementById('shortlink-url');
    
    customNameInput.addEventListener('input', () => {
        namePreview.textContent = customNameInput.value || generateRandomSlug();
    });
    
    createShortlinkBtn.addEventListener('click', async () => {
        const url = originalUrlInput.value.trim();
        let customName = customNameInput.value.trim();
        
        if (!url) {
            alert('Please enter a URL');
            return;
        }
        
        if (!customName) {
            customName = generateRandomSlug();
        }
        
        try {
            const response = await fetch('link.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    original_url: url,
                    custom_name: customName
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                shortlinkUrl.value = window.location.origin + '/' + data.short_id;
                shortlinkResult.classList.remove('hidden');
            } else {
                alert(data.message || 'Error creating shortlink');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while creating the shortlink');
        }
    });
    
    // Helper functions
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        handleFiles({ target: fileInput });
    }
    
    function handleFiles(e) {
        const files = e.target.files;
        if (files.length === 0) return;
        uploadFiles(files);
    }
    
    function generateRandomSlug() {
        return Math.random().toString(36).substring(2, 8);
    }
    
    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            input.select();
            document.execCommand('copy');
            
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                this.innerHTML = originalText;
            }, 2000);
        });
    });
});