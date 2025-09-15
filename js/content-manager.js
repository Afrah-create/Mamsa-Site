/* Content Manager JavaScript for Madi Makerere University Students Association */

// Content management functionality
let contentManager = {
    data: {},
    currentEditItem: null,
    isEditing: false
};

// Initialize content manager
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin')) {
        initializeContentManager();
    }
});

// Initialize content manager
function initializeContentManager() {
    loadContentData();
    initializeContentEditor();
    initializeImageUpload();
    initializeContentValidation();
}

// Load content data
async function loadContentData() {
    try {
        const savedData = localStorage.getItem('contentData');
        if (savedData) {
            contentManager.data = JSON.parse(savedData);
        } else {
            // Load from JSON file
            const response = await fetch('../data/content.json');
            if (response.ok) {
                contentManager.data = await response.json();
            } else {
                contentManager.data = getDefaultContentData();
            }
        }
    } catch (error) {
        console.error('Error loading content data:', error);
        contentManager.data = getDefaultContentData();
    }
}

// Get default content data
function getDefaultContentData() {
    return {
        news: [],
        events: [],
        leadership: [],
        gallery: [],
        about: {
            mission: 'To foster unity among Madi students at Makerere University, promote academic excellence, provide a platform for personal and professional development, and advocate for student rights and welfare while maintaining strong cultural identity and values.',
            vision: 'To be the leading student association that empowers Madi students to achieve academic excellence, develop leadership skills, and contribute meaningfully to society while preserving and promoting our rich cultural heritage.',
            history: 'The Madi Makerere University Students Association was founded in 2009 by a group of dedicated students with the vision of creating a supportive community for Madi students.'
        },
        contact: {
            phone: '+256 700 000 000',
            email: 'info@madimakerere.org',
            address: 'Makerere University, Kampala, Uganda',
            officeHours: 'Monday - Friday: 8:00 AM - 5:00 PM\nSaturday: 9:00 AM - 2:00 PM\nSunday: Closed'
        },
        settings: {
            siteTitle: 'Madi Makerere University Students Association',
            siteDescription: 'Official website of the Madi Makerere University Students Association',
            itemsPerPage: 10
        }
    };
}

// Initialize content editor
function initializeContentEditor() {
    // WYSIWYG editor for content fields
    const contentTextareas = document.querySelectorAll('textarea[id*="content"], textarea[id*="description"], textarea[id*="bio"]');
    
    contentTextareas.forEach(textarea => {
        // Add toolbar
        const toolbar = createToolbar(textarea);
        textarea.parentNode.insertBefore(toolbar, textarea);
        
        // Add event listeners for toolbar buttons
        initializeToolbarEvents(toolbar, textarea);
    });
}

// Create toolbar for content editor
function createToolbar(textarea) {
    const toolbar = document.createElement('div');
    toolbar.className = 'content-toolbar';
    toolbar.innerHTML = `
        <div class="toolbar-buttons">
            <button type="button" class="toolbar-btn" data-command="bold" title="Bold">
                <i class="fas fa-bold"></i>
            </button>
            <button type="button" class="toolbar-btn" data-command="italic" title="Italic">
                <i class="fas fa-italic"></i>
            </button>
            <button type="button" class="toolbar-btn" data-command="underline" title="Underline">
                <i class="fas fa-underline"></i>
            </button>
            <button type="button" class="toolbar-btn" data-command="insertUnorderedList" title="Bullet List">
                <i class="fas fa-list-ul"></i>
            </button>
            <button type="button" class="toolbar-btn" data-command="insertOrderedList" title="Numbered List">
                <i class="fas fa-list-ol"></i>
            </button>
            <button type="button" class="toolbar-btn" data-command="createLink" title="Insert Link">
                <i class="fas fa-link"></i>
            </button>
            <button type="button" class="toolbar-btn" data-command="formatBlock" data-value="h2" title="Heading 2">
                <i class="fas fa-heading"></i>
            </button>
            <button type="button" class="toolbar-btn" data-command="formatBlock" data-value="h3" title="Heading 3">
                <i class="fas fa-heading" style="font-size: 0.8em;"></i>
            </button>
        </div>
    `;
    
    return toolbar;
}

// Initialize toolbar events
function initializeToolbarEvents(toolbar, textarea) {
    const buttons = toolbar.querySelectorAll('.toolbar-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const command = this.getAttribute('data-command');
            const value = this.getAttribute('data-value');
            
            executeCommand(command, value, textarea);
        });
    });
}

// Execute command
function executeCommand(command, value, textarea) {
    // Focus the textarea
    textarea.focus();
    
    // Execute the command
    if (command === 'createLink') {
        const url = prompt('Enter URL:');
        if (url) {
            document.execCommand(command, false, url);
        }
    } else if (value) {
        document.execCommand(command, false, value);
    } else {
        document.execCommand(command, false, null);
    }
    
    // Update textarea content
    textarea.value = textarea.value;
}

// Initialize image upload
function initializeImageUpload() {
    const imageInputs = document.querySelectorAll('input[type="file"][accept*="image"]');
    
    imageInputs.forEach(input => {
        input.addEventListener('change', function() {
            handleImageUpload(this);
        });
    });
}

// Handle image upload
function handleImageUpload(input) {
    const files = input.files;
    if (files.length > 0) {
        const file = files[0];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Please select a valid image file.', 'error');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Image size must be less than 5MB.', 'error');
            return;
        }
        
        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            
            // Store the image data
            const imageData = {
                name: file.name,
                size: file.size,
                type: file.type,
                data: base64Image,
                uploadDate: new Date().toISOString()
            };
            
            // Save to localStorage
            let uploadedImages = JSON.parse(localStorage.getItem('uploadedImages') || '[]');
            uploadedImages.push(imageData);
            localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));
            
            // Update preview if exists
            updateImagePreview(input, base64Image);
            
            showNotification('Image uploaded successfully!', 'success');
        };
        
        reader.readAsDataURL(file);
    }
}

// Update image preview
function updateImagePreview(input, imageData) {
    const preview = input.parentNode.querySelector('.image-preview');
    if (preview) {
        preview.innerHTML = `
            <img src="${imageData}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
            <button type="button" class="btn btn-danger btn-sm" onclick="removeImagePreview(this)">
                <i class="fas fa-times"></i>
            </button>
        `;
    }
}

// Remove image preview
function removeImagePreview(button) {
    const preview = button.parentNode;
    preview.innerHTML = '';
}

// Initialize content validation
function initializeContentValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
            }
        });
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                clearFieldError(this);
            });
        });
    });
}

// Validate form
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Validate field
function validateField(field) {
    const value = field.value.trim();
    const fieldType = field.type;
    const fieldName = field.name || field.id;
    
    clearFieldError(field);
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, `${getFieldLabel(field)} is required.`);
        return false;
    }
    
    // Email validation
    if (fieldType === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, 'Please enter a valid email address.');
            return false;
        }
    }
    
    // Phone validation
    if (fieldType === 'tel' && value) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
            showFieldError(field, 'Please enter a valid phone number.');
            return false;
        }
    }
    
    // URL validation
    if (fieldType === 'url' && value) {
        try {
            new URL(value);
        } catch {
            showFieldError(field, 'Please enter a valid URL.');
            return false;
        }
    }
    
    // Text length validation
    if (field.hasAttribute('minlength')) {
        const minLength = parseInt(field.getAttribute('minlength'));
        if (value.length < minLength) {
            showFieldError(field, `${getFieldLabel(field)} must be at least ${minLength} characters long.`);
            return false;
        }
    }
    
    if (field.hasAttribute('maxlength')) {
        const maxLength = parseInt(field.getAttribute('maxlength'));
        if (value.length > maxLength) {
            showFieldError(field, `${getFieldLabel(field)} must be no more than ${maxLength} characters long.`);
            return false;
        }
    }
    
    return true;
}

// Show field error
function showFieldError(field, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.classList.add('error');
    field.parentNode.appendChild(errorDiv);
}

// Clear field error
function clearFieldError(field) {
    field.classList.remove('error');
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Get field label
function getFieldLabel(field) {
    const label = field.parentNode.querySelector('label');
    if (label) {
        return label.textContent.replace('*', '').trim();
    }
    
    // Fallback to field name/ID
    return field.name || field.id || 'This field';
}

// Content management functions
function addNewsArticle(data) {
    if (!contentManager.data.news) {
        contentManager.data.news = [];
    }
    
    const newsArticle = {
        id: Date.now(),
        title: data.title,
        content: data.content,
        excerpt: data.content.substring(0, 150) + '...',
        category: data.category,
        date: new Date().toISOString().split('T')[0],
        featured: data.featured || false,
        image: data.image || 'images/news/default.jpg',
        author: data.author || 'Admin',
        tags: data.tags || []
    };
    
    contentManager.data.news.unshift(newsArticle);
    saveContentData();
    
    return newsArticle;
}

function updateNewsArticle(id, data) {
    const index = contentManager.data.news.findIndex(article => article.id === id);
    if (index !== -1) {
        contentManager.data.news[index] = {
            ...contentManager.data.news[index],
            ...data,
            id: id // Preserve original ID
        };
        saveContentData();
        return contentManager.data.news[index];
    }
    return null;
}

function deleteNewsArticle(id) {
    contentManager.data.news = contentManager.data.news.filter(article => article.id !== id);
    saveContentData();
}

function addEvent(data) {
    if (!contentManager.data.events) {
        contentManager.data.events = [];
    }
    
    const event = {
        id: Date.now(),
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        location: data.location,
        category: data.category,
        status: data.status || 'upcoming',
        image: data.image || 'images/events/default.jpg',
        registrationRequired: data.registrationRequired || false,
        maxParticipants: data.maxParticipants || null,
        contactPerson: data.contactPerson || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || ''
    };
    
    contentManager.data.events.unshift(event);
    saveContentData();
    
    return event;
}

function updateEvent(id, data) {
    const index = contentManager.data.events.findIndex(event => event.id === id);
    if (index !== -1) {
        contentManager.data.events[index] = {
            ...contentManager.data.events[index],
            ...data,
            id: id
        };
        saveContentData();
        return contentManager.data.events[index];
    }
    return null;
}

function deleteEvent(id) {
    contentManager.data.events = contentManager.data.events.filter(event => event.id !== id);
    saveContentData();
}

function addLeader(data) {
    if (!contentManager.data.leadership) {
        contentManager.data.leadership = [];
    }
    
    const leader = {
        id: Date.now(),
        name: data.name,
        position: data.position,
        department: data.department,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        image: data.image || 'images/leadership/default.jpg',
        year: data.year || '',
        course: data.course || '',
        socialMedia: data.socialMedia || {}
    };
    
    contentManager.data.leadership.push(leader);
    saveContentData();
    
    return leader;
}

function updateLeader(id, data) {
    const index = contentManager.data.leadership.findIndex(leader => leader.id === id);
    if (index !== -1) {
        contentManager.data.leadership[index] = {
            ...contentManager.data.leadership[index],
            ...data,
            id: id
        };
        saveContentData();
        return contentManager.data.leadership[index];
    }
    return null;
}

function deleteLeader(id) {
    contentManager.data.leadership = contentManager.data.leadership.filter(leader => leader.id !== id);
    saveContentData();
}

function addGalleryPhoto(data) {
    if (!contentManager.data.gallery) {
        contentManager.data.gallery = [];
    }
    
    const photo = {
        id: Date.now(),
        title: data.title,
        description: data.description,
        category: data.category,
        image: data.image,
        photographer: data.photographer || '',
        date: new Date().toISOString().split('T')[0],
        tags: data.tags || [],
        featured: data.featured || false
    };
    
    contentManager.data.gallery.unshift(photo);
    saveContentData();
    
    return photo;
}

function updateGalleryPhoto(id, data) {
    const index = contentManager.data.gallery.findIndex(photo => photo.id === id);
    if (index !== -1) {
        contentManager.data.gallery[index] = {
            ...contentManager.data.gallery[index],
            ...data,
            id: id
        };
        saveContentData();
        return contentManager.data.gallery[index];
    }
    return null;
}

function deleteGalleryPhoto(id) {
    contentManager.data.gallery = contentManager.data.gallery.filter(photo => photo.id !== id);
    saveContentData();
}

// Save content data
function saveContentData() {
    localStorage.setItem('contentData', JSON.stringify(contentManager.data));
    
    // Also save to admin data if in admin panel
    if (window.location.pathname.includes('admin')) {
        localStorage.setItem('adminContentData', JSON.stringify(contentManager.data));
    }
}

// Search functionality
function searchContent(query, type = 'all') {
    const results = {
        news: [],
        events: [],
        leadership: [],
        gallery: []
    };
    
    if (!query.trim()) {
        return results;
    }
    
    const searchTerm = query.toLowerCase();
    
    // Search news
    if (type === 'all' || type === 'news') {
        results.news = contentManager.data.news.filter(article => 
            article.title.toLowerCase().includes(searchTerm) ||
            article.content.toLowerCase().includes(searchTerm) ||
            article.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Search events
    if (type === 'all' || type === 'events') {
        results.events = contentManager.data.events.filter(event => 
            event.title.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm) ||
            event.location.toLowerCase().includes(searchTerm) ||
            event.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Search leadership
    if (type === 'all' || type === 'leadership') {
        results.leadership = contentManager.data.leadership.filter(leader => 
            leader.name.toLowerCase().includes(searchTerm) ||
            leader.position.toLowerCase().includes(searchTerm) ||
            leader.department.toLowerCase().includes(searchTerm) ||
            leader.bio.toLowerCase().includes(searchTerm)
        );
    }
    
    // Search gallery
    if (type === 'all' || type === 'gallery') {
        results.gallery = contentManager.data.gallery.filter(photo => 
            photo.title.toLowerCase().includes(searchTerm) ||
            photo.description.toLowerCase().includes(searchTerm) ||
            photo.category.toLowerCase().includes(searchTerm) ||
            photo.photographer.toLowerCase().includes(searchTerm)
        );
    }
    
    return results;
}

// Export content
function exportContent(format = 'json') {
    let exportData;
    
    switch (format) {
        case 'json':
            exportData = JSON.stringify(contentManager.data, null, 2);
            break;
        case 'csv':
            exportData = convertToCSV(contentManager.data);
            break;
        default:
            exportData = JSON.stringify(contentManager.data, null, 2);
    }
    
    const blob = new Blob([exportData], { type: `text/${format}` });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `madi-makerere-content.${format}`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Convert to CSV
function convertToCSV(data) {
    let csv = '';
    
    // News CSV
    if (data.news && data.news.length > 0) {
        csv += 'News Articles\n';
        csv += 'ID,Title,Category,Date,Featured\n';
        data.news.forEach(article => {
            csv += `${article.id},"${article.title}","${article.category}","${article.date}","${article.featured}"\n`;
        });
        csv += '\n';
    }
    
    // Events CSV
    if (data.events && data.events.length > 0) {
        csv += 'Events\n';
        csv += 'ID,Title,Date,Time,Location,Category,Status\n';
        data.events.forEach(event => {
            csv += `${event.id},"${event.title}","${event.date}","${event.time}","${event.location}","${event.category}","${event.status}"\n`;
        });
        csv += '\n';
    }
    
    // Leadership CSV
    if (data.leadership && data.leadership.length > 0) {
        csv += 'Leadership Team\n';
        csv += 'ID,Name,Position,Department,Email,Phone\n';
        data.leadership.forEach(leader => {
            csv += `${leader.id},"${leader.name}","${leader.position}","${leader.department}","${leader.email}","${leader.phone}"\n`;
        });
    }
    
    return csv;
}

// Import content
function importContent(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate imported data structure
            if (validateImportedData(importedData)) {
                contentManager.data = importedData;
                saveContentData();
                showNotification('Content imported successfully!', 'success');
                
                // Refresh the current page if in admin panel
                if (window.location.pathname.includes('admin')) {
                    location.reload();
                }
            } else {
                showNotification('Invalid data format. Please check the file.', 'error');
            }
        } catch (error) {
            showNotification('Error importing content. Please check the file format.', 'error');
        }
    };
    
    reader.readAsText(file);
}

// Validate imported data
function validateImportedData(data) {
    // Basic validation - check if it has expected properties
    return data && (
        Array.isArray(data.news) ||
        Array.isArray(data.events) ||
        Array.isArray(data.leadership) ||
        Array.isArray(data.gallery) ||
        data.about ||
        data.contact ||
        data.settings
    );
}

// Utility function for notifications
function showNotification(message, type = 'info') {
    // This function should be available from main.js or admin.js
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}
