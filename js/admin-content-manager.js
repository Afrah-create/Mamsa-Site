// Admin Content Management Interface
import { contentService } from './firebase-content-service.js';
import { authService } from './auth-service.js';
import { COLLECTIONS, CONTENT_TYPES } from '../firebase-config.js';

class AdminContentManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.contentCache = new Map();
        this.init();
    }

    async init() {
        try {
            // Check authentication
            this.currentUser = await authService.getCurrentUser();
            if (!this.currentUser) {
                this.redirectToLogin();
                return;
            }

            // Initialize UI
            this.initializeUI();
            this.loadContent();
            this.setupEventListeners();
            this.isInitialized = true;

            console.log('Admin Content Manager initialized');
        } catch (error) {
            console.error('Error initializing admin content manager:', error);
            this.showError('Failed to initialize admin panel');
        }
    }

    initializeUI() {
        // Create main content management interface
        this.createContentInterface();
        this.createNavigationTabs();
        this.createContentForms();
    }

    createContentInterface() {
        const adminContent = document.getElementById('admin-content');
        if (!adminContent) return;

        adminContent.innerHTML = `
            <div class="admin-header">
                <div class="admin-title">
                    <h1><i class="fas fa-cogs"></i> Content Management</h1>
                    <p>Manage your website content dynamically</p>
                </div>
                <div class="admin-actions">
                    <button class="btn btn-outline" id="refresh-content">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="save-all-content">
                        <i class="fas fa-save"></i> Save All
                    </button>
                </div>
            </div>

            <div class="admin-tabs">
                <button class="tab-btn active" data-tab="pages">
                    <i class="fas fa-file-alt"></i> Pages
                </button>
                <button class="tab-btn" data-tab="news">
                    <i class="fas fa-newspaper"></i> News
                </button>
                <button class="tab-btn" data-tab="events">
                    <i class="fas fa-calendar"></i> Events
                </button>
                <button class="tab-btn" data-tab="leadership">
                    <i class="fas fa-users"></i> Leadership
                </button>
                <button class="tab-btn" data-tab="gallery">
                    <i class="fas fa-images"></i> Gallery
                </button>
                <button class="tab-btn" data-tab="settings">
                    <i class="fas fa-cog"></i> Settings
                </button>
            </div>

            <div class="admin-content-area">
                <div class="tab-content active" id="pages-tab">
                    <div class="content-section">
                        <h2>Page Content Management</h2>
                        <div class="page-selector">
                            <select id="page-selector">
                                <option value="homepage">Homepage</option>
                                <option value="about">About Us</option>
                                <option value="services">Services</option>
                                <option value="contact">Contact</option>
                            </select>
                        </div>
                        <div id="page-editor" class="page-editor">
                            <!-- Page content will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="news-tab">
                    <div class="content-section">
                        <div class="section-header">
                            <h2>News Management</h2>
                            <button class="btn btn-primary" id="add-news-btn">
                                <i class="fas fa-plus"></i> Add News Article
                            </button>
                        </div>
                        <div id="news-list" class="content-list">
                            <!-- News articles will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="events-tab">
                    <div class="content-section">
                        <div class="section-header">
                            <h2>Events Management</h2>
                            <button class="btn btn-primary" id="add-event-btn">
                                <i class="fas fa-plus"></i> Add Event
                            </button>
                        </div>
                        <div id="events-list" class="content-list">
                            <!-- Events will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="leadership-tab">
                    <div class="content-section">
                        <div class="section-header">
                            <h2>Leadership Management</h2>
                            <button class="btn btn-primary" id="add-leadership-btn">
                                <i class="fas fa-plus"></i> Add Member
                            </button>
                        </div>
                        <div id="leadership-list" class="content-list">
                            <!-- Leadership team will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="gallery-tab">
                    <div class="content-section">
                        <div class="section-header">
                            <h2>Gallery Management</h2>
                            <button class="btn btn-primary" id="upload-image-btn">
                                <i class="fas fa-upload"></i> Upload Image
                            </button>
                        </div>
                        <div id="gallery-grid" class="gallery-grid">
                            <!-- Gallery images will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="settings-tab">
                    <div class="content-section">
                        <h2>Website Settings</h2>
                        <div id="settings-form" class="settings-form">
                            <!-- Settings form will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>

            <div class="admin-status">
                <div class="status-indicator" id="connection-status">
                    <i class="fas fa-wifi"></i>
                    <span>Connected</span>
                </div>
                <div class="last-saved" id="last-saved">
                    Last saved: Never
                </div>
            </div>
        `;
    }

    createNavigationTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                
                // Remove active class from all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab
                button.classList.add('active');
                document.getElementById(`${tabName}-tab`).classList.add('active');
                
                // Load content for the active tab
                this.loadTabContent(tabName);
            });
        });
    }

    createContentForms() {
        this.createNewsForm();
        this.createEventForm();
        this.createLeadershipForm();
        this.createSettingsForm();
    }

    createNewsForm() {
        const newsForm = document.createElement('div');
        newsForm.id = 'news-form-modal';
        newsForm.className = 'modal';
        newsForm.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add/Edit News Article</h3>
                    <button class="close-btn" onclick="this.closest('.modal').style.display='none'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="news-form">
                    <div class="form-group">
                        <label for="news-title">Title</label>
                        <input type="text" id="news-title" required>
                    </div>
                    <div class="form-group">
                        <label for="news-excerpt">Excerpt</label>
                        <textarea id="news-excerpt" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="news-content">Content</label>
                        <textarea id="news-content" rows="10" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="news-category">Category</label>
                        <select id="news-category">
                            <option value="general">General</option>
                            <option value="academic">Academic</option>
                            <option value="events">Events</option>
                            <option value="announcements">Announcements</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="news-image">Featured Image</label>
                        <input type="file" id="news-image" accept="image/*">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal').style.display='none'">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Save Article
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(newsForm);
    }

    createEventForm() {
        const eventForm = document.createElement('div');
        eventForm.id = 'event-form-modal';
        eventForm.className = 'modal';
        eventForm.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add/Edit Event</h3>
                    <button class="close-btn" onclick="this.closest('.modal').style.display='none'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="event-form">
                    <div class="form-group">
                        <label for="event-title">Event Title</label>
                        <input type="text" id="event-title" required>
                    </div>
                    <div class="form-group">
                        <label for="event-description">Description</label>
                        <textarea id="event-description" rows="4" required></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="event-date">Event Date</label>
                            <input type="date" id="event-date" required>
                        </div>
                        <div class="form-group">
                            <label for="event-time">Event Time</label>
                            <input type="time" id="event-time" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="event-location">Location</label>
                        <input type="text" id="event-location" required>
                    </div>
                    <div class="form-group">
                        <label for="event-category">Category</label>
                        <select id="event-category">
                            <option value="academic">Academic</option>
                            <option value="cultural">Cultural</option>
                            <option value="social">Social</option>
                            <option value="sports">Sports</option>
                            <option value="community">Community Service</option>
                            <option value="career">Career Development</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="event-image">Event Image</label>
                        <input type="file" id="event-image" accept="image/*">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal').style.display='none'">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Save Event
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(eventForm);
    }

    createLeadershipForm() {
        const leadershipForm = document.createElement('div');
        leadershipForm.id = 'leadership-form-modal';
        leadershipForm.className = 'modal';
        leadershipForm.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add/Edit Leadership Member</h3>
                    <button class="close-btn" onclick="this.closest('.modal').style.display='none'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="leadership-form">
                    <div class="form-group">
                        <label for="member-name">Full Name</label>
                        <input type="text" id="member-name" required>
                    </div>
                    <div class="form-group">
                        <label for="member-position">Position</label>
                        <input type="text" id="member-position" required>
                    </div>
                    <div class="form-group">
                        <label for="member-bio">Biography</label>
                        <textarea id="member-bio" rows="4"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="member-email">Email</label>
                        <input type="email" id="member-email">
                    </div>
                    <div class="form-group">
                        <label for="member-phone">Phone</label>
                        <input type="tel" id="member-phone">
                    </div>
                    <div class="form-group">
                        <label for="member-photo">Photo</label>
                        <input type="file" id="member-photo" accept="image/*">
                    </div>
                    <div class="form-group">
                        <label for="member-order">Display Order</label>
                        <input type="number" id="member-order" min="1" value="1">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal').style.display='none'">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Save Member
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(leadershipForm);
    }

    createSettingsForm() {
        const settingsForm = document.getElementById('settings-form');
        if (!settingsForm) return;

        settingsForm.innerHTML = `
            <form id="website-settings-form">
                <div class="settings-section">
                    <h3>General Settings</h3>
                    <div class="form-group">
                        <label for="site-title">Site Title</label>
                        <input type="text" id="site-title" value="Madi Makerere Students Association">
                    </div>
                    <div class="form-group">
                        <label for="site-description">Site Description</label>
                        <textarea id="site-description" rows="3">Connecting students, fostering community, and promoting excellence in education and leadership.</textarea>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>Contact Information</h3>
                    <div class="form-group">
                        <label for="contact-email">Contact Email</label>
                        <input type="email" id="contact-email">
                    </div>
                    <div class="form-group">
                        <label for="contact-phone">Contact Phone</label>
                        <input type="tel" id="contact-phone">
                    </div>
                    <div class="form-group">
                        <label for="office-location">Office Location</label>
                        <input type="text" id="office-location">
                    </div>
                </div>

                <div class="settings-section">
                    <h3>Social Media</h3>
                    <div class="form-group">
                        <label for="facebook-url">Facebook URL</label>
                        <input type="url" id="facebook-url">
                    </div>
                    <div class="form-group">
                        <label for="twitter-url">Twitter URL</label>
                        <input type="url" id="twitter-url">
                    </div>
                    <div class="form-group">
                        <label for="instagram-url">Instagram URL</label>
                        <input type="url" id="instagram-url">
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Save Settings
                    </button>
                </div>
            </form>
        `;
    }

    setupEventListeners() {
        // Refresh content button
        document.getElementById('refresh-content')?.addEventListener('click', () => {
            this.loadContent();
        });

        // Save all content button
        document.getElementById('save-all-content')?.addEventListener('click', () => {
            this.saveAllContent();
        });

        // Add content buttons
        document.getElementById('add-news-btn')?.addEventListener('click', () => {
            this.showNewsForm();
        });

        document.getElementById('add-event-btn')?.addEventListener('click', () => {
            this.showEventForm();
        });

        document.getElementById('add-leadership-btn')?.addEventListener('click', () => {
            this.showLeadershipForm();
        });

        document.getElementById('upload-image-btn')?.addEventListener('click', () => {
            this.showImageUpload();
        });

        // Form submissions
        document.getElementById('news-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewsSubmit();
        });

        document.getElementById('event-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEventSubmit();
        });

        document.getElementById('leadership-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLeadershipSubmit();
        });

        document.getElementById('website-settings-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSettingsSubmit();
        });

        // Page selector
        document.getElementById('page-selector')?.addEventListener('change', (e) => {
            this.loadPageContent(e.target.value);
        });
    }

    async loadContent() {
        try {
            this.showLoading('Loading content...');
            
            // Load all content types
            await Promise.all([
                this.loadNews(),
                this.loadEvents(),
                this.loadLeadership(),
                this.loadGallery(),
                this.loadSettings()
            ]);

            this.hideLoading();
            this.showSuccess('Content loaded successfully');
        } catch (error) {
            console.error('Error loading content:', error);
            this.showError('Failed to load content');
        }
    }

    async loadTabContent(tabName) {
        switch (tabName) {
            case 'pages':
                this.loadPageContent('homepage');
                break;
            case 'news':
                await this.loadNews();
                break;
            case 'events':
                await this.loadEvents();
                break;
            case 'leadership':
                await this.loadLeadership();
                break;
            case 'gallery':
                await this.loadGallery();
                break;
            case 'settings':
                await this.loadSettings();
                break;
        }
    }

    async loadNews() {
        try {
            const result = await contentService.getNewsArticles();
            if (result.success) {
                this.displayNewsList(result.data);
            } else {
                this.showError('Failed to load news articles');
            }
        } catch (error) {
            console.error('Error loading news:', error);
            this.showError('Failed to load news articles');
        }
    }

    async loadEvents() {
        try {
            const result = await contentService.getEvents();
            if (result.success) {
                this.displayEventsList(result.data);
            } else {
                this.showError('Failed to load events');
            }
        } catch (error) {
            console.error('Error loading events:', error);
            this.showError('Failed to load events');
        }
    }

    async loadLeadership() {
        try {
            const result = await contentService.getLeadershipTeam();
            if (result.success) {
                this.displayLeadershipList(result.data);
            } else {
                this.showError('Failed to load leadership team');
            }
        } catch (error) {
            console.error('Error loading leadership:', error);
            this.showError('Failed to load leadership team');
        }
    }

    async loadGallery() {
        try {
            const result = await contentService.getGalleryImages();
            if (result.success) {
                this.displayGalleryGrid(result.data);
            } else {
                this.showError('Failed to load gallery images');
            }
        } catch (error) {
            console.error('Error loading gallery:', error);
            this.showError('Failed to load gallery images');
        }
    }

    async loadSettings() {
        // Load settings from localStorage or Firebase
        const settings = this.getStoredSettings();
        this.populateSettingsForm(settings);
    }

    displayNewsList(news) {
        const newsList = document.getElementById('news-list');
        if (!newsList) return;

        if (news.length === 0) {
            newsList.innerHTML = '<div class="empty-state">No news articles found</div>';
            return;
        }

        newsList.innerHTML = news.map(article => `
            <div class="content-item" data-id="${article.id}">
                <div class="content-preview">
                    <h3>${article.title}</h3>
                    <p>${article.excerpt || 'No excerpt available'}</p>
                    <div class="content-meta">
                        <span class="category">${article.category || 'General'}</span>
                        <span class="date">${this.formatDate(article.createdAt)}</span>
                        <span class="status ${article.published ? 'published' : 'draft'}">
                            ${article.published ? 'Published' : 'Draft'}
                        </span>
                    </div>
                </div>
                <div class="content-actions">
                    <button class="btn btn-sm btn-outline" onclick="adminContentManager.editNews('${article.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="adminContentManager.publishNews('${article.id}')">
                        <i class="fas fa-eye"></i> Publish
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminContentManager.deleteNews('${article.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    displayEventsList(events) {
        const eventsList = document.getElementById('events-list');
        if (!eventsList) return;

        if (events.length === 0) {
            eventsList.innerHTML = '<div class="empty-state">No events found</div>';
            return;
        }

        eventsList.innerHTML = events.map(event => `
            <div class="content-item" data-id="${event.id}">
                <div class="content-preview">
                    <h3>${event.title}</h3>
                    <p>${event.description}</p>
                    <div class="content-meta">
                        <span class="date">${this.formatDate(event.eventDate)}</span>
                        <span class="location">${event.location}</span>
                        <span class="category">${event.category}</span>
                    </div>
                </div>
                <div class="content-actions">
                    <button class="btn btn-sm btn-outline" onclick="adminContentManager.editEvent('${event.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminContentManager.deleteEvent('${event.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    displayLeadershipList(leadership) {
        const leadershipList = document.getElementById('leadership-list');
        if (!leadershipList) return;

        if (leadership.length === 0) {
            leadershipList.innerHTML = '<div class="empty-state">No leadership members found</div>';
            return;
        }

        leadershipList.innerHTML = leadership.map(member => `
            <div class="content-item" data-id="${member.id}">
                <div class="content-preview">
                    <div class="member-photo">
                        <img src="${member.photo || 'images/placeholder-avatar.jpg'}" alt="${member.name}">
                    </div>
                    <div class="member-info">
                        <h3>${member.name}</h3>
                        <p class="position">${member.position}</p>
                        <p class="bio">${member.bio || 'No biography available'}</p>
                    </div>
                </div>
                <div class="content-actions">
                    <button class="btn btn-sm btn-outline" onclick="adminContentManager.editLeadership('${member.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminContentManager.deleteLeadership('${member.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    displayGalleryGrid(images) {
        const galleryGrid = document.getElementById('gallery-grid');
        if (!galleryGrid) return;

        if (images.length === 0) {
            galleryGrid.innerHTML = '<div class="empty-state">No images found</div>';
            return;
        }

        galleryGrid.innerHTML = images.map(image => `
            <div class="gallery-item" data-id="${image.id}">
                <img src="${image.url}" alt="${image.caption || 'Gallery image'}">
                <div class="gallery-overlay">
                    <div class="gallery-actions">
                        <button class="btn btn-sm btn-outline" onclick="adminContentManager.editImage('${image.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminContentManager.deleteImage('${image.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Form handling methods
    showNewsForm(articleId = null) {
        const modal = document.getElementById('news-form-modal');
        if (modal) {
            modal.style.display = 'flex';
            if (articleId) {
                this.populateNewsForm(articleId);
            } else {
                this.clearNewsForm();
            }
        }
    }

    showEventForm(eventId = null) {
        const modal = document.getElementById('event-form-modal');
        if (modal) {
            modal.style.display = 'flex';
            if (eventId) {
                this.populateEventForm(eventId);
            } else {
                this.clearEventForm();
            }
        }
    }

    showLeadershipForm(memberId = null) {
        const modal = document.getElementById('leadership-form-modal');
        if (modal) {
            modal.style.display = 'flex';
            if (memberId) {
                this.populateLeadershipForm(memberId);
            } else {
                this.clearLeadershipForm();
            }
        }
    }

    async handleNewsSubmit() {
        try {
            const formData = this.getNewsFormData();
            const validation = contentService.validateContent(formData, 'news');
            
            if (!validation.isValid) {
                this.showError(validation.errors.join(', '));
                return;
            }

            this.showLoading('Saving news article...');
            
            const result = await contentService.createNewsArticle(formData);
            if (result.success) {
                this.showSuccess('News article saved successfully');
                this.hideModal('news-form-modal');
                this.loadNews();
            } else {
                this.showError('Failed to save news article');
            }
        } catch (error) {
            console.error('Error saving news article:', error);
            this.showError('Failed to save news article');
        } finally {
            this.hideLoading();
        }
    }

    async handleEventSubmit() {
        try {
            const formData = this.getEventFormData();
            const validation = contentService.validateContent(formData, 'event');
            
            if (!validation.isValid) {
                this.showError(validation.errors.join(', '));
                return;
            }

            this.showLoading('Saving event...');
            
            const result = await contentService.createEvent(formData);
            if (result.success) {
                this.showSuccess('Event saved successfully');
                this.hideModal('event-form-modal');
                this.loadEvents();
            } else {
                this.showError('Failed to save event');
            }
        } catch (error) {
            console.error('Error saving event:', error);
            this.showError('Failed to save event');
        } finally {
            this.hideLoading();
        }
    }

    async handleLeadershipSubmit() {
        try {
            const formData = this.getLeadershipFormData();
            const validation = contentService.validateContent(formData, 'leadership');
            
            if (!validation.isValid) {
                this.showError(validation.errors.join(', '));
                return;
            }

            this.showLoading('Saving leadership member...');
            
            const result = await contentService.createDocument(COLLECTIONS.LEADERSHIP, formData);
            if (result.success) {
                this.showSuccess('Leadership member saved successfully');
                this.hideModal('leadership-form-modal');
                this.loadLeadership();
            } else {
                this.showError('Failed to save leadership member');
            }
        } catch (error) {
            console.error('Error saving leadership member:', error);
            this.showError('Failed to save leadership member');
        } finally {
            this.hideLoading();
        }
    }

    async handleSettingsSubmit() {
        try {
            const settings = this.getSettingsFormData();
            this.showLoading('Saving settings...');
            
            // Save to localStorage for now
            localStorage.setItem('website-settings', JSON.stringify(settings));
            
            this.showSuccess('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showError('Failed to save settings');
        } finally {
            this.hideLoading();
        }
    }

    // Utility methods
    getNewsFormData() {
        return {
            title: document.getElementById('news-title').value,
            excerpt: document.getElementById('news-excerpt').value,
            content: document.getElementById('news-content').value,
            category: document.getElementById('news-category').value,
            image: document.getElementById('news-image').files[0]
        };
    }

    getEventFormData() {
        return {
            title: document.getElementById('event-title').value,
            description: document.getElementById('event-description').value,
            eventDate: document.getElementById('event-date').value,
            eventTime: document.getElementById('event-time').value,
            location: document.getElementById('event-location').value,
            category: document.getElementById('event-category').value,
            image: document.getElementById('event-image').files[0]
        };
    }

    getLeadershipFormData() {
        return {
            name: document.getElementById('member-name').value,
            position: document.getElementById('member-position').value,
            bio: document.getElementById('member-bio').value,
            email: document.getElementById('member-email').value,
            phone: document.getElementById('member-phone').value,
            photo: document.getElementById('member-photo').files[0],
            order: parseInt(document.getElementById('member-order').value)
        };
    }

    getSettingsFormData() {
        return {
            siteTitle: document.getElementById('site-title').value,
            siteDescription: document.getElementById('site-description').value,
            contactEmail: document.getElementById('contact-email').value,
            contactPhone: document.getElementById('contact-phone').value,
            officeLocation: document.getElementById('office-location').value,
            facebookUrl: document.getElementById('facebook-url').value,
            twitterUrl: document.getElementById('twitter-url').value,
            instagramUrl: document.getElementById('instagram-url').value
        };
    }

    getStoredSettings() {
        const stored = localStorage.getItem('website-settings');
        return stored ? JSON.parse(stored) : {};
    }

    populateSettingsForm(settings) {
        Object.keys(settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = settings[key] || '';
            }
        });
    }

    formatDate(timestamp) {
        if (!timestamp) return 'No date';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showLoading(message = 'Loading...') {
        // Create or update loading indicator
        let loading = document.getElementById('loading-indicator');
        if (!loading) {
            loading = document.createElement('div');
            loading.id = 'loading-indicator';
            loading.className = 'loading-indicator';
            document.body.appendChild(loading);
        }
        loading.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        loading.style.display = 'flex';
    }

    hideLoading() {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }
}

// Initialize admin content manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminContentManager = new AdminContentManager();
});

export default AdminContentManager;
