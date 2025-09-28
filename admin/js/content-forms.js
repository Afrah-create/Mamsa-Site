// Content Forms for CRUD Operations

class ContentForms {
    constructor() {
        this.supabase = window.supabaseClient;
        this.dbConfig = window.dbConfig;
    }

    // News Form Modal
    showNewsForm(articleId = null) {
        const modal = this.createModal('news', articleId);
        document.body.appendChild(modal);
        this.loadNewsForm(articleId);
    }

    async loadNewsForm(articleId) {
        const form = document.getElementById('content-form');
        if (!form) return;

        if (articleId) {
            try {
                const { data: article, error } = await this.supabase
                    .from(this.dbConfig.tables.news)
                    .select('*')
                    .eq('id', articleId)
                    .single();

                if (error) throw error;

                // Populate form with existing data
                this.populateNewsForm(article);
            } catch (error) {
                console.error('Error loading news article:', error);
                this.showNotification('Failed to load article data', 'error');
            }
        }
    }

    populateNewsForm(article) {
        const form = document.getElementById('content-form');
        if (!form) return;

        form.querySelector('#title').value = article.title || '';
        form.querySelector('#excerpt').value = article.excerpt || '';
        form.querySelector('#content').value = article.content || '';
        form.querySelector('#category').value = article.category || 'announcements';
        form.querySelector('#date').value = article.date || '';
        form.querySelector('#author').value = article.author || '';
        form.querySelector('#featured').checked = article.featured || false;
        
        if (article.tags && Array.isArray(article.tags)) {
            form.querySelector('#tags').value = article.tags.join(', ');
        }

        // Update form title
        const formTitle = form.querySelector('.form-title');
        if (formTitle) {
            formTitle.textContent = 'Edit News Article';
        }
    }

    createNewsFormHTML() {
        return `
            <div class="form-group">
                <label for="title">Title *</label>
                <input type="text" id="title" name="title" required placeholder="Enter article title">
            </div>

            <div class="form-group">
                <label for="excerpt">Excerpt</label>
                <textarea id="excerpt" name="excerpt" rows="3" placeholder="Brief description of the article"></textarea>
            </div>

            <div class="form-group">
                <label for="content">Content *</label>
                <textarea id="content" name="content" rows="8" required placeholder="Article content"></textarea>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="category">Category *</label>
                    <select id="category" name="category" required>
                        <option value="announcements">Announcements</option>
                        <option value="cultural">Cultural</option>
                        <option value="academics">Academics</option>
                        <option value="sports">Sports</option>
                        <option value="community">Community</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="date">Date *</label>
                    <input type="date" id="date" name="date" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="author">Author *</label>
                    <input type="text" id="author" name="author" required placeholder="Author name">
                </div>

                <div class="form-group">
                    <label for="tags">Tags</label>
                    <input type="text" id="tags" name="tags" placeholder="tag1, tag2, tag3">
                </div>
            </div>

            <div class="form-group">
                <label for="image">Featured Image</label>
                <div class="file-upload">
                    <input type="file" id="image" name="image" accept="image/*">
                    <div class="file-upload-display">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Click to upload image</span>
                    </div>
                </div>
                <div class="image-preview" id="image-preview"></div>
            </div>

            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="featured" name="featured">
                    <span class="checkmark"></span>
                    Featured Article
                </label>
            </div>
        `;
    }

    // Events Form Modal
    showEventsForm(eventId = null) {
        const modal = this.createModal('events', eventId);
        document.body.appendChild(modal);
        this.loadEventsForm(eventId);
    }

    async loadEventsForm(eventId) {
        const form = document.getElementById('content-form');
        if (!form) return;

        if (eventId) {
            try {
                const { data: event, error } = await this.supabase
                    .from(this.dbConfig.tables.events)
                    .select('*')
                    .eq('id', eventId)
                    .single();

                if (error) throw error;

                this.populateEventsForm(event);
            } catch (error) {
                console.error('Error loading event:', error);
                this.showNotification('Failed to load event data', 'error');
            }
        }
    }

    populateEventsForm(event) {
        const form = document.getElementById('content-form');
        if (!form) return;

        form.querySelector('#title').value = event.title || '';
        form.querySelector('#description').value = event.description || '';
        form.querySelector('#date').value = event.date || '';
        form.querySelector('#time').value = event.time || '';
        form.querySelector('#location').value = event.location || '';
        form.querySelector('#category').value = event.category || 'social';
        form.querySelector('#status').value = event.status || 'upcoming';
        form.querySelector('#registration_required').checked = event.registration_required || false;
        form.querySelector('#max_participants').value = event.max_participants || '';
        form.querySelector('#contact_person').value = event.contact_person || '';
        form.querySelector('#contact_email').value = event.contact_email || '';
        form.querySelector('#contact_phone').value = event.contact_phone || '';

        // Update form title
        const formTitle = form.querySelector('.form-title');
        if (formTitle) {
            formTitle.textContent = 'Edit Event';
        }
    }

    createEventsFormHTML() {
        return `
            <div class="form-group">
                <label for="title">Event Title *</label>
                <input type="text" id="title" name="title" required placeholder="Enter event title">
            </div>

            <div class="form-group">
                <label for="description">Description *</label>
                <textarea id="description" name="description" rows="4" required placeholder="Event description"></textarea>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="date">Date *</label>
                    <input type="date" id="date" name="date" required>
                </div>

                <div class="form-group">
                    <label for="time">Time</label>
                    <input type="time" id="time" name="time">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="location">Location</label>
                    <input type="text" id="location" name="location" placeholder="Event location">
                </div>

                <div class="form-group">
                    <label for="category">Category *</label>
                    <select id="category" name="category" required>
                        <option value="social">Social</option>
                        <option value="academic">Academic</option>
                        <option value="cultural">Cultural</option>
                        <option value="sports">Sports</option>
                        <option value="career">Career</option>
                        <option value="community">Community</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="status">Status *</label>
                    <select id="status" name="status" required>
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="past">Past</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="max_participants">Max Participants</label>
                    <input type="number" id="max_participants" name="max_participants" placeholder="Maximum number of participants">
                </div>
            </div>

            <div class="form-group">
                <label for="image">Event Image</label>
                <div class="file-upload">
                    <input type="file" id="image" name="image" accept="image/*">
                    <div class="file-upload-display">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Click to upload image</span>
                    </div>
                </div>
                <div class="image-preview" id="image-preview"></div>
            </div>

            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="registration_required" name="registration_required">
                    <span class="checkmark"></span>
                    Registration Required
                </label>
            </div>

            <div class="form-section">
                <h3>Contact Information</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="contact_person">Contact Person</label>
                        <input type="text" id="contact_person" name="contact_person" placeholder="Contact person name">
                    </div>

                    <div class="form-group">
                        <label for="contact_email">Contact Email</label>
                        <input type="email" id="contact_email" name="contact_email" placeholder="contact@example.com">
                    </div>
                </div>

                <div class="form-group">
                    <label for="contact_phone">Contact Phone</label>
                    <input type="tel" id="contact_phone" name="contact_phone" placeholder="+256 700 000 000">
                </div>
            </div>
        `;
    }

    // Leadership Form Modal
    showLeadershipForm(memberId = null) {
        const modal = this.createModal('leadership', memberId);
        document.body.appendChild(modal);
        this.loadLeadershipForm(memberId);
    }

    async loadLeadershipForm(memberId) {
        const form = document.getElementById('content-form');
        if (!form) return;

        if (memberId) {
            try {
                const { data: member, error } = await this.supabase
                    .from(this.dbConfig.tables.leadership)
                    .select('*')
                    .eq('id', memberId)
                    .single();

                if (error) throw error;

                this.populateLeadershipForm(member);
            } catch (error) {
                console.error('Error loading leadership member:', error);
                this.showNotification('Failed to load member data', 'error');
            }
        }
    }

    populateLeadershipForm(member) {
        const form = document.getElementById('content-form');
        if (!form) return;

        form.querySelector('#name').value = member.name || '';
        form.querySelector('#position').value = member.position || '';
        form.querySelector('#department').value = member.department || '';
        form.querySelector('#email').value = member.email || '';
        form.querySelector('#phone').value = member.phone || '';
        form.querySelector('#bio').value = member.bio || '';
        form.querySelector('#year').value = member.year || '';
        form.querySelector('#course').value = member.course || '';

        if (member.social_media) {
            form.querySelector('#facebook').value = member.social_media.facebook || '';
            form.querySelector('#twitter').value = member.social_media.twitter || '';
            form.querySelector('#linkedin').value = member.social_media.linkedin || '';
        }

        // Update form title
        const formTitle = form.querySelector('.form-title');
        if (formTitle) {
            formTitle.textContent = 'Edit Leadership Member';
        }
    }

    createLeadershipFormHTML() {
        return `
            <div class="form-group">
                <label for="name">Full Name *</label>
                <input type="text" id="name" name="name" required placeholder="Enter full name">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="position">Position *</label>
                    <input type="text" id="position" name="position" required placeholder="e.g., President">
                </div>

                <div class="form-group">
                    <label for="department">Department *</label>
                    <input type="text" id="department" name="department" required placeholder="e.g., Executive">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="year">Academic Year</label>
                    <input type="text" id="year" name="year" placeholder="e.g., Year 3">
                </div>

                <div class="form-group">
                    <label for="course">Course</label>
                    <input type="text" id="course" name="course" placeholder="e.g., Computer Science">
                </div>
            </div>

            <div class="form-group">
                <label for="bio">Biography</label>
                <textarea id="bio" name="bio" rows="4" placeholder="Brief biography"></textarea>
            </div>

            <div class="form-group">
                <label for="image">Profile Photo</label>
                <div class="file-upload">
                    <input type="file" id="image" name="image" accept="image/*">
                    <div class="file-upload-display">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Click to upload photo</span>
                    </div>
                </div>
                <div class="image-preview" id="image-preview"></div>
            </div>

            <div class="form-section">
                <h3>Contact Information</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" placeholder="email@example.com">
                    </div>

                    <div class="form-group">
                        <label for="phone">Phone</label>
                        <input type="tel" id="phone" name="phone" placeholder="+256 700 000 000">
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3>Social Media</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="facebook">Facebook</label>
                        <input type="text" id="facebook" name="facebook" placeholder="Facebook username">
                    </div>

                    <div class="form-group">
                        <label for="twitter">Twitter</label>
                        <input type="text" id="twitter" name="twitter" placeholder="@username">
                    </div>
                </div>

                <div class="form-group">
                    <label for="linkedin">LinkedIn</label>
                    <input type="text" id="linkedin" name="linkedin" placeholder="LinkedIn profile">
                </div>
            </div>
        `;
    }

    // Gallery Form Modal
    showGalleryForm(itemId = null) {
        const modal = this.createModal('gallery', itemId);
        document.body.appendChild(modal);
        this.loadGalleryForm(itemId);
    }

    async loadGalleryForm(itemId) {
        const form = document.getElementById('content-form');
        if (!form) return;

        if (itemId) {
            try {
                const { data: item, error } = await this.supabase
                    .from(this.dbConfig.tables.gallery)
                    .select('*')
                    .eq('id', itemId)
                    .single();

                if (error) throw error;

                this.populateGalleryForm(item);
            } catch (error) {
                console.error('Error loading gallery item:', error);
                this.showNotification('Failed to load gallery item data', 'error');
            }
        }
    }

    populateGalleryForm(item) {
        const form = document.getElementById('content-form');
        if (!form) return;

        form.querySelector('#title').value = item.title || '';
        form.querySelector('#description').value = item.description || '';
        form.querySelector('#category').value = item.category || 'campus';
        form.querySelector('#date').value = item.date || '';
        form.querySelector('#photographer').value = item.photographer || '';
        form.querySelector('#featured').checked = item.featured || false;
        
        if (item.tags && Array.isArray(item.tags)) {
            form.querySelector('#tags').value = item.tags.join(', ');
        }

        // Update form title
        const formTitle = form.querySelector('.form-title');
        if (formTitle) {
            formTitle.textContent = 'Edit Gallery Item';
        }
    }

    createGalleryFormHTML() {
        return `
            <div class="form-group">
                <label for="title">Title *</label>
                <input type="text" id="title" name="title" required placeholder="Enter image title">
            </div>

            <div class="form-group">
                <label for="description">Description</label>
                <textarea id="description" name="description" rows="3" placeholder="Image description"></textarea>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="category">Category *</label>
                    <select id="category" name="category" required>
                        <option value="cultural">Cultural</option>
                        <option value="academic">Academic</option>
                        <option value="sports">Sports</option>
                        <option value="leadership">Leadership</option>
                        <option value="community">Community</option>
                        <option value="campus">Campus</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="date">Date *</label>
                    <input type="date" id="date" name="date" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="photographer">Photographer</label>
                    <input type="text" id="photographer" name="photographer" placeholder="Photographer name">
                </div>

                <div class="form-group">
                    <label for="tags">Tags</label>
                    <input type="text" id="tags" name="tags" placeholder="tag1, tag2, tag3">
                </div>
            </div>

            <div class="form-group">
                <label for="image">Image *</label>
                <div class="file-upload">
                    <input type="file" id="image" name="image" accept="image/*" required>
                    <div class="file-upload-display">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Click to upload image</span>
                    </div>
                </div>
                <div class="image-preview" id="image-preview"></div>
            </div>

            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="featured" name="featured">
                    <span class="checkmark"></span>
                    Featured Image
                </label>
            </div>
        `;
    }

    // Services Form Modal
    showServiceForm(serviceId = null) {
        const modal = this.createModal('services', serviceId);
        document.body.appendChild(modal);
        this.loadServiceForm(serviceId);
    }

    async loadServiceForm(serviceId) {
        const form = document.getElementById('content-form');
        if (!form) return;

        if (serviceId) {
            try {
                const { data: service, error } = await this.supabase
                    .from(this.dbConfig.tables.services)
                    .select('*')
                    .eq('id', serviceId)
                    .single();

                if (error) throw error;

                this.populateServiceForm(service);
            } catch (error) {
                console.error('Error loading service:', error);
                this.showNotification('Failed to load service data', 'error');
            }
        }
    }

    populateServiceForm(service) {
        const form = document.getElementById('content-form');
        if (!form) return;

        form.querySelector('#service-key').value = service.service_key || '';
        form.querySelector('#title').value = service.title || '';
        form.querySelector('#description').value = service.description || '';
        
        if (service.features && Array.isArray(service.features)) {
            form.querySelector('#features').value = service.features.join('\n');
        }

        // Update form title
        const formTitle = form.querySelector('.form-title');
        if (formTitle) {
            formTitle.textContent = 'Edit Service';
        }
    }

    createServicesFormHTML() {
        return `
            <div class="form-group">
                <label for="service-key">Service Key *</label>
                <input type="text" id="service-key" name="service_key" required placeholder="e.g., academicSupport">
            </div>

            <div class="form-group">
                <label for="title">Service Title *</label>
                <input type="text" id="title" name="title" required placeholder="Enter service title">
            </div>

            <div class="form-group">
                <label for="description">Description *</label>
                <textarea id="description" name="description" rows="4" required placeholder="Service description"></textarea>
            </div>

            <div class="form-group">
                <label for="features">Features (one per line)</label>
                <textarea id="features" name="features" rows="6" placeholder="Feature 1&#10;Feature 2&#10;Feature 3"></textarea>
            </div>
        `;
    }

    // Generic Modal Creation
    createModal(contentType, itemId = null) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="form-title">${itemId ? 'Edit' : 'Add'} ${this.getContentTypeTitle(contentType)}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form class="content-form" id="content-form">
                    <div class="form-body">
                        ${this.getFormHTML(contentType)}
                    </div>
                    <div class="form-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ${itemId ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Add form submission handler
        const form = modal.querySelector('#content-form');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e, contentType, itemId));

        // Add file upload handlers
        this.setupFileUploadHandlers(modal);

        return modal;
    }

    getContentTypeTitle(contentType) {
        const titles = {
            news: 'News Article',
            events: 'Event',
            leadership: 'Leadership Member',
            gallery: 'Gallery Item',
            services: 'Service'
        };
        return titles[contentType] || 'Item';
    }

    getFormHTML(contentType) {
        switch (contentType) {
            case 'news':
                return this.createNewsFormHTML();
            case 'events':
                return this.createEventsFormHTML();
            case 'leadership':
                return this.createLeadershipFormHTML();
            case 'gallery':
                return this.createGalleryFormHTML();
            case 'services':
                return this.createServicesFormHTML();
            default:
                return '<p>Form not available</p>';
        }
    }

    setupFileUploadHandlers(modal) {
        const fileInputs = modal.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => this.handleFileUpload(e));
        });
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        const preview = event.target.parentElement.parentElement.querySelector('.image-preview');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                `;
            };
            reader.readAsDataURL(file);
        }
    }

    async handleFormSubmit(event, contentType, itemId) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Show loading state
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;

        try {
            // Use file upload handler for form data processing
            const data = await window.fileUploadHandler.handleFormWithFileUpload(formData, contentType, itemId);
            
            // Update content in database
            const result = await window.fileUploadHandler.updateContentWithImage(
                this.dbConfig.tables[contentType], 
                data, 
                itemId
            );
            
            this.showNotification(`${this.getContentTypeTitle(contentType)} ${result.action} successfully`, 'success');

            // Close modal and refresh content
            form.closest('.modal-overlay').remove();
            
            // Refresh the current page content
            if (window.adminContentManager) {
                await window.adminContentManager.loadPage(window.adminContentManager.currentPage);
            }

        } catch (error) {
            console.error(`Error ${itemId ? 'updating' : 'creating'} ${contentType}:`, error);
            this.showNotification(`Failed to ${itemId ? 'update' : 'create'} ${this.getContentTypeTitle(contentType)}: ${error.message}`, 'error');
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    prepareFormData(formData, contentType) {
        const data = {};
        
        // Common fields
        for (let [key, value] of formData.entries()) {
            if (key === 'image') continue; // Handle file uploads separately
            
            if (key === 'tags' && value) {
                data[key] = value.split(',').map(tag => tag.trim()).filter(tag => tag);
            } else if (key === 'featured' || key === 'registration_required') {
                data[key] = formData.has(key);
            } else if (value) {
                data[key] = value;
            }
        }

        // Handle special cases
        if (contentType === 'leadership' && (data.facebook || data.twitter || data.linkedin)) {
            data.social_media = {
                facebook: data.facebook || '',
                twitter: data.twitter || '',
                linkedin: data.linkedin || ''
            };
            delete data.facebook;
            delete data.twitter;
            delete data.linkedin;
        }

        if (contentType === 'services' && data.features) {
            data.features = data.features.split('\n').filter(feature => feature.trim());
        }

        return data;
    }

    showNotification(message, type = 'info') {
        if (window.adminContentManager) {
            window.adminContentManager.showNotification(message, type);
        }
    }
}

// Initialize content forms
window.contentForms = new ContentForms();
