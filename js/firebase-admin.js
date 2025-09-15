// Firebase-Integrated Admin Panel JavaScript
// This file replaces the existing admin.js with Firebase integration

class FirebaseAdminPanel {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Wait for Firebase to initialize
            await this.waitForFirebase();
            
            // Check authentication
            await this.checkAuthentication();
            
            // Initialize admin panel
            await this.initializeAdminPanel();
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Admin panel initialization error:', error);
            this.showError('Failed to initialize admin panel');
        }
    }

    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.db && window.auth) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    async checkAuthentication() {
        // For now, use localStorage authentication
        // This will be replaced with Firebase Auth
        const isLoggedIn = localStorage.getItem('adminLoggedIn');
        const currentPage = window.location.pathname.split('/').pop();
        
        if (currentPage === 'login.html') {
            if (isLoggedIn === 'true') {
                window.location.href = 'admin.html';
            }
        } else if (currentPage === 'admin.html') {
            if (isLoggedIn !== 'true') {
                window.location.href = 'login.html';
            } else {
                const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
                const adminUserName = document.getElementById('admin-user-name');
                if (adminUserName) {
                    adminUserName.textContent = adminUser.name || 'Admin User';
                }
            }
        }
    }

    async initializeAdminPanel() {
        try {
            // Initialize content management interface
            await this.loadContentManager();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadInitialData();

            // Show success message
            this.showSuccess('Admin panel initialized successfully');
        } catch (error) {
            console.error('Admin panel setup error:', error);
            this.showError('Failed to set up admin panel');
        }
    }

    async loadContentManager() {
        try {
            // Initialize content manager
            if (window.ContentManager) {
                await window.ContentManager.init();
            }
        } catch (error) {
            console.error('Content manager loading error:', error);
        }
    }

    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await this.logout();
            });
        }

        // Backup button
        const backupBtn = document.getElementById('backup-data');
        if (backupBtn) {
            backupBtn.addEventListener('click', async () => {
                await this.createBackup();
            });
        }

        // Restore button
        const restoreBtn = document.getElementById('import-data');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', () => {
                this.showRestoreDialog();
            });
        }
    }

    async loadInitialData() {
        try {
            this.showLoading('Loading content...');
            
            // Load from localStorage for now
            const adminData = JSON.parse(localStorage.getItem('adminContentData') || '{}');
            
            // Update stats
            this.updateContentStats('news', adminData.news?.length || 0);
            this.updateContentStats('events', adminData.events?.length || 0);
            this.updateContentStats('leadership', adminData.leadership?.length || 0);
            this.updateContentStats('gallery', adminData.gallery?.length || 0);

            this.hideLoading();
        } catch (error) {
            console.error('Load initial data error:', error);
            this.hideLoading();
            this.showError('Failed to load initial data');
        }
    }

    updateContentStats(type, count) {
        const statElement = document.getElementById(`total-${type}`);
        if (statElement) {
            statElement.textContent = count;
        }
    }

    async logout() {
        try {
            this.showLoading('Logging out...');
            
            // Clear localStorage
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminUser');
            
            // Redirect to login
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            this.showError('Logout failed');
        }
    }

    async createBackup() {
        try {
            this.showLoading('Creating backup...');
            
            // Get current data
            const adminData = JSON.parse(localStorage.getItem('adminContentData') || '{}');
            
            // Create backup
            const backup = {
                timestamp: new Date().toISOString(),
                data: adminData
            };
            
            // Download backup
            this.downloadBackup(backup);
            
            this.showSuccess('Backup created successfully');
        } catch (error) {
            console.error('Backup creation error:', error);
            this.showError('Backup creation failed');
        } finally {
            this.hideLoading();
        }
    }

    downloadBackup(backup) {
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `backup_${backup.timestamp}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }

    showRestoreDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.restoreBackup(file);
            }
        };
        
        input.click();
    }

    async restoreBackup(file) {
        try {
            this.showLoading('Restoring backup...');
            
            const text = await file.text();
            const backup = JSON.parse(text);
            
            // Restore data
            localStorage.setItem('adminContentData', JSON.stringify(backup.data));
            
            this.showSuccess('Backup restored successfully');
            // Reload data
            await this.loadInitialData();
        } catch (error) {
            console.error('Backup restoration error:', error);
            this.showError('Backup restoration failed');
        } finally {
            this.hideLoading();
        }
    }

    showLoading(message = 'Loading...') {
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.querySelector('.loading-overlay');
        if (loading) {
            loading.remove();
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FirebaseAdminPanel();
});
