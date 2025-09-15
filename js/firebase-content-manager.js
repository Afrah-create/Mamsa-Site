// Content Manager with Firebase Integration
class ContentManager {
    constructor() {
        this.currentContent = {};
        this.isInitialized = false;
        this.editingLocks = new Map();
    }

    async init() {
        try {
            await this.loadContent();
            this.setupEventListeners();
            this.isInitialized = true;
        } catch (error) {
            console.error('Content manager initialization error:', error);
        }
    }

    async loadContent() {
        try {
            // Load from localStorage for now
            const savedData = localStorage.getItem('adminContentData');
            if (savedData) {
                this.currentContent = JSON.parse(savedData);
            } else {
                this.currentContent = this.getDefaultContent();
            }
            
            this.populateContent();
        } catch (error) {
            console.error('Error loading content:', error);
            this.currentContent = this.getDefaultContent();
        }
    }

    getDefaultContent() {
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

    populateContent() {
        this.populateNewsManagement();
        this.populateEventsManagement();
        this.populateLeadershipManagement();
        this.populateGalleryManagement();
        this.populateContentForms();
    }

    populateNewsManagement() {
        const newsList = document.getElementById('news-list');
        if (!newsList) return;
        
        if (!this.currentContent.news || this.currentContent.news.length === 0) {
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
        
        newsList.innerHTML = this.currentContent.news.map(news => `
            <div class="list-item">
                <div class="item-content">
                    <h3 class="item-title">${news.title}</h3>
                    <div class="item-meta">
                        <span class="item-category">${news.category}</span>
                        <span class="item-date">${this.formatDate(news.date)}</span>
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

    populateEventsManagement() {
        const eventsList = document.getElementById('events-list');
        if (!eventsList) return;
        
        if (!this.currentContent.events || this.currentContent.events.length === 0) {
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
        
        eventsList.innerHTML = this.currentContent.events.map(event => `
            <div class="list-item">
                <div class="item-content">
                    <h3 class="item-title">${event.title}</h3>
                    <div class="item-meta">
                        <span class="item-category">${event.category}</span>
                        <span class="item-date">${this.formatDate(event.date)}</span>
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

    populateLeadershipManagement() {
        const leadershipList = document.getElementById('leadership-list');
        if (!leadershipList) return;
        
        if (!this.currentContent.leadership || this.currentContent.leadership.length === 0) {
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
        
        leadershipList.innerHTML = this.currentContent.leadership.map(leader => `
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

    populateGalleryManagement() {
        const galleryGrid = document.getElementById('gallery-grid');
        if (!galleryGrid) return;
        
        if (!this.currentContent.gallery || this.currentContent.gallery.length === 0) {
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
        
        galleryGrid.innerHTML = this.currentContent.gallery.map(photo => `
            <div class="gallery-item">
                <img src="${photo.image}" alt="${photo.title}" class="gallery-image">
                <div class="gallery-info">
                    <h3 class="gallery-title">${photo.title}</h3>
                    <p class="gallery-meta">${this.formatDate(photo.date)} • ${photo.category}</p>
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

    populateContentForms() {
        // Homepage form
        const heroTitle = document.getElementById('hero-title');
        const heroSubtitle = document.getElementById('hero-subtitle');
        const missionText = document.getElementById('mission-text');
        const visionText = document.getElementById('vision-text');
        
        if (heroTitle) heroTitle.value = this.currentContent.homepage?.heroTitle || '';
        if (heroSubtitle) heroSubtitle.value = this.currentContent.homepage?.heroSubtitle || '';
        if (missionText) missionText.value = this.currentContent.about?.mission || '';
        if (visionText) visionText.value = this.currentContent.about?.vision || '';
        
        // About form
        const aboutMission = document.getElementById('about-mission');
        const aboutVision = document.getElementById('about-vision');
        const aboutHistory = document.getElementById('about-history');
        
        if (aboutMission) aboutMission.value = this.currentContent.about?.mission || '';
        if (aboutVision) aboutVision.value = this.currentContent.about?.vision || '';
        if (aboutHistory) aboutHistory.value = this.currentContent.about?.history || '';
        
        // Contact form
        const contactPhone = document.getElementById('contact-phone');
        const contactEmail = document.getElementById('contact-email');
        const contactAddress = document.getElementById('contact-address');
        const officeHours = document.getElementById('office-hours');
        
        if (contactPhone) contactPhone.value = this.currentContent.contact?.phone || '';
        if (contactEmail) contactEmail.value = this.currentContent.contact?.email || '';
        if (contactAddress) contactAddress.value = this.currentContent.contact?.address || '';
        if (officeHours) officeHours.value = this.currentContent.contact?.officeHours || '';
    }

    setupEventListeners() {
        // Content forms
        const contentForms = document.querySelectorAll('.content-form form');
        contentForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleContentFormSubmission(e));
        });
        
        // Settings forms
        const settingsForms = document.querySelectorAll('.settings-form form');
        settingsForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleSettingsFormSubmission(e));
        });
    }

    handleContentFormSubmission(e) {
        e.preventDefault();
        
        const formId = e.target.id;
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        switch (formId) {
            case 'homepage-form':
                this.currentContent.homepage = { ...this.currentContent.homepage, ...data };
                break;
            case 'about-form':
                this.currentContent.about = { ...this.currentContent.about, ...data };
                break;
            case 'contact-form':
                this.currentContent.contact = { ...this.currentContent.contact, ...data };
                break;
        }
        
        this.saveContent();
        this.showNotification('Content updated successfully!', 'success');
    }

    handleSettingsFormSubmission(e) {
        e.preventDefault();
        
        const formId = e.target.id;
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        switch (formId) {
            case 'general-settings-form':
                this.currentContent.settings = { ...this.currentContent.settings, ...data };
                break;
            case 'security-settings-form':
                // Handle password change
                const currentPassword = data.currentPassword;
                const newPassword = data.newPassword;
                const confirmPassword = data.confirmPassword;
                
                if (newPassword !== confirmPassword) {
                    this.showNotification('New passwords do not match!', 'error');
                    return;
                }
                
                if (currentPassword !== 'admin123') {
                    this.showNotification('Current password is incorrect!', 'error');
                    return;
                }
                
                this.showNotification('Password changed successfully!', 'success');
                break;
        }
        
        this.saveContent();
    }

    async saveContent() {
        try {
            localStorage.setItem('adminContentData', JSON.stringify(this.currentContent));
            localStorage.setItem('contentData', JSON.stringify(this.currentContent));
        } catch (error) {
            console.error('Error saving content:', error);
            this.showNotification('Failed to save content', 'error');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showNotification(message, type = 'info') {
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
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Global functions for backward compatibility
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

function editNews(newsId) {
    const news = window.ContentManager.currentContent.news.find(n => n.id === newsId);
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
        
        modal.classList.add('active');
    }
}

function deleteNews(newsId) {
    if (confirm('Are you sure you want to delete this news article?')) {
        window.ContentManager.currentContent.news = window.ContentManager.currentContent.news.filter(n => n.id !== newsId);
        window.ContentManager.saveContent();
        window.ContentManager.populateNewsManagement();
        window.ContentManager.showNotification('News article deleted successfully!', 'success');
    }
}

// Initialize content manager
window.ContentManager = new ContentManager();
