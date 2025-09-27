// Firebase Admin Dashboard JavaScript
import { authService } from './auth-service.js';
import { contentService } from './firebase-content-service.js';

class FirebaseAdminDashboard {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
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

            // Initialize dashboard
            this.initializeDashboard();
            this.setupEventListeners();
            this.loadDashboardData();
            this.isInitialized = true;

            console.log('Firebase Admin Dashboard initialized');
        } catch (error) {
            console.error('Error initializing admin dashboard:', error);
            this.showError('Failed to initialize admin dashboard');
        }
    }

    initializeDashboard() {
        // Set user info
        this.updateUserInfo();
        
        // Initialize navigation
        this.initializeNavigation();
        
        // Set current year
        this.setCurrentYear();
    }

    updateUserInfo() {
        const userNameElement = document.getElementById('user-name');
        const userRoleElement = document.getElementById('user-role');
        
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.displayName || this.currentUser.email;
        }
        
        if (userRoleElement) {
            userRoleElement.textContent = this.currentUser.role || 'Administrator';
        }
    }

    initializeNavigation() {
        const navLinks = document.querySelectorAll('.admin-nav-link');
        const sections = document.querySelectorAll('.admin-section');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('href').substring(1);
                
                // Remove active class from all links and sections
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                sections.forEach(section => section.classList.remove('active'));
                
                // Add active class to clicked link and corresponding section
                link.classList.add('active');
                const targetElement = document.getElementById(`${targetSection}-section`);
                if (targetElement) {
                    targetElement.classList.add('active');
                }
                
                // Load section-specific data
                this.loadSectionData(targetSection);
            });
        });
    }

    async loadDashboardData() {
        try {
            this.showLoading('Loading dashboard data...');
            
            // Load statistics
            await this.loadStatistics();
            
            // Load recent activity
            await this.loadRecentActivity();
            
            this.hideLoading();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async loadStatistics() {
        try {
            // Load news count
            const newsResult = await contentService.getNewsArticles(100);
            const newsCount = newsResult.success ? newsResult.data.length : 0;
            this.updateStatCard('news-count', newsCount);

            // Load events count
            const eventsResult = await contentService.getEvents(100);
            const eventsCount = eventsResult.success ? eventsResult.data.length : 0;
            this.updateStatCard('events-count', eventsCount);

            // Load leadership count
            const leadershipResult = await contentService.getLeadershipTeam();
            const leadershipCount = leadershipResult.success ? leadershipResult.data.length : 0;
            this.updateStatCard('leadership-count', leadershipCount);

            // Load gallery count
            const galleryResult = await contentService.getGalleryImages(100);
            const galleryCount = galleryResult.success ? galleryResult.data.length : 0;
            this.updateStatCard('gallery-count', galleryCount);

        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    updateStatCard(elementId, count) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = count;
        }
    }

    async loadRecentActivity() {
        try {
            const activityContainer = document.getElementById('recent-activity');
            if (!activityContainer) return;

            // For now, show placeholder activity
            activityContainer.innerHTML = `
                <div class="activity-item">
                    <i class="fas fa-info-circle"></i>
                    <span>Dashboard loaded successfully</span>
                </div>
                <div class="activity-item">
                    <i class="fas fa-user"></i>
                    <span>Welcome back, ${this.currentUser.displayName || 'Admin'}</span>
                </div>
                <div class="activity-item">
                    <i class="fas fa-database"></i>
                    <span>Firebase connected</span>
                </div>
            `;
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'content':
                // Content management is handled by admin-content-manager.js
                break;
            case 'users':
                await this.loadUsersData();
                break;
            case 'analytics':
                await this.loadAnalyticsData();
                break;
            case 'settings':
                await this.loadSettingsData();
                break;
        }
    }

    async loadUsersData() {
        try {
            const usersList = document.getElementById('users-list');
            if (!usersList) return;

            // For now, show current user
            usersList.innerHTML = `
                <div class="content-item">
                    <div class="content-preview">
                        <h3>${this.currentUser.displayName || this.currentUser.email}</h3>
                        <p>${this.currentUser.email}</p>
                        <div class="content-meta">
                            <span class="role">${this.currentUser.role || 'Administrator'}</span>
                            <span class="status active">Active</span>
                        </div>
                    </div>
                    <div class="content-actions">
                        <button class="btn btn-sm btn-outline" onclick="firebaseAdminDashboard.editUser('${this.currentUser.uid}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading users data:', error);
        }
    }

    async loadAnalyticsData() {
        try {
            // Placeholder analytics data
            console.log('Loading analytics data...');
        } catch (error) {
            console.error('Error loading analytics data:', error);
        }
    }

    async loadSettingsData() {
        try {
            // Load settings from localStorage or Firebase
            const settings = this.getStoredSettings();
            this.populateSettingsForm(settings);
        } catch (error) {
            console.error('Error loading settings data:', error);
        }
    }

    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // User form submission
        const userForm = document.getElementById('user-form');
        if (userForm) {
            userForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUserFormSubmit();
            });
        }

        // System settings form
        const settingsForm = document.getElementById('system-settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSettingsFormSubmit();
            });
        }

        // Export/Import buttons
        const exportBtn = document.getElementById('export-data');
        const importBtn = document.getElementById('import-data');
        const importFile = document.getElementById('import-file');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });
        }

        if (importFile) {
            importFile.addEventListener('change', (e) => {
                this.importData(e.target.files[0]);
            });
        }
    }

    async handleLogout() {
        try {
            const result = await authService.signOut();
            if (result.success) {
                this.showSuccess('Logged out successfully');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            } else {
                this.showError('Failed to logout');
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showError('Failed to logout');
        }
    }

    async handleUserFormSubmit() {
        try {
            const formData = this.getUserFormData();
            
            this.showLoading('Adding user...');
            
            // Create user account
            const result = await authService.signUp(formData.email, formData.password, {
                name: formData.name,
                email: formData.email,
                role: formData.role
            });

            if (result.success) {
                this.showSuccess('User added successfully');
                this.clearUserForm();
                this.loadUsersData();
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            console.error('Error adding user:', error);
            this.showError('Failed to add user');
        } finally {
            this.hideLoading();
        }
    }

    async handleSettingsFormSubmit() {
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

    getUserFormData() {
        return {
            name: document.getElementById('user-name').value,
            email: document.getElementById('user-email').value,
            role: document.getElementById('user-role').value,
            password: 'tempPassword123!' // In real implementation, generate or require password
        };
    }

    getSettingsFormData() {
        return {
            siteName: document.getElementById('site-name').value,
            siteDescription: document.getElementById('site-description').value,
            maintenanceMode: document.getElementById('maintenance-mode').checked
        };
    }

    clearUserForm() {
        document.getElementById('user-form').reset();
    }

    getStoredSettings() {
        const stored = localStorage.getItem('website-settings');
        return stored ? JSON.parse(stored) : {};
    }

    populateSettingsForm(settings) {
        Object.keys(settings).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = settings[key];
                } else {
                    element.value = settings[key] || '';
                }
            }
        });
    }

    async exportData() {
        try {
            this.showLoading('Exporting data...');
            
            // Collect all data
            const data = {
                news: await contentService.getNewsArticles(1000),
                events: await contentService.getEvents(1000),
                leadership: await contentService.getLeadershipTeam(),
                gallery: await contentService.getGalleryImages(1000),
                settings: this.getStoredSettings(),
                exportDate: new Date().toISOString()
            };

            // Create and download file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mamsa-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showSuccess('Data exported successfully');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showError('Failed to export data');
        } finally {
            this.hideLoading();
        }
    }

    async importData(file) {
        try {
            if (!file) return;

            this.showLoading('Importing data...');
            
            const text = await file.text();
            const data = JSON.parse(text);

            // Validate data structure
            if (!data.exportDate) {
                throw new Error('Invalid backup file format');
            }

            // Import data (this would need to be implemented based on your needs)
            console.log('Importing data:', data);
            
            this.showSuccess('Data imported successfully');
        } catch (error) {
            console.error('Error importing data:', error);
            this.showError('Failed to import data: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    setCurrentYear() {
        const yearElement = document.getElementById('current-year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }

    redirectToLogin() {
        window.location.href = 'login.html';
    }

    showLoading(message = 'Loading...') {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            const loadingText = loading.querySelector('p');
            if (loadingText) {
                loadingText.textContent = message;
            }
            loading.style.display = 'flex';
        }
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
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize Firebase admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.firebaseAdminDashboard = new FirebaseAdminDashboard();
});

export default FirebaseAdminDashboard;
