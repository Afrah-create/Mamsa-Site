// Content Synchronization Service
import { contentService } from './firebase-content-service.js';
import { authService } from './auth-service.js';

class ContentSynchronizer {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.lastSyncTime = null;
        this.setupOnlineListener();
        this.setupRealtimeListeners();
    }

    setupOnlineListener() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Connection restored - syncing pending changes');
            this.processSyncQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Connection lost - queuing changes');
        });
    }

    setupRealtimeListeners() {
        // Listen for content changes in real-time
        this.setupNewsListener();
        this.setupEventsListener();
        this.setupLeadershipListener();
        this.setupGalleryListener();
    }

    setupNewsListener() {
        contentService.setupRealtimeListener('news', (result) => {
            if (result.success) {
                this.updateLocalContent('news', result.data);
                this.notifyContentChange('news', result.data);
            }
        });
    }

    setupEventsListener() {
        contentService.setupRealtimeListener('events', (result) => {
            if (result.success) {
                this.updateLocalContent('events', result.data);
                this.notifyContentChange('events', result.data);
            }
        });
    }

    setupLeadershipListener() {
        contentService.setupRealtimeListener('leadership', (result) => {
            if (result.success) {
                this.updateLocalContent('leadership', result.data);
                this.notifyContentChange('leadership', result.data);
            }
        });
    }

    setupGalleryListener() {
        contentService.setupRealtimeListener('gallery', (result) => {
            if (result.success) {
                this.updateLocalContent('gallery', result.data);
                this.notifyContentChange('gallery', result.data);
            }
        });
    }

    updateLocalContent(type, data) {
        try {
            const currentData = JSON.parse(localStorage.getItem('contentData') || '{}');
            currentData[type] = data;
            localStorage.setItem('contentData', JSON.stringify(currentData));
            
            // Update last sync time
            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('lastSyncTime', this.lastSyncTime);
            
            console.log(`Content synchronized: ${type}`);
        } catch (error) {
            console.error('Error updating local content:', error);
        }
    }

    notifyContentChange(type, data) {
        // Dispatch custom event for content changes
        const event = new CustomEvent('contentUpdated', {
            detail: { type, data }
        });
        window.dispatchEvent(event);
    }

    async syncAllContent() {
        try {
            console.log('Starting full content synchronization...');
            
            const [newsResult, eventsResult, leadershipResult, galleryResult] = await Promise.all([
                contentService.getNewsArticles(1000),
                contentService.getEvents(1000),
                contentService.getLeadershipTeam(),
                contentService.getGalleryImages(1000)
            ]);

            const contentData = {
                news: newsResult.success ? newsResult.data : [],
                events: eventsResult.success ? eventsResult.data : [],
                leadership: leadershipResult.success ? leadershipResult.data : [],
                gallery: galleryResult.success ? galleryResult.data : [],
                lastSync: new Date().toISOString()
            };

            localStorage.setItem('contentData', JSON.stringify(contentData));
            this.lastSyncTime = contentData.lastSync;
            localStorage.setItem('lastSyncTime', this.lastSyncTime);

            console.log('Full content synchronization completed');
            return { success: true, data: contentData };
        } catch (error) {
            console.error('Error syncing content:', error);
            return { success: false, error: error.message };
        }
    }

    async syncContentType(type) {
        try {
            let result;
            switch (type) {
                case 'news':
                    result = await contentService.getNewsArticles(1000);
                    break;
                case 'events':
                    result = await contentService.getEvents(1000);
                    break;
                case 'leadership':
                    result = await contentService.getLeadershipTeam();
                    break;
                case 'gallery':
                    result = await contentService.getGalleryImages(1000);
                    break;
                default:
                    throw new Error(`Unknown content type: ${type}`);
            }

            if (result.success) {
                this.updateLocalContent(type, result.data);
                return { success: true, data: result.data };
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error(`Error syncing ${type}:`, error);
            return { success: false, error: error.message };
        }
    }

    queueSyncOperation(operation) {
        this.syncQueue.push({
            ...operation,
            timestamp: new Date().toISOString(),
            retries: 0
        });
        
        if (this.isOnline) {
            this.processSyncQueue();
        }
    }

    async processSyncQueue() {
        if (!this.isOnline || this.syncQueue.length === 0) {
            return;
        }

        const operations = [...this.syncQueue];
        this.syncQueue = [];

        for (const operation of operations) {
            try {
                await this.executeSyncOperation(operation);
            } catch (error) {
                console.error('Sync operation failed:', error);
                
                // Retry logic
                if (operation.retries < 3) {
                    operation.retries++;
                    this.syncQueue.push(operation);
                }
            }
        }
    }

    async executeSyncOperation(operation) {
        switch (operation.type) {
            case 'create':
                await contentService.createDocument(operation.collection, operation.data);
                break;
            case 'update':
                await contentService.updateDocument(operation.collection, operation.id, operation.data);
                break;
            case 'delete':
                await contentService.deleteDocument(operation.collection, operation.id);
                break;
            default:
                throw new Error(`Unknown operation type: ${operation.type}`);
        }
    }

    getLastSyncTime() {
        return this.lastSyncTime || localStorage.getItem('lastSyncTime');
    }

    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            lastSync: this.getLastSyncTime(),
            pendingOperations: this.syncQueue.length,
            hasUnsyncedChanges: this.syncQueue.length > 0
        };
    }

    // Content update methods for public website
    async updateNewsOnWebsite() {
        try {
            const result = await contentService.getNewsArticles(10);
            if (result.success) {
                this.updateNewsSection(result.data);
            }
        } catch (error) {
            console.error('Error updating news on website:', error);
        }
    }

    async updateEventsOnWebsite() {
        try {
            const result = await contentService.getEvents(10);
            if (result.success) {
                this.updateEventsSection(result.data);
            }
        } catch (error) {
            console.error('Error updating events on website:', error);
        }
    }

    async updateLeadershipOnWebsite() {
        try {
            const result = await contentService.getLeadershipTeam();
            if (result.success) {
                this.updateLeadershipSection(result.data);
            }
        } catch (error) {
            console.error('Error updating leadership on website:', error);
        }
    }

    async updateGalleryOnWebsite() {
        try {
            const result = await contentService.getGalleryImages(20);
            if (result.success) {
                this.updateGallerySection(result.data);
            }
        } catch (error) {
            console.error('Error updating gallery on website:', error);
        }
    }

    updateNewsSection(news) {
        const newsContainer = document.getElementById('news-container');
        if (!newsContainer) return;

        const publishedNews = news.filter(article => article.published);
        
        newsContainer.innerHTML = publishedNews.map(article => `
            <div class="news-item" data-id="${article.id}">
                <div class="news-image">
                    <img src="${article.image || 'images/news/default.jpg'}" alt="${article.title}">
                </div>
                <div class="news-content">
                    <div class="news-meta">
                        <span class="news-category">${article.category}</span>
                        <span class="news-date">${this.formatDate(article.createdAt)}</span>
                    </div>
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-excerpt">${article.excerpt}</p>
                    <a href="#" class="news-link" onclick="openNewsModal('${article.id}')">
                        Read More <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `).join('');
    }

    updateEventsSection(events) {
        const eventsContainer = document.getElementById('events-container');
        if (!eventsContainer) return;

        const upcomingEvents = events.filter(event => new Date(event.eventDate) >= new Date());
        
        eventsContainer.innerHTML = upcomingEvents.slice(0, 6).map(event => `
            <div class="event-card" data-id="${event.id}">
                <div class="event-image">
                    <img src="${event.image || 'images/events/default.jpg'}" alt="${event.title}">
                </div>
                <div class="event-content">
                    <div class="event-meta">
                        <span class="event-category">${event.category}</span>
                        <span class="event-date">${this.formatDate(event.eventDate)}</span>
                    </div>
                    <h3 class="event-title">${event.title}</h3>
                    <p class="event-description">${event.description}</p>
                    <div class="event-details">
                        <span class="event-time">
                            <i class="fas fa-clock"></i> ${event.eventTime}
                        </span>
                        <span class="event-location">
                            <i class="fas fa-map-marker-alt"></i> ${event.location}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateLeadershipSection(leadership) {
        const leadershipContainer = document.getElementById('leadership-container');
        if (!leadershipContainer) return;

        leadershipContainer.innerHTML = leadership.map(member => `
            <div class="leader-card" data-id="${member.id}">
                <div class="leader-image">
                    <img src="${member.photo || 'images/leadership/default.jpg'}" alt="${member.name}">
                </div>
                <div class="leader-content">
                    <h3 class="leader-name">${member.name}</h3>
                    <p class="leader-position">${member.position}</p>
                    <p class="leader-bio">${member.bio}</p>
                    <div class="leader-contact">
                        ${member.email ? `<a href="mailto:${member.email}"><i class="fas fa-envelope"></i></a>` : ''}
                        ${member.phone ? `<a href="tel:${member.phone}"><i class="fas fa-phone"></i></a>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateGallerySection(gallery) {
        const galleryContainer = document.getElementById('gallery-container');
        if (!galleryContainer) return;

        galleryContainer.innerHTML = gallery.map(image => `
            <div class="gallery-item" data-id="${image.id}">
                <img src="${image.url}" alt="${image.caption || 'Gallery image'}" onclick="openLightbox('${image.url}', '${image.caption || ''}')">
                <div class="gallery-overlay">
                    <div class="gallery-info">
                        <h4>${image.caption || 'Gallery Image'}</h4>
                        <p>${image.category || 'General'}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Initialize content synchronization for public website
    async initializeWebsiteSync() {
        try {
            // Check if we have cached content
            const cachedContent = localStorage.getItem('contentData');
            const lastSync = localStorage.getItem('lastSyncTime');
            
            if (cachedContent && lastSync) {
                // Use cached content immediately
                const contentData = JSON.parse(cachedContent);
                this.updateNewsSection(contentData.news || []);
                this.updateEventsSection(contentData.events || []);
                this.updateLeadershipSection(contentData.leadership || []);
                this.updateGallerySection(contentData.gallery || []);
            }

            // Then sync with Firebase
            await this.syncAllContent();
            
            // Update website with fresh data
            await this.updateNewsOnWebsite();
            await this.updateEventsOnWebsite();
            await this.updateLeadershipOnWebsite();
            await this.updateGalleryOnWebsite();

        } catch (error) {
            console.error('Error initializing website sync:', error);
        }
    }
}

// Export singleton instance
export const contentSynchronizer = new ContentSynchronizer();
export default contentSynchronizer;
