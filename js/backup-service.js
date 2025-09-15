// Backup and Recovery Service
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase-config.js';
import ContentService from './content-service.js';
import AuthService from './auth-service.js';

class BackupService {
    constructor() {
        this.backupInterval = null;
        this.autoBackupEnabled = false;
    }

    // Create a complete backup of all content
    async createBackup(backupName = null) {
        try {
            const timestamp = new Date().toISOString();
            const backupId = backupName || `backup_${timestamp}`;
            
            const backup = {
                id: backupId,
                name: backupName || `Backup ${new Date().toLocaleDateString()}`,
                timestamp: timestamp,
                createdBy: AuthService.currentUser?.uid,
                version: '1.0',
                collections: {}
            };

            // Backup each collection
            const collectionsToBackup = [
                COLLECTIONS.PAGES,
                COLLECTIONS.NEWS,
                COLLECTIONS.EVENTS,
                COLLECTIONS.LEADERSHIP,
                COLLECTIONS.GALLERY,
                COLLECTIONS.SETTINGS
            ];

            for (const collectionName of collectionsToBackup) {
                const result = await ContentService.list(collectionName);
                if (result.success) {
                    backup.collections[collectionName] = result.data;
                } else {
                    console.error(`Failed to backup collection ${collectionName}:`, result.error);
                }
            }

            // Store backup metadata
            await addDoc(collection(db, COLLECTIONS.BACKUPS), backup);

            // Export backup as JSON file
            this.downloadBackup(backup);

            return { success: true, backup };
        } catch (error) {
            console.error('Backup creation error:', error);
            return { success: false, error: error.message };
        }
    }

    // Download backup as JSON file
    downloadBackup(backup) {
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${backup.id}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }

    // Restore from backup
    async restoreBackup(backupData) {
        try {
            if (!backupData || !backupData.collections) {
                throw new Error('Invalid backup data');
            }

            const restoreResults = {};

            // Restore each collection
            for (const [collectionName, documents] of Object.entries(backupData.collections)) {
                try {
                    // Clear existing data (optional - you might want to ask for confirmation)
                    // await this.clearCollection(collectionName);
                    
                    // Restore documents
                    const batchResult = await ContentService.batchCreate(collectionName, documents);
                    restoreResults[collectionName] = batchResult;
                } catch (error) {
                    console.error(`Failed to restore collection ${collectionName}:`, error);
                    restoreResults[collectionName] = { success: false, error: error.message };
                }
            }

            return { success: true, results: restoreResults };
        } catch (error) {
            console.error('Backup restoration error:', error);
            return { success: false, error: error.message };
        }
    }

    // Upload and restore from file
    async restoreFromFile(file) {
        try {
            const text = await file.text();
            const backupData = JSON.parse(text);
            return await this.restoreBackup(backupData);
        } catch (error) {
            console.error('File restoration error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get list of available backups
    async getBackups(limitCount = 20) {
        try {
            const q = query(
                collection(db, COLLECTIONS.BACKUPS),
                orderBy('timestamp', 'desc'),
                limit(limitCount)
            );
            
            const querySnapshot = await getDocs(q);
            const backups = [];
            
            querySnapshot.forEach((doc) => {
                backups.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: backups };
        } catch (error) {
            console.error('Get backups error:', error);
            return { success: false, error: error.message };
        }
    }

    // Enable automatic daily backups
    enableAutoBackup() {
        if (this.autoBackupEnabled) {
            return;
        }

        this.autoBackupEnabled = true;
        
        // Create backup every 24 hours
        this.backupInterval = setInterval(async () => {
            try {
                await this.createBackup();
                console.log('Automatic backup completed');
            } catch (error) {
                console.error('Automatic backup failed:', error);
            }
        }, 24 * 60 * 60 * 1000); // 24 hours
    }

    // Disable automatic backups
    disableAutoBackup() {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
        this.autoBackupEnabled = false;
    }

    // Send backup to admin email (requires email service setup)
    async sendBackupToEmail(backup, adminEmail) {
        try {
            // This would require a backend service or email API
            // For now, we'll just log the action
            console.log(`Backup ${backup.id} would be sent to ${adminEmail}`);
            
            // In a real implementation, you might:
            // 1. Use a service like SendGrid, Mailgun, or AWS SES
            // 2. Create a Cloud Function to handle email sending
            // 3. Store the backup in cloud storage and send a download link
            
            return { success: true, message: 'Backup email functionality requires backend setup' };
        } catch (error) {
            console.error('Email backup error:', error);
            return { success: false, error: error.message };
        }
    }

    // Export specific content types
    async exportContent(contentTypes = []) {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                exportedBy: AuthService.currentUser?.uid,
                content: {}
            };

            const typesToExport = contentTypes.length > 0 ? contentTypes : [
                COLLECTIONS.PAGES,
                COLLECTIONS.NEWS,
                COLLECTIONS.EVENTS,
                COLLECTIONS.LEADERSHIP,
                COLLECTIONS.GALLERY
            ];

            for (const contentType of typesToExport) {
                const result = await ContentService.list(contentType);
                if (result.success) {
                    exportData.content[contentType] = result.data;
                }
            }

            this.downloadBackup(exportData);
            return { success: true, data: exportData };
        } catch (error) {
            console.error('Content export error:', error);
            return { success: false, error: error.message };
        }
    }

    // Import content from file
    async importContent(file) {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            if (!importData.content) {
                throw new Error('Invalid import file format');
            }

            const importResults = {};

            for (const [collectionName, documents] of Object.entries(importData.content)) {
                try {
                    const batchResult = await ContentService.batchCreate(collectionName, documents);
                    importResults[collectionName] = batchResult;
                } catch (error) {
                    console.error(`Failed to import collection ${collectionName}:`, error);
                    importResults[collectionName] = { success: false, error: error.message };
                }
            }

            return { success: true, results: importResults };
        } catch (error) {
            console.error('Content import error:', error);
            return { success: false, error: error.message };
        }
    }

    // Clear a collection (use with caution!)
    async clearCollection(collectionName) {
        try {
            const result = await ContentService.list(collectionName);
            if (result.success) {
                const batch = writeBatch(db);
                
                result.data.forEach(doc => {
                    const docRef = doc(db, collectionName, doc.id);
                    batch.delete(docRef);
                });
                
                await batch.commit();
                return { success: true };
            }
            return { success: false, error: 'Failed to fetch collection data' };
        } catch (error) {
            console.error('Clear collection error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get backup statistics
    async getBackupStats() {
        try {
            const backupsResult = await this.getBackups(100);
            if (!backupsResult.success) {
                return { success: false, error: backupsResult.error };
            }

            const backups = backupsResult.data;
            const stats = {
                totalBackups: backups.length,
                lastBackup: backups.length > 0 ? backups[0].timestamp : null,
                autoBackupEnabled: this.autoBackupEnabled,
                totalSize: this.calculateBackupSize(backups)
            };

            return { success: true, data: stats };
        } catch (error) {
            console.error('Get backup stats error:', error);
            return { success: false, error: error.message };
        }
    }

    calculateBackupSize(backups) {
        // Rough estimation of backup size
        let totalSize = 0;
        backups.forEach(backup => {
            totalSize += JSON.stringify(backup).length;
        });
        return totalSize;
    }
}

export default new BackupService();
