/* Admin Panel JavaScript for Madi Makerere University Students Association */

// Admin-specific variables
let adminData = {};
let currentAdminSection = 'dashboard';
let isEditing = false;
let currentEditItem = null;

// Initialize admin features
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin')) {
        initializeAdmin();
    }
});

// Initialize admin panel
function initializeAdmin() {
    checkAdminAuth();
    loadAdminData();
    initializeAdminNavigation();
    initializeAdminForms();
    initializeAdminModals();
    populateAdminDashboard();
}

// Check admin authentication
function checkAdminAuth() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'login.html') {
        // If on login page and already logged in, redirect to dashboard
        if (isLoggedIn === 'true') {
            window.location.href = 'admin.html';
        }
    } else if (currentPage === 'admin.html') {
        // If on admin page but not logged in, redirect to login
        if (isLoggedIn !== 'true') {
            window.location.href = 'login.html';
        } else {
            // Set admin user info
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const adminUserName = document.getElementById('admin-user-name');
            if (adminUserName) {
                adminUserName.textContent = adminUser.name || 'Admin User';
            }
        }
    }
}

// Load admin data
async function loadAdminData() {
    try {
        // Try to load from localStorage first
        const savedData = localStorage.getItem('adminContentData');
        if (savedData) {
            adminData = JSON.parse(savedData);
        } else {
            // Load from main content data
            const response = await fetch('../data/content.json');
            if (response.ok) {
                adminData = await response.json();
            } else {
                // Use default data
                adminData = getDefaultAdminData();
            }
        }
        
        populateAdminContent();
    } catch (error) {
        console.error('Error loading admin data:', error);
        adminData = getDefaultAdminData();
        populateAdminContent();
    }
}

// Get default admin data
function getDefaultAdminData() {
    return {
        news: [],
        events: [],
        leadership: [],
        gallery: [],
        about: {
            mission: '',
            vision: '',
            history: ''
        },
        contact: {
            phone: '',
            email: '',
            address: '',
            officeHours: ''
        },
        settings: {
            siteTitle: 'Madi Makerere University Students Association',
            siteDescription: 'Official website of the Madi Makerere University Students Association',
            itemsPerPage: 10
        }
    };
}

// Initialize admin navigation
function initializeAdminNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav-menu .nav-link');
    const sections = document.querySelectorAll('.admin-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            switchAdminSection(section);
        });
    });
    
    // Quick action buttons
    const quickActions = document.querySelectorAll('.action-btn');
    quickActions.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            handleQuickAction(action);
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Preview site button
    const previewBtn = document.getElementById('preview-site');
    if (previewBtn) {
        previewBtn.addEventListener('click', function() {
            window.open('../index.html', '_blank');
        });
    }
}

// Switch admin section
function switchAdminSection(section) {
    // Update navigation
    const navLinks = document.querySelectorAll('.admin-nav-menu .nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === section) {
            link.classList.add('active');
        }
    });
    
    // Update sections
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(sec => {
        sec.classList.remove('active');
        if (sec.id === `${section}-section`) {
            sec.classList.add('active');
        }
    });
    
    currentAdminSection = section;
    
    // Load section-specific content
    switch (section) {
        case 'news':
            populateNewsManagement();
            break;
        case 'events':
            populateEventsManagement();
            break;
        case 'leadership':
            populateLeadershipManagement();
            break;
        case 'gallery':
            populateGalleryManagement();
            break;
    }
}

// Initialize admin forms
function initializeAdminForms() {
    // Login form
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Password toggle
    const passwordToggle = document.getElementById('password-toggle');
    if (passwordToggle) {
        passwordToggle.addEventListener('click', togglePasswordVisibility);
    }
    
    // Content forms
    const contentForms = document.querySelectorAll('.content-form form');
    contentForms.forEach(form => {
        form.addEventListener('submit', handleContentFormSubmission);
    });
    
    // Settings forms
    const settingsForms = document.querySelectorAll('.settings-form form');
    settingsForms.forEach(form => {
        form.addEventListener('submit', handleSettingsFormSubmission);
    });
    
    // Tab functionality
    initializeAdminTabs();
}

// Initialize admin tabs
function initializeAdminTabs() {
    // Content tabs
    const contentTabs = document.querySelectorAll('.content-tabs .tab-btn');
    const contentTabContents = document.querySelectorAll('.tab-content');
    
    contentTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab
            contentTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide content
            contentTabContents.forEach(content => {
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });
    
    // Settings tabs
    const settingsTabs = document.querySelectorAll('.settings-tabs .tab-btn');
    const settingsTabContents = document.querySelectorAll('.settings-form');
    
    settingsTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab
            settingsTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide content
            settingsTabContents.forEach(content => {
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });
}

// Initialize admin modals
function initializeAdminModals() {
    // News modal
    const newsModal = document.getElementById('news-modal');
    const addNewsBtn = document.getElementById('add-news-btn');
    const cancelNewsBtn = document.getElementById('cancel-news');
    const newsForm = document.getElementById('news-form');
    
    if (addNewsBtn && newsModal) {
        addNewsBtn.addEventListener('click', function() {
            openNewsModal();
        });
    }
    
    if (cancelNewsBtn && newsModal) {
        cancelNewsBtn.addEventListener('click', function() {
            closeModal('news-modal');
        });
    }
    
    if (newsForm) {
        newsForm.addEventListener('submit', handleNewsFormSubmission);
    }
    
    // Modal close buttons
    const modalCloses = document.querySelectorAll('.modal-close');
    modalCloses.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Close modal on outside click
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Handle admin login
function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // Simple authentication (in production, use proper authentication)
    if (username === 'admin' && password === 'admin123') {
        // Store login state
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminUser', JSON.stringify({
            name: 'Administrator',
            username: username,
            loginTime: new Date().toISOString()
        }));
        
        // Redirect to admin dashboard
        window.location.href = 'admin.html';
    } else {
        // Show error
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.style.display = 'flex';
            errorDiv.querySelector('#error-message').textContent = 'Invalid username or password';
        }
    }
}

// Toggle password visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('password-toggle');
    const icon = toggleBtn.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUser');
        window.location.href = 'login.html';
    }
}

// Handle quick actions
function handleQuickAction(action) {
    switch (action) {
        case 'add-news':
            openNewsModal();
            break;
        case 'add-event':
            // Open event modal (to be implemented)
            showNotification('Event management coming soon!', 'info');
            break;
        case 'add-leader':
            // Open leadership modal (to be implemented)
            showNotification('Leadership management coming soon!', 'info');
            break;
        case 'upload-photo':
            // Open photo upload modal (to be implemented)
            showNotification('Photo upload coming soon!', 'info');
            break;
    }
}

// Populate admin dashboard
function populateAdminDashboard() {
    // Update stats
    updateDashboardStats();
    
    // Populate recent activity
    populateRecentActivity();
}

// Update dashboard stats
function updateDashboardStats() {
    const totalNews = document.getElementById('total-news');
    const totalEvents = document.getElementById('total-events');
    const totalLeaders = document.getElementById('total-leaders');
    const totalPhotos = document.getElementById('total-photos');
    
    if (totalNews) totalNews.textContent = adminData.news ? adminData.news.length : 0;
    if (totalEvents) totalEvents.textContent = adminData.events ? adminData.events.length : 0;
    if (totalLeaders) totalLeaders.textContent = adminData.leadership ? adminData.leadership.length : 0;
    if (totalPhotos) totalPhotos.textContent = adminData.gallery ? adminData.gallery.length : 0;
}

// Populate recent activity
function populateRecentActivity() {
    const activityList = document.getElementById('recent-activity');
    if (!activityList) return;
    
    const activities = [
        {
            icon: 'fas fa-plus',
            title: 'New news article added',
            time: '2 hours ago'
        },
        {
            icon: 'fas fa-edit',
            title: 'Event details updated',
            time: '4 hours ago'
        },
        {
            icon: 'fas fa-image',
            title: 'Gallery photos uploaded',
            time: '1 day ago'
        },
        {
            icon: 'fas fa-user',
            title: 'Leadership team updated',
            time: '2 days ago'
        }
    ];
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4 class="activity-title">${activity.title}</h4>
                <p class="activity-time">${activity.time}</p>
            </div>
        </div>
    `).join('');
}

// Populate admin content
function populateAdminContent() {
    // Populate content forms with current data
    populateContentForms();
    
    // Populate management sections
    populateNewsManagement();
    populateEventsManagement();
    populateLeadershipManagement();
    populateGalleryManagement();
}

// Populate content forms
function populateContentForms() {
    // Homepage form
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    const missionText = document.getElementById('mission-text');
    const visionText = document.getElementById('vision-text');
    
    if (heroTitle) heroTitle.value = adminData.homepage?.heroTitle || '';
    if (heroSubtitle) heroSubtitle.value = adminData.homepage?.heroSubtitle || '';
    if (missionText) missionText.value = adminData.about?.mission || '';
    if (visionText) visionText.value = adminData.about?.vision || '';
    
    // About form
    const aboutMission = document.getElementById('about-mission');
    const aboutVision = document.getElementById('about-vision');
    const aboutHistory = document.getElementById('about-history');
    
    if (aboutMission) aboutMission.value = adminData.about?.mission || '';
    if (aboutVision) aboutVision.value = adminData.about?.vision || '';
    if (aboutHistory) aboutHistory.value = adminData.about?.history || '';
    
    // Contact form
    const contactPhone = document.getElementById('contact-phone');
    const contactEmail = document.getElementById('contact-email');
    const contactAddress = document.getElementById('contact-address');
    const officeHours = document.getElementById('office-hours');
    
    if (contactPhone) contactPhone.value = adminData.contact?.phone || '';
    if (contactEmail) contactEmail.value = adminData.contact?.email || '';
    if (contactAddress) contactAddress.value = adminData.contact?.address || '';
    if (officeHours) officeHours.value = adminData.contact?.officeHours || '';
}

// Populate news management
function populateNewsManagement() {
    const newsList = document.getElementById('news-list');
    if (!newsList) return;
    
    if (!adminData.news || adminData.news.length === 0) {
        newsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-newspaper"></i>
                <h3>No news articles yet</h3>
                <p>Start by adding your first news article</p>
                <button class="btn btn-primary" onclick="openNewsModal()">
                    <i class="fas fa-plus"></i>
                    Add News Article
                </button>
            </div>
        `;
        return;
    }
    
    newsList.innerHTML = adminData.news.map(news => `
        <div class="list-item">
            <div class="item-content">
                <h3 class="item-title">${news.title}</h3>
                <div class="item-meta">
                    <span class="item-category">${news.category}</span>
                    <span class="item-date">${formatDate(news.date)}</span>
                    <span class="item-status ${news.featured ? 'featured' : ''}">${news.featured ? 'Featured' : 'Regular'}</span>
                </div>
                <p class="item-excerpt">${news.excerpt}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-outline" onclick="editNews(${news.id})">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="btn btn-danger" onclick="deleteNews(${news.id})">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Populate events management
function populateEventsManagement() {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;
    
    if (!adminData.events || adminData.events.length === 0) {
        eventsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <h3>No events yet</h3>
                <p>Start by adding your first event</p>
                <button class="btn btn-primary">
                    <i class="fas fa-plus"></i>
                    Add Event
                </button>
            </div>
        `;
        return;
    }
    
    eventsList.innerHTML = adminData.events.map(event => `
        <div class="list-item">
            <div class="item-content">
                <h3 class="item-title">${event.title}</h3>
                <div class="item-meta">
                    <span class="item-category">${event.category}</span>
                    <span class="item-date">${formatDate(event.date)}</span>
                    <span class="item-status ${event.status}">${event.status}</span>
                </div>
                <p class="item-excerpt">${event.description}</p>
                <div class="event-details">
                    <span><i class="fas fa-clock"></i> ${event.time}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-outline">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="btn btn-danger">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Populate leadership management
function populateLeadershipManagement() {
    const leadershipList = document.getElementById('leadership-list');
    if (!leadershipList) return;
    
    if (!adminData.leadership || adminData.leadership.length === 0) {
        leadershipList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No leadership team members yet</h3>
                <p>Start by adding leadership team members</p>
                <button class="btn btn-primary">
                    <i class="fas fa-plus"></i>
                    Add Leader
                </button>
            </div>
        `;
        return;
    }
    
    leadershipList.innerHTML = adminData.leadership.map(leader => `
        <div class="list-item">
            <div class="item-content">
                <div class="leader-info">
                    <img src="${leader.image}" alt="${leader.name}" class="leader-thumb">
                    <div class="leader-details">
                        <h3 class="item-title">${leader.name}</h3>
                        <div class="item-meta">
                            <span class="item-position">${leader.position}</span>
                            <span class="item-department">${leader.department}</span>
                        </div>
                        <p class="item-excerpt">${leader.bio}</p>
                        <div class="leader-contact">
                            <span><i class="fas fa-envelope"></i> ${leader.email}</span>
                            <span><i class="fas fa-phone"></i> ${leader.phone}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-outline">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="btn btn-danger">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Populate gallery management
function populateGalleryManagement() {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;
    
    if (!adminData.gallery || adminData.gallery.length === 0) {
        galleryGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <h3>No photos yet</h3>
                <p>Start by uploading photos to the gallery</p>
                <button class="btn btn-primary">
                    <i class="fas fa-plus"></i>
                    Upload Photos
                </button>
            </div>
        `;
        return;
    }
    
    galleryGrid.innerHTML = adminData.gallery.map(photo => `
        <div class="gallery-item">
            <img src="${photo.image}" alt="${photo.title}" class="gallery-image">
            <div class="gallery-info">
                <h3 class="gallery-title">${photo.title}</h3>
                <p class="gallery-meta">${formatDate(photo.date)} • ${photo.category}</p>
            </div>
            <div class="gallery-actions">
                <button class="btn btn-outline">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Handle content form submission
function handleContentFormSubmission(e) {
    e.preventDefault();
    
    const formId = e.target.id;
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    switch (formId) {
        case 'homepage-form':
            adminData.homepage = { ...adminData.homepage, ...data };
            break;
        case 'about-form':
            adminData.about = { ...adminData.about, ...data };
            break;
        case 'contact-form':
            adminData.contact = { ...adminData.contact, ...data };
            break;
    }
    
    saveAdminData();
    showNotification('Content updated successfully!', 'success');
}

// Handle settings form submission
function handleSettingsFormSubmission(e) {
    e.preventDefault();
    
    const formId = e.target.id;
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    switch (formId) {
        case 'general-settings-form':
            adminData.settings = { ...adminData.settings, ...data };
            break;
        case 'security-settings-form':
            // Handle password change
            const currentPassword = data.currentPassword;
            const newPassword = data.newPassword;
            const confirmPassword = data.confirmPassword;
            
            if (newPassword !== confirmPassword) {
                showNotification('New passwords do not match!', 'error');
                return;
            }
            
            if (currentPassword !== 'admin123') {
                showNotification('Current password is incorrect!', 'error');
                return;
            }
            
            showNotification('Password changed successfully!', 'success');
            break;
    }
    
    saveAdminData();
}

// Handle news form submission
function handleNewsFormSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newsData = {
        id: Date.now(),
        title: formData.get('news-title'),
        category: formData.get('news-category'),
        content: formData.get('news-content'),
        excerpt: formData.get('news-content').substring(0, 150) + '...',
        date: new Date().toISOString().split('T')[0],
        featured: false,
        image: 'images/news/default.jpg' // Default image
    };
    
    if (!adminData.news) {
        adminData.news = [];
    }
    
    adminData.news.unshift(newsData);
    saveAdminData();
    
    closeModal('news-modal');
    showNotification('News article added successfully!', 'success');
    
    // Refresh news management
    populateNewsManagement();
    updateDashboardStats();
}

// Open news modal
function openNewsModal() {
    const modal = document.getElementById('news-modal');
    const modalTitle = document.getElementById('modal-title');
    const newsForm = document.getElementById('news-form');
    
    if (modal && modalTitle && newsForm) {
        modalTitle.textContent = 'Add News Article';
        newsForm.reset();
        modal.classList.add('active');
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Edit news
function editNews(newsId) {
    const news = adminData.news.find(n => n.id === newsId);
    if (!news) return;
    
    const modal = document.getElementById('news-modal');
    const modalTitle = document.getElementById('modal-title');
    const newsForm = document.getElementById('news-form');
    
    if (modal && modalTitle && newsForm) {
        modalTitle.textContent = 'Edit News Article';
        
        // Populate form with existing data
        document.getElementById('news-title').value = news.title;
        document.getElementById('news-category').value = news.category;
        document.getElementById('news-content').value = news.content;
        
        currentEditItem = newsId;
        isEditing = true;
        
        modal.classList.add('active');
    }
}

// Delete news
function deleteNews(newsId) {
    if (confirm('Are you sure you want to delete this news article?')) {
        adminData.news = adminData.news.filter(n => n.id !== newsId);
        saveAdminData();
        populateNewsManagement();
        updateDashboardStats();
        showNotification('News article deleted successfully!', 'success');
    }
}

// Save admin data
function saveAdminData() {
    localStorage.setItem('adminContentData', JSON.stringify(adminData));
    
    // Also update the main content data
    localStorage.setItem('contentData', JSON.stringify(adminData));
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Export/Import functionality
function exportData() {
    const dataStr = JSON.stringify(adminData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'madi-makerere-content.json';
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Data exported successfully!', 'success');
}

function importData() {
    const input = document.getElementById('import-file');
    if (input.files.length > 0) {
        const file = input.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                adminData = importedData;
                saveAdminData();
                populateAdminContent();
                showNotification('Data imported successfully!', 'success');
            } catch (error) {
                showNotification('Error importing data. Please check the file format.', 'error');
            }
        };
        
        reader.readAsText(file);
    }
}

// Initialize export/import buttons
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('export-data');
    const importBtn = document.getElementById('import-data');
    const importFile = document.getElementById('import-file');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    if (importBtn) {
        importBtn.addEventListener('click', function() {
            importFile.click();
        });
    }
    
    if (importFile) {
        importFile.addEventListener('change', importData);
    }
});
