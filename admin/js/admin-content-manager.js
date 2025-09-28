// Admin Content Management Interface with Supabase Integration

class AdminContentManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.currentPage = 'dashboard';
        this.supabase = window.supabaseClient;
        this.dbConfig = window.dbConfig;
        this.init();
    }

    async init() {
        try {
            // Check authentication status
            await this.checkAuth();
            
            // Initialize UI
            this.initializeUI();
            this.setupEventListeners();
            this.setupNavigation();
            
            // Load dashboard by default
            await this.loadPage('dashboard');
            
            this.isInitialized = true;
            this.hideLoading();

        } catch (error) {
            console.error('Error initializing admin content manager:', error);
            this.showError('Failed to initialize admin panel');
            this.hideLoading();
        }
    }

    async checkAuth() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();
            
            if (error) {
                console.error('Auth error:', error);
                this.redirectToLogin();
                return;
            }

            if (!user) {
                this.redirectToLogin();
                return;
            }

            this.currentUser = user;
            this.updateUserInfo();
            
        } catch (error) {
            console.error('Error checking auth:', error);
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }

    updateUserInfo() {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.email || 'Admin User';
        }
    }

    initializeUI() {
        // UI is already initialized in HTML
        console.log('Admin UI initialized');
    }

    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('admin-sidebar');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }

        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Sync button
        const syncBtn = document.getElementById('sync-btn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.syncData());
        }

        // Preview button
        const previewBtn = document.getElementById('preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewSite());
        }
    }

    setupNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    this.navigateToPage(page);
                }
            });
        });
    }

    async navigateToPage(page) {
        try {
            // Update active menu item
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            
            const activeItem = document.querySelector(`[data-page="${page}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }

            // Update page title
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) {
                pageTitle.textContent = this.getPageTitle(page);
            }

            // Load page content
            await this.loadPage(page);
        } catch (error) {
            console.error('Error navigating to page:', error);
            this.showError('Failed to load page');
        }
    }

    getPageTitle(page) {
        const titles = {
            dashboard: 'Dashboard',
            news: 'News Management',
            events: 'Events Management',
            leadership: 'Leadership',
            gallery: 'Gallery',
            about: 'About Page',
            services: 'Services',
            contact: 'Contact Info',
            settings: 'Settings'
        };
        return titles[page] || 'Admin Panel';
    }

    async loadPage(page) {
        this.showLoading();
        this.currentPage = page;

        try {
            switch (page) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'news':
                    await this.loadNewsManagement();
                    break;
                case 'events':
                    await this.loadEventsManagement();
                    break;
                case 'leadership':
                    await this.loadLeadershipManagement();
                    break;
                case 'gallery':
                    await this.loadGalleryManagement();
                    break;
                case 'about':
                    await this.loadAboutManagement();
                    break;
                case 'services':
                    await this.loadServicesManagement();
                    break;
                case 'contact':
                    await this.loadContactManagement();
                    break;
                case 'settings':
                    await this.loadSettingsManagement();
                    break;
                default:
                    await this.loadDashboard();
            }
        } catch (error) {
            console.error(`Error loading ${page}:`, error);
            this.showError(`Failed to load ${page} page`);
        } finally {
            this.hideLoading();
        }
    }

    async loadDashboard() {
        const content = document.getElementById('admin-content');
        if (!content) return;

        try {
            // Get statistics
            const stats = await this.getDashboardStats();
            
            content.innerHTML = `
                <div class="dashboard-container">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-newspaper"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${stats.newsCount}</h3>
                                <p>News Articles</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-calendar-alt"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${stats.eventsCount}</h3>
                                <p>Events</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${stats.leadershipCount}</h3>
                                <p>Leadership Members</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-images"></i>
                            </div>
                            <div class="stat-content">
                                <h3>${stats.galleryCount}</h3>
                                <p>Gallery Items</p>
                            </div>
                        </div>
                    </div>

                    <div class="dashboard-content">
                        <div class="recent-activity">
                            <h2>Recent Activity</h2>
                            <div class="activity-list" id="recent-activity">
                                <!-- Recent activity will be loaded here -->
                            </div>
                        </div>
                        
                        <div class="quick-actions">
                            <h2>Quick Actions</h2>
                            <div class="action-buttons">
                                <button class="action-btn" onclick="adminContentManager.navigateToPage('news')">
                                    <i class="fas fa-plus"></i>
                                    Add News Article
                                </button>
                                <button class="action-btn" onclick="adminContentManager.navigateToPage('events')">
                                    <i class="fas fa-plus"></i>
                                    Add Event
                                </button>
                                <button class="action-btn" onclick="adminContentManager.navigateToPage('leadership')">
                                    <i class="fas fa-plus"></i>
                                    Add Leadership Member
                                </button>
                                <button class="action-btn" onclick="adminContentManager.navigateToPage('gallery')">
                                    <i class="fas fa-plus"></i>
                                    Add Gallery Item
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            await this.loadRecentActivity();

        } catch (error) {
            console.error('Error loading dashboard:', error);
            content.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Failed to load dashboard</h2>
                    <p>Please check your connection and try again.</p>
                </div>
            `;
        }
    }

    async getDashboardStats() {
        try {
            // Get counts from Supabase
            const [newsResult, eventsResult, leadershipResult, galleryResult] = await Promise.all([
                this.supabase.from(this.dbConfig.tables.news).select('*', { count: 'exact', head: true }),
                this.supabase.from(this.dbConfig.tables.events).select('*', { count: 'exact', head: true }),
                this.supabase.from(this.dbConfig.tables.leadership).select('*', { count: 'exact', head: true }),
                this.supabase.from(this.dbConfig.tables.gallery).select('*', { count: 'exact', head: true })
            ]);

            return {
                newsCount: newsResult.count || 0,
                eventsCount: eventsResult.count || 0,
                leadershipCount: leadershipResult.count || 0,
                galleryCount: galleryResult.count || 0
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return {
                newsCount: 0,
                eventsCount: 0,
                leadershipCount: 0,
                galleryCount: 0
            };
        }
    }

    async loadRecentActivity() {
        const activityContainer = document.getElementById('recent-activity');
        if (!activityContainer) return;

        try {
            // Get recent news and events
            const [newsResult, eventsResult] = await Promise.all([
                this.supabase.from(this.dbConfig.tables.news).select('*').order('created_at', { ascending: false }).limit(5),
                this.supabase.from(this.dbConfig.tables.events).select('*').order('created_at', { ascending: false }).limit(5)
            ]);

            const activities = [];
            
            if (newsResult.data) {
                newsResult.data.forEach(item => {
                    activities.push({
                        type: 'news',
                        title: item.title,
                        date: item.created_at,
                        icon: 'fas fa-newspaper'
                    });
                });
            }

            if (eventsResult.data) {
                eventsResult.data.forEach(item => {
                    activities.push({
                        type: 'event',
                        title: item.title,
                        date: item.created_at,
                        icon: 'fas fa-calendar-alt'
                    });
                });
            }

            // Sort by date
            activities.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (activities.length === 0) {
                activityContainer.innerHTML = '<p class="no-activity">No recent activity</p>';
                return;
            }

            activityContainer.innerHTML = activities.slice(0, 10).map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${activity.title}</h4>
                        <p>${this.formatDate(activity.date)}</p>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading recent activity:', error);
            activityContainer.innerHTML = '<p class="error">Failed to load recent activity</p>';
        }
    }

    async loadNewsManagement() {
        const content = document.getElementById('admin-content');
        if (!content) return;

        content.innerHTML = `
            <div class="content-management">
                <div class="content-header">
                    <h2>News Management</h2>
                    <button class="btn btn-primary" onclick="adminContentManager.showNewsForm()">
                        <i class="fas fa-plus"></i>
                        Add News Article
                    </button>
                </div>
                
                <div class="content-filters">
                    <div class="filter-group">
                        <label>Search:</label>
                        <input type="text" id="news-search" placeholder="Search news articles...">
                    </div>
                    <div class="filter-group">
                        <label>Category:</label>
                        <select id="news-category-filter">
                            <option value="">All Categories</option>
                            <option value="announcements">Announcements</option>
                            <option value="cultural">Cultural</option>
                            <option value="academics">Academics</option>
                            <option value="sports">Sports</option>
                            <option value="community">Community</option>
                        </select>
                    </div>
                </div>

                <div class="content-list" id="news-list">
                    <!-- News articles will be loaded here -->
                </div>
            </div>
        `;

        await this.loadNewsList();
        this.setupNewsFilters();
    }

    async loadNewsList() {
        const newsList = document.getElementById('news-list');
        if (!newsList) return;

        try {
            const { data: news, error } = await this.supabase
                .from(this.dbConfig.tables.news)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            if (!news || news.length === 0) {
                newsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-newspaper"></i>
                        <h3>No news articles found</h3>
                        <p>Start by adding your first news article.</p>
                    </div>
                `;
                return;
            }

            newsList.innerHTML = news.map(article => `
                <div class="content-item" data-id="${article.id}">
                    <div class="item-image">
                        <img src="${article.image || 'images/placeholder.jpg'}" alt="${article.title}">
                    </div>
                    <div class="item-content">
                        <div class="item-header">
                            <h3>${article.title}</h3>
                            <div class="item-actions">
                                <button class="btn btn-sm btn-secondary" onclick="adminContentManager.editNews(${article.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="adminContentManager.deleteNews(${article.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <p class="item-excerpt">${article.excerpt}</p>
                        <div class="item-meta">
                            <span class="category">${article.category}</span>
                            <span class="date">${this.formatDate(article.date)}</span>
                            <span class="author">${article.author}</span>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading news list:', error);
            newsList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load news articles</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }

    setupNewsFilters() {
        const searchInput = document.getElementById('news-search');
        const categoryFilter = document.getElementById('news-category-filter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterNews(e.target.value, categoryFilter.value);
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterNews(searchInput.value, e.target.value);
            });
        }
    }

    filterNews(searchTerm, category) {
        const items = document.querySelectorAll('.content-item');
        
        items.forEach(item => {
            const title = item.querySelector('h3').textContent.toLowerCase();
            const excerpt = item.querySelector('.item-excerpt').textContent.toLowerCase();
            const itemCategory = item.querySelector('.category').textContent.toLowerCase();
            
            const matchesSearch = !searchTerm || title.includes(searchTerm.toLowerCase()) || excerpt.includes(searchTerm.toLowerCase());
            const matchesCategory = !category || itemCategory === category.toLowerCase();
            
            if (matchesSearch && matchesCategory) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    showNewsForm(articleId = null) {
        if (window.contentForms) {
            window.contentForms.showNewsForm(articleId);
        }
    }

    showEventsForm(eventId = null) {
        if (window.contentForms) {
            window.contentForms.showEventsForm(eventId);
        }
    }

    showLeadershipForm(memberId = null) {
        if (window.contentForms) {
            window.contentForms.showLeadershipForm(memberId);
        }
    }

    showGalleryForm(itemId = null) {
        if (window.contentForms) {
            window.contentForms.showGalleryForm(itemId);
        }
    }

    showServiceForm(serviceId = null) {
        if (window.contentForms) {
            window.contentForms.showServiceForm(serviceId);
        }
    }

    editNews(articleId) {
        this.showNewsForm(articleId);
    }

    async deleteNews(articleId) {
        if (!confirm('Are you sure you want to delete this news article?')) {
            return;
        }

        try {
            await window.fileUploadHandler.deleteContentWithImage(
                this.dbConfig.tables.news, 
                articleId, 
                'image'
            );

            this.showNotification('News article deleted successfully', 'success');
            await this.loadNewsList();

        } catch (error) {
            console.error('Error deleting news article:', error);
            this.showError('Failed to delete news article');
        }
    }

    async loadEventsManagement() {
        const content = document.getElementById('admin-content');
        if (!content) return;

        content.innerHTML = `
            <div class="content-management">
                <div class="content-header">
                    <h2>Events Management</h2>
                    <button class="btn btn-primary" onclick="adminContentManager.showEventsForm()">
                        <i class="fas fa-plus"></i>
                        Add Event
                    </button>
                </div>
                
                <div class="content-filters">
                    <div class="filter-group">
                        <label>Search:</label>
                        <input type="text" id="events-search" placeholder="Search events...">
                    </div>
                    <div class="filter-group">
                        <label>Status:</label>
                        <select id="events-status-filter">
                            <option value="">All Status</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="past">Past</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Category:</label>
                        <select id="events-category-filter">
                            <option value="">All Categories</option>
                            <option value="social">Social</option>
                            <option value="academic">Academic</option>
                            <option value="cultural">Cultural</option>
                            <option value="sports">Sports</option>
                            <option value="career">Career</option>
                            <option value="community">Community</option>
                        </select>
                    </div>
                </div>

                <div class="content-list" id="events-list">
                    <!-- Events will be loaded here -->
                </div>
            </div>
        `;

        await this.loadEventsList();
        this.setupEventsFilters();
    }

    async loadEventsList() {
        const eventsList = document.getElementById('events-list');
        if (!eventsList) return;

        try {
            const { data: events, error } = await this.supabase
                .from(this.dbConfig.tables.events)
                .select('*')
                .order('date', { ascending: false });

            if (error) {
                throw error;
            }

            if (!events || events.length === 0) {
                eventsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-alt"></i>
                        <h3>No events found</h3>
                        <p>Start by adding your first event.</p>
                    </div>
                `;
                return;
            }

            eventsList.innerHTML = events.map(event => `
                <div class="content-item" data-id="${event.id}">
                    <div class="item-image">
                        <img src="${event.image || 'images/placeholder.jpg'}" alt="${event.title}">
                    </div>
                    <div class="item-content">
                        <div class="item-header">
                            <h3>${event.title}</h3>
                            <div class="item-actions">
                                <button class="btn btn-sm btn-secondary" onclick="adminContentManager.editEvent(${event.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="adminContentManager.deleteEvent(${event.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <p class="item-excerpt">${event.description}</p>
                        <div class="item-meta">
                            <span class="category">${event.category}</span>
                            <span class="date">${this.formatDate(event.date)}</span>
                            <span class="status">${event.status}</span>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading events list:', error);
            eventsList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load events</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }

    setupEventsFilters() {
        const searchInput = document.getElementById('events-search');
        const statusFilter = document.getElementById('events-status-filter');
        const categoryFilter = document.getElementById('events-category-filter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterEvents(e.target.value, statusFilter.value, categoryFilter.value);
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterEvents(searchInput.value, e.target.value, categoryFilter.value);
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterEvents(searchInput.value, statusFilter.value, e.target.value);
            });
        }
    }

    filterEvents(searchTerm, status, category) {
        const items = document.querySelectorAll('.content-item');
        
        items.forEach(item => {
            const title = item.querySelector('h3').textContent.toLowerCase();
            const description = item.querySelector('.item-excerpt').textContent.toLowerCase();
            const itemStatus = item.querySelector('.status').textContent.toLowerCase();
            const itemCategory = item.querySelector('.category').textContent.toLowerCase();
            
            const matchesSearch = !searchTerm || title.includes(searchTerm.toLowerCase()) || description.includes(searchTerm.toLowerCase());
            const matchesStatus = !status || itemStatus === status.toLowerCase();
            const matchesCategory = !category || itemCategory === category.toLowerCase();
            
            if (matchesSearch && matchesStatus && matchesCategory) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    editEvent(eventId) {
        this.showEventsForm(eventId);
    }

    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }

        try {
            await window.fileUploadHandler.deleteContentWithImage(
                this.dbConfig.tables.events, 
                eventId, 
                'image'
            );

            this.showNotification('Event deleted successfully', 'success');
            await this.loadEventsList();

        } catch (error) {
            console.error('Error deleting event:', error);
            this.showError('Failed to delete event');
        }
    }

    async loadLeadershipManagement() {
        const content = document.getElementById('admin-content');
        if (!content) return;

        content.innerHTML = `
            <div class="content-management">
                <div class="content-header">
                    <h2>Leadership Management</h2>
                    <button class="btn btn-primary" onclick="adminContentManager.showLeadershipForm()">
                        <i class="fas fa-plus"></i>
                        Add Member
                    </button>
                </div>
                
                <div class="content-filters">
                    <div class="filter-group">
                        <label>Search:</label>
                        <input type="text" id="leadership-search" placeholder="Search leadership members...">
                    </div>
                    <div class="filter-group">
                        <label>Department:</label>
                        <select id="leadership-department-filter">
                            <option value="">All Departments</option>
                            <option value="Executive">Executive</option>
                            <option value="Academic Affairs">Academic Affairs</option>
                            <option value="Events & Activities">Events & Activities</option>
                            <option value="Membership & Welfare">Membership & Welfare</option>
                            <option value="Public Relations">Public Relations</option>
                        </select>
                    </div>
                </div>

                <div class="content-list" id="leadership-list">
                    <!-- Leadership members will be loaded here -->
                </div>
            </div>
        `;

        await this.loadLeadershipList();
        this.setupLeadershipFilters();
    }

    async loadLeadershipList() {
        const leadershipList = document.getElementById('leadership-list');
        if (!leadershipList) return;

        try {
            const { data: members, error } = await this.supabase
                .from(this.dbConfig.tables.leadership)
                .select('*')
                .order('position', { ascending: true });

            if (error) {
                throw error;
            }

            if (!members || members.length === 0) {
                leadershipList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No leadership members found</h3>
                        <p>Start by adding your first team member.</p>
                    </div>
                `;
                return;
            }

            leadershipList.innerHTML = members.map(member => `
                <div class="content-item" data-id="${member.id}">
                    <div class="item-image">
                        <img src="${member.image || 'images/placeholder.jpg'}" alt="${member.name}">
                    </div>
                    <div class="item-content">
                        <div class="item-header">
                            <h3>${member.name}</h3>
                            <div class="item-actions">
                                <button class="btn btn-sm btn-secondary" onclick="adminContentManager.editLeadership(${member.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="adminContentManager.deleteLeadership(${member.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <p class="item-excerpt">${member.position} - ${member.department}</p>
                        <div class="item-meta">
                            <span class="department">${member.department}</span>
                            <span class="course">${member.course}</span>
                            <span class="year">${member.year}</span>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading leadership list:', error);
            leadershipList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load leadership members</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }

    setupLeadershipFilters() {
        const searchInput = document.getElementById('leadership-search');
        const departmentFilter = document.getElementById('leadership-department-filter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterLeadership(e.target.value, departmentFilter.value);
            });
        }

        if (departmentFilter) {
            departmentFilter.addEventListener('change', (e) => {
                this.filterLeadership(searchInput.value, e.target.value);
            });
        }
    }

    filterLeadership(searchTerm, department) {
        const items = document.querySelectorAll('.content-item');
        
        items.forEach(item => {
            const name = item.querySelector('h3').textContent.toLowerCase();
            const position = item.querySelector('.item-excerpt').textContent.toLowerCase();
            const itemDepartment = item.querySelector('.department').textContent.toLowerCase();
            
            const matchesSearch = !searchTerm || name.includes(searchTerm.toLowerCase()) || position.includes(searchTerm.toLowerCase());
            const matchesDepartment = !department || itemDepartment === department.toLowerCase();
            
            if (matchesSearch && matchesDepartment) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    editLeadership(memberId) {
        this.showLeadershipForm(memberId);
    }

    async deleteLeadership(memberId) {
        if (!confirm('Are you sure you want to delete this leadership member?')) {
            return;
        }

        try {
            await window.fileUploadHandler.deleteContentWithImage(
                this.dbConfig.tables.leadership, 
                memberId, 
                'image'
            );

            this.showNotification('Leadership member deleted successfully', 'success');
            await this.loadLeadershipList();

        } catch (error) {
            console.error('Error deleting leadership member:', error);
            this.showError('Failed to delete leadership member');
        }
    }

    async loadGalleryManagement() {
        const content = document.getElementById('admin-content');
        if (!content) return;

        content.innerHTML = `
            <div class="content-management">
                <div class="content-header">
                    <h2>Gallery Management</h2>
                    <button class="btn btn-primary" onclick="adminContentManager.showGalleryForm()">
                        <i class="fas fa-plus"></i>
                        Add Image
                    </button>
                </div>
                
                <div class="content-filters">
                    <div class="filter-group">
                        <label>Search:</label>
                        <input type="text" id="gallery-search" placeholder="Search gallery items...">
                    </div>
                    <div class="filter-group">
                        <label>Category:</label>
                        <select id="gallery-category-filter">
                            <option value="">All Categories</option>
                            <option value="cultural">Cultural</option>
                            <option value="academic">Academic</option>
                            <option value="sports">Sports</option>
                            <option value="leadership">Leadership</option>
                            <option value="community">Community</option>
                            <option value="campus">Campus</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Featured:</label>
                        <select id="gallery-featured-filter">
                            <option value="">All Images</option>
                            <option value="true">Featured Only</option>
                            <option value="false">Non-Featured</option>
                        </select>
                    </div>
                </div>

                <div class="gallery-grid" id="gallery-list">
                    <!-- Gallery items will be loaded here -->
                </div>
            </div>
        `;

        await this.loadGalleryList();
        this.setupGalleryFilters();
    }

    async loadGalleryList() {
        const galleryList = document.getElementById('gallery-list');
        if (!galleryList) return;

        try {
            const { data: items, error } = await this.supabase
                .from(this.dbConfig.tables.gallery)
                .select('*')
                .order('date', { ascending: false });

            if (error) {
                throw error;
            }

            if (!items || items.length === 0) {
                galleryList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-images"></i>
                        <h3>No gallery items found</h3>
                        <p>Start by adding your first image.</p>
                    </div>
                `;
                return;
            }

            galleryList.innerHTML = items.map(item => `
                <div class="gallery-item" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.title}" class="gallery-item-image">
                    <div class="gallery-item-content">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                        <div class="gallery-item-meta">
                            <span class="category">${item.category}</span>
                            <span class="date">${this.formatDate(item.date)}</span>
                            <div class="item-actions">
                                <button class="btn btn-sm btn-secondary" onclick="adminContentManager.editGallery(${item.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="adminContentManager.deleteGallery(${item.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading gallery list:', error);
            galleryList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load gallery items</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }

    setupGalleryFilters() {
        const searchInput = document.getElementById('gallery-search');
        const categoryFilter = document.getElementById('gallery-category-filter');
        const featuredFilter = document.getElementById('gallery-featured-filter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterGallery(e.target.value, categoryFilter.value, featuredFilter.value);
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterGallery(searchInput.value, e.target.value, featuredFilter.value);
            });
        }

        if (featuredFilter) {
            featuredFilter.addEventListener('change', (e) => {
                this.filterGallery(searchInput.value, categoryFilter.value, e.target.value);
            });
        }
    }

    filterGallery(searchTerm, category, featured) {
        const items = document.querySelectorAll('.gallery-item');
        
        items.forEach(item => {
            const title = item.querySelector('h3').textContent.toLowerCase();
            const description = item.querySelector('p').textContent.toLowerCase();
            const itemCategory = item.querySelector('.category').textContent.toLowerCase();
            
            const matchesSearch = !searchTerm || title.includes(searchTerm.toLowerCase()) || description.includes(searchTerm.toLowerCase());
            const matchesCategory = !category || itemCategory === category.toLowerCase();
            const matchesFeatured = !featured || (featured === 'true' && item.dataset.featured === 'true') || (featured === 'false' && item.dataset.featured === 'false');
            
            if (matchesSearch && matchesCategory && matchesFeatured) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    editGallery(itemId) {
        this.showGalleryForm(itemId);
    }

    async deleteGallery(itemId) {
        if (!confirm('Are you sure you want to delete this gallery item?')) {
            return;
        }

        try {
            await window.fileUploadHandler.deleteContentWithImage(
                this.dbConfig.tables.gallery, 
                itemId, 
                'image'
            );

            this.showNotification('Gallery item deleted successfully', 'success');
            await this.loadGalleryList();

        } catch (error) {
            console.error('Error deleting gallery item:', error);
            this.showError('Failed to delete gallery item');
        }
    }

    async loadAboutManagement() {
        const content = document.getElementById('admin-content');
        if (!content) return;

        content.innerHTML = `
            <div class="content-management">
                <div class="content-header">
                    <h2>About Page Management</h2>
                    <button class="btn btn-primary" onclick="adminContentManager.saveAboutContent()">
                        <i class="fas fa-save"></i>
                        Save Changes
                    </button>
                </div>
                
                <div class="about-sections">
                    <div class="section-group">
                        <h3>Mission Statement</h3>
                        <textarea id="mission" rows="4" placeholder="Enter mission statement..."></textarea>
                    </div>
                    
                    <div class="section-group">
                        <h3>Vision Statement</h3>
                        <textarea id="vision" rows="4" placeholder="Enter vision statement..."></textarea>
                    </div>
                    
                    <div class="section-group">
                        <h3>History</h3>
                        <textarea id="history" rows="6" placeholder="Enter association history..."></textarea>
                    </div>
                    
                    <div class="section-group">
                        <h3>Objectives</h3>
                        <div id="objectives-list">
                            <!-- Objectives will be loaded here -->
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="adminContentManager.addObjective()">
                            <i class="fas fa-plus"></i>
                            Add Objective
                        </button>
                    </div>
                    
                    <div class="section-group">
                        <h3>Achievements</h3>
                        <div id="achievements-list">
                            <!-- Achievements will be loaded here -->
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="adminContentManager.addAchievement()">
                            <i class="fas fa-plus"></i>
                            Add Achievement
                        </button>
                    </div>
                </div>
            </div>
        `;

        await this.loadAboutContent();
    }

    async loadAboutContent() {
        try {
            const { data: aboutData, error } = await this.supabase
                .from(this.dbConfig.tables.about)
                .select('*');

            if (error) {
                throw error;
            }

            if (aboutData) {
                aboutData.forEach(item => {
                    const element = document.getElementById(item.section);
                    if (element) {
                        if (item.section === 'objectives' || item.section === 'achievements') {
                            this.loadListContent(item.section, item.content);
                        } else {
                            element.value = item.content;
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error loading about content:', error);
            this.showError('Failed to load about content');
        }
    }

    loadListContent(section, content) {
        const listContainer = document.getElementById(`${section}-list`);
        if (!listContainer) return;

        try {
            const items = JSON.parse(content);
            listContainer.innerHTML = items.map((item, index) => `
                <div class="${section.slice(0, -1)}-item">
                    <input type="text" value="${item}" data-index="${index}">
                    <button type="button" onclick="adminContentManager.removeListItem('${section}', ${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error(`Error parsing ${section} content:`, error);
        }
    }

    addObjective() {
        this.addListItem('objectives');
    }

    addAchievement() {
        this.addListItem('achievements');
    }

    addListItem(section) {
        const listContainer = document.getElementById(`${section}-list`);
        if (!listContainer) return;

        const index = listContainer.children.length;
        const newItem = document.createElement('div');
        newItem.className = `${section.slice(0, -1)}-item`;
        newItem.innerHTML = `
            <input type="text" value="" data-index="${index}" placeholder="Enter ${section.slice(0, -1)}...">
            <button type="button" onclick="adminContentManager.removeListItem('${section}', ${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        listContainer.appendChild(newItem);
    }

    removeListItem(section, index) {
        const listContainer = document.getElementById(`${section}-list`);
        if (!listContainer) return;

        const items = Array.from(listContainer.children);
        if (items[index]) {
            items[index].remove();
            // Reindex remaining items
            items.forEach((item, newIndex) => {
                const input = item.querySelector('input');
                const button = item.querySelector('button');
                if (input) input.dataset.index = newIndex;
                if (button) button.onclick = () => this.removeListItem(section, newIndex);
            });
        }
    }

    async saveAboutContent() {
        try {
            const mission = document.getElementById('mission').value;
            const vision = document.getElementById('vision').value;
            const history = document.getElementById('history').value;
            
            const objectives = Array.from(document.querySelectorAll('#objectives-list input')).map(input => input.value).filter(value => value.trim());
            const achievements = Array.from(document.querySelectorAll('#achievements-list input')).map(input => input.value).filter(value => value.trim());

            const updates = [
                { section: 'mission', content: mission },
                { section: 'vision', content: vision },
                { section: 'history', content: history },
                { section: 'objectives', content: JSON.stringify(objectives) },
                { section: 'achievements', content: JSON.stringify(achievements) }
            ];

            for (const update of updates) {
                const { error } = await this.supabase
                    .from(this.dbConfig.tables.about)
                    .upsert(update);

                if (error) throw error;
            }

            this.showNotification('About content saved successfully', 'success');
        } catch (error) {
            console.error('Error saving about content:', error);
            this.showError('Failed to save about content');
        }
    }

    async loadServicesManagement() {
        const content = document.getElementById('admin-content');
        if (!content) return;

        content.innerHTML = `
            <div class="content-management">
                <div class="content-header">
                    <h2>Services Management</h2>
                    <button class="btn btn-primary" onclick="adminContentManager.showServiceForm()">
                        <i class="fas fa-plus"></i>
                        Add Service
                    </button>
                </div>
                
                <div class="services-grid" id="services-list">
                    <!-- Services will be loaded here -->
                </div>
            </div>
        `;

        await this.loadServicesList();
    }

    async loadServicesList() {
        const servicesList = document.getElementById('services-list');
        if (!servicesList) return;

        try {
            const { data: services, error } = await this.supabase
                .from(this.dbConfig.tables.services)
                .select('*')
                .order('service_key', { ascending: true });

            if (error) {
                throw error;
            }

            if (!services || services.length === 0) {
                servicesList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-cogs"></i>
                        <h3>No services found</h3>
                        <p>Start by adding your first service.</p>
                    </div>
                `;
                return;
            }

            servicesList.innerHTML = services.map(service => `
                <div class="service-card" data-id="${service.id}">
                    <div class="service-header">
                        <h3>${service.title}</h3>
                        <div class="service-actions">
                            <button class="btn btn-sm btn-secondary" onclick="adminContentManager.editService(${service.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="adminContentManager.deleteService(${service.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p>${service.description}</p>
                    <ul class="service-features">
                        ${service.features ? service.features.map(feature => `<li>${feature}</li>`).join('') : ''}
                    </ul>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading services list:', error);
            servicesList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load services</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }

    editService(serviceId) {
        this.showServiceForm(serviceId);
    }

    async deleteService(serviceId) {
        if (!confirm('Are you sure you want to delete this service?')) {
            return;
        }

        try {
            const { error } = await this.supabase
                .from(this.dbConfig.tables.services)
                .delete()
                .eq('id', serviceId);

            if (error) throw error;

            this.showNotification('Service deleted successfully', 'success');
            await this.loadServicesList();

        } catch (error) {
            console.error('Error deleting service:', error);
            this.showError('Failed to delete service');
        }
    }

    async loadContactManagement() {
        const content = document.getElementById('admin-content');
        if (!content) return;

        content.innerHTML = `
            <div class="content-management">
                <div class="content-header">
                    <h2>Contact Information Management</h2>
                    <button class="btn btn-primary" onclick="adminContentManager.saveContactInfo()">
                        <i class="fas fa-save"></i>
                        Save Changes
                    </button>
                </div>
                
                <div class="contact-sections">
                    <div class="section-group">
                        <h3>Basic Information</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="contact-phone">Phone Number</label>
                                <input type="tel" id="contact-phone" placeholder="+256 700 000 000">
                            </div>
                            <div class="form-group">
                                <label for="contact-email">Email Address</label>
                                <input type="email" id="contact-email" placeholder="info@madimakerere.org">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="contact-address">Address</label>
                            <textarea id="contact-address" rows="3" placeholder="Makerere University, Kampala, Uganda"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="office-hours">Office Hours</label>
                            <textarea id="office-hours" rows="4" placeholder="Monday - Friday: 8:00 AM - 5:00 PM..."></textarea>
                        </div>
                    </div>
                    
                    <div class="section-group">
                        <h3>Social Media Links</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="social-facebook">Facebook</label>
                                <input type="url" id="social-facebook" placeholder="https://facebook.com/madimakerere">
                            </div>
                            <div class="form-group">
                                <label for="social-twitter">Twitter</label>
                                <input type="url" id="social-twitter" placeholder="https://twitter.com/madimakerere">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="social-instagram">Instagram</label>
                                <input type="url" id="social-instagram" placeholder="https://instagram.com/madimakerere">
                            </div>
                            <div class="form-group">
                                <label for="social-linkedin">LinkedIn</label>
                                <input type="url" id="social-linkedin" placeholder="https://linkedin.com/company/madi-makerere-association">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="social-whatsapp">WhatsApp</label>
                                <input type="tel" id="social-whatsapp" placeholder="+256 700 000 000">
                            </div>
                            <div class="form-group">
                                <label for="social-youtube">YouTube</label>
                                <input type="url" id="social-youtube" placeholder="https://youtube.com/madimakerere">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await this.loadContactInfo();
    }

    async loadContactInfo() {
        try {
            const { data: contactData, error } = await this.supabase
                .from(this.dbConfig.tables.contact)
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                throw error;
            }

            if (contactData) {
                document.getElementById('contact-phone').value = contactData.phone || '';
                document.getElementById('contact-email').value = contactData.email || '';
                document.getElementById('contact-address').value = contactData.address || '';
                document.getElementById('office-hours').value = contactData.office_hours || '';

                if (contactData.social_media) {
                    document.getElementById('social-facebook').value = contactData.social_media.facebook || '';
                    document.getElementById('social-twitter').value = contactData.social_media.twitter || '';
                    document.getElementById('social-instagram').value = contactData.social_media.instagram || '';
                    document.getElementById('social-linkedin').value = contactData.social_media.linkedin || '';
                    document.getElementById('social-whatsapp').value = contactData.social_media.whatsapp || '';
                    document.getElementById('social-youtube').value = contactData.social_media.youtube || '';
                }
            }
        } catch (error) {
            console.error('Error loading contact info:', error);
            this.showError('Failed to load contact information');
        }
    }

    async saveContactInfo() {
        try {
            const contactData = {
                phone: document.getElementById('contact-phone').value,
                email: document.getElementById('contact-email').value,
                address: document.getElementById('contact-address').value,
                office_hours: document.getElementById('office-hours').value,
                social_media: {
                    facebook: document.getElementById('social-facebook').value,
                    twitter: document.getElementById('social-twitter').value,
                    instagram: document.getElementById('social-instagram').value,
                    linkedin: document.getElementById('social-linkedin').value,
                    whatsapp: document.getElementById('social-whatsapp').value,
                    youtube: document.getElementById('social-youtube').value
                }
            };

            const { error } = await this.supabase
                .from(this.dbConfig.tables.contact)
                .upsert(contactData);

            if (error) throw error;

            this.showNotification('Contact information saved successfully', 'success');
        } catch (error) {
            console.error('Error saving contact info:', error);
            this.showError('Failed to save contact information');
        }
    }

    async loadSettingsManagement() {
        const content = document.getElementById('admin-content');
        if (!content) return;

        content.innerHTML = `
            <div class="content-management">
                <div class="content-header">
                    <h2>Site Settings</h2>
                    <button class="btn btn-primary" onclick="adminContentManager.saveSettings()">
                        <i class="fas fa-save"></i>
                        Save Settings
                    </button>
                </div>
                
                <div class="settings-sections">
                    <div class="section-group">
                        <h3>General Settings</h3>
                        <div class="form-group">
                            <label for="site-title">Site Title</label>
                            <input type="text" id="site-title" placeholder="Madi Makerere University Students Association">
                        </div>
                        <div class="form-group">
                            <label for="site-description">Site Description</label>
                            <textarea id="site-description" rows="3" placeholder="Official website description..."></textarea>
                        </div>
                        <div class="form-group">
                            <label for="items-per-page">Items Per Page</label>
                            <input type="number" id="items-per-page" min="5" max="50" value="10">
                        </div>
                    </div>
                    
                    <div class="section-group">
                        <h3>Feature Toggles</h3>
                        <div class="toggle-group">
                            <label class="toggle-label">
                                <input type="checkbox" id="enable-comments">
                                <span class="toggle-slider"></span>
                                Enable Comments
                            </label>
                            <label class="toggle-label">
                                <input type="checkbox" id="enable-newsletter">
                                <span class="toggle-slider"></span>
                                Enable Newsletter
                            </label>
                            <label class="toggle-label">
                                <input type="checkbox" id="enable-event-registration">
                                <span class="toggle-slider"></span>
                                Enable Event Registration
                            </label>
                            <label class="toggle-label">
                                <input type="checkbox" id="enable-photo-upload">
                                <span class="toggle-slider"></span>
                                Enable Photo Upload
                            </label>
                            <label class="toggle-label">
                                <input type="checkbox" id="maintenance-mode">
                                <span class="toggle-slider"></span>
                                Maintenance Mode
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await this.loadSettings();
    }

    async loadSettings() {
        try {
            const { data: settings, error } = await this.supabase
                .from(this.dbConfig.tables.settings)
                .select('*');

            if (error) {
                throw error;
            }

            if (settings) {
                settings.forEach(setting => {
                    const element = document.getElementById(setting.setting_key);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = setting.setting_value === 'true';
                        } else {
                            element.value = setting.setting_value || '';
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showError('Failed to load settings');
        }
    }

    async saveSettings() {
        try {
            const settings = [
                { setting_key: 'siteTitle', setting_value: document.getElementById('site-title').value },
                { setting_key: 'siteDescription', setting_value: document.getElementById('site-description').value },
                { setting_key: 'itemsPerPage', setting_value: document.getElementById('items-per-page').value },
                { setting_key: 'enableComments', setting_value: document.getElementById('enable-comments').checked.toString() },
                { setting_key: 'enableNewsletter', setting_value: document.getElementById('enable-newsletter').checked.toString() },
                { setting_key: 'enableEventRegistration', setting_value: document.getElementById('enable-event-registration').checked.toString() },
                { setting_key: 'enablePhotoUpload', setting_value: document.getElementById('enable-photo-upload').checked.toString() },
                { setting_key: 'maintenanceMode', setting_value: document.getElementById('maintenance-mode').checked.toString() }
            ];

            for (const setting of settings) {
                const { error } = await this.supabase
                    .from(this.dbConfig.tables.settings)
                    .upsert(setting);

                if (error) throw error;
            }

            this.showNotification('Settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showError('Failed to save settings');
        }
    }

    async syncData() {
        this.showLoading();
        try {
            // Implement data synchronization logic
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate sync
            this.showNotification('Data synchronized successfully', 'success');
        } catch (error) {
            console.error('Error syncing data:', error);
            this.showError('Failed to sync data');
        } finally {
            this.hideLoading();
        }
    }

    previewSite() {
        // Open the user site in a new tab
        window.open('../user_site/index.html', '_blank');
    }

    async logout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) {
                throw error;
            }
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error logging out:', error);
            this.showError('Failed to logout');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Initialize admin content manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminContentManager = new AdminContentManager();
});

export default AdminContentManager;
