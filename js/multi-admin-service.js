// Multi-Admin Support and Conflict Resolution
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase-config.js';
import AuthService from './auth-service.js';

class MultiAdminService {
    constructor() {
        this.activeUsers = new Map();
        this.editingLocks = new Map();
        this.conflictResolution = {
            strategy: 'last-write-wins', // or 'merge', 'manual'
            autoResolve: true
        };
    }

    // Track active users
    async trackActiveUser() {
        try {
            const user = AuthService.currentUser;
            if (!user) return;

            const userDoc = doc(db, COLLECTIONS.USERS, user.uid);
            
            // Update last seen timestamp
            await updateDoc(userDoc, {
                lastSeen: serverTimestamp(),
                isOnline: true
            });

            // Set up real-time listener for this user
            const unsubscribe = onSnapshot(userDoc, (doc) => {
                if (doc.exists()) {
                    const userData = doc.data();
                    this.activeUsers.set(user.uid, {
                        ...userData,
                        lastSeen: userData.lastSeen?.toDate(),
                        isOnline: userData.isOnline
                    });
                }
            });

            // Clean up listener when user goes offline
            window.addEventListener('beforeunload', () => {
                this.setUserOffline(user.uid);
            });

            return unsubscribe;
        } catch (error) {
            console.error('Track active user error:', error);
        }
    }

    // Set user as offline
    async setUserOffline(uid) {
        try {
            const userDoc = doc(db, COLLECTIONS.USERS, uid);
            await updateDoc(userDoc, {
                isOnline: false,
                lastSeen: serverTimestamp()
            });
        } catch (error) {
            console.error('Set user offline error:', error);
        }
    }

    // Get active users
    getActiveUsers() {
        return Array.from(this.activeUsers.values()).filter(user => user.isOnline);
    }

    // Check if content is being edited by another user
    async checkEditingLock(contentId, contentType) {
        try {
            const lockDoc = doc(db, 'editing_locks', `${contentType}_${contentId}`);
            const lockSnapshot = await getDoc(lockDoc);
            
            if (lockSnapshot.exists()) {
                const lockData = lockSnapshot.data();
                const now = new Date();
                const lockTime = lockData.lockedAt.toDate();
                
                // Check if lock is still valid (5 minutes timeout)
                if (now.getTime() - lockTime.getTime() < 5 * 60 * 1000) {
                    return {
                        isLocked: true,
                        lockedBy: lockData.lockedBy,
                        lockedAt: lockTime,
                        lockId: lockSnapshot.id
                    };
                } else {
                    // Lock expired, remove it
                    await deleteDoc(lockDoc);
                }
            }
            
            return { isLocked: false };
        } catch (error) {
            console.error('Check editing lock error:', error);
            return { isLocked: false };
        }
    }

    // Acquire editing lock
    async acquireEditingLock(contentId, contentType) {
        try {
            const user = AuthService.currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Check if already locked
            const lockCheck = await this.checkEditingLock(contentId, contentType);
            if (lockCheck.isLocked && lockCheck.lockedBy !== user.uid) {
                return {
                    success: false,
                    error: 'Content is being edited by another user',
                    lockedBy: lockCheck.lockedBy,
                    lockedAt: lockCheck.lockedAt
                };
            }

            // Create or update lock
            const lockDoc = doc(db, 'editing_locks', `${contentType}_${contentId}`);
            await setDoc(lockDoc, {
                contentId,
                contentType,
                lockedBy: user.uid,
                lockedAt: serverTimestamp(),
                userDisplayName: user.displayName || user.email
            });

            // Store lock reference for cleanup
            this.editingLocks.set(`${contentType}_${contentId}`, lockDoc);

            return { success: true };
        } catch (error) {
            console.error('Acquire editing lock error:', error);
            return { success: false, error: error.message };
        }
    }

    // Release editing lock
    async releaseEditingLock(contentId, contentType) {
        try {
            const lockDoc = doc(db, 'editing_locks', `${contentType}_${contentId}`);
            await deleteDoc(lockDoc);
            
            // Remove from local tracking
            this.editingLocks.delete(`${contentType}_${contentId}`);
            
            return { success: true };
        } catch (error) {
            console.error('Release editing lock error:', error);
            return { success: false, error: error.message };
        }
    }

    // Release all locks for current user
    async releaseAllLocks() {
        try {
            const user = AuthService.currentUser;
            if (!user) return;

            const locksQuery = query(
                collection(db, 'editing_locks'),
                where('lockedBy', '==', user.uid)
            );
            
            const locksSnapshot = await getDocs(locksQuery);
            const batch = writeBatch(db);
            
            locksSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            this.editingLocks.clear();
            
            return { success: true };
        } catch (error) {
            console.error('Release all locks error:', error);
            return { success: false, error: error.message };
        }
    }

    // Handle content conflicts
    async handleContentConflict(contentId, contentType, localChanges, serverData) {
        try {
            switch (this.conflictResolution.strategy) {
                case 'last-write-wins':
                    return await this.resolveLastWriteWins(contentId, contentType, localChanges, serverData);
                
                case 'merge':
                    return await this.resolveMerge(contentId, contentType, localChanges, serverData);
                
                case 'manual':
                    return await this.resolveManual(contentId, contentType, localChanges, serverData);
                
                default:
                    throw new Error('Unknown conflict resolution strategy');
            }
        } catch (error) {
            console.error('Handle content conflict error:', error);
            return { success: false, error: error.message };
        }
    }

    // Last write wins strategy
    async resolveLastWriteWins(contentId, contentType, localChanges, serverData) {
        try {
            const localTimestamp = localChanges.updatedAt || new Date();
            const serverTimestamp = serverData.updatedAt || new Date();
            
            if (localTimestamp > serverTimestamp) {
                // Local changes are newer, proceed with update
                return { success: true, action: 'proceed', data: localChanges };
            } else {
                // Server data is newer, show conflict
                return {
                    success: false,
                    action: 'conflict',
                    message: 'Content was modified by another user. Please refresh and try again.',
                    serverData
                };
            }
        } catch (error) {
            console.error('Last write wins resolution error:', error);
            return { success: false, error: error.message };
        }
    }

    // Merge strategy
    async resolveMerge(contentId, contentType, localChanges, serverData) {
        try {
            // Simple merge - combine non-conflicting fields
            const mergedData = { ...serverData, ...localChanges };
            
            // Remove system fields that shouldn't be merged
            delete mergedData.createdAt;
            delete mergedData.createdBy;
            
            // Add merge metadata
            mergedData.updatedAt = serverTimestamp();
            mergedData.updatedBy = AuthService.currentUser?.uid;
            mergedData.mergedAt = serverTimestamp();
            mergedData.mergedBy = AuthService.currentUser?.uid;
            
            return { success: true, action: 'proceed', data: mergedData };
        } catch (error) {
            console.error('Merge resolution error:', error);
            return { success: false, error: error.message };
        }
    }

    // Manual resolution strategy
    async resolveManual(contentId, contentType, localChanges, serverData) {
        try {
            // Store conflict for manual resolution
            const conflictDoc = {
                contentId,
                contentType,
                localChanges,
                serverData,
                conflictAt: serverTimestamp(),
                resolvedBy: null,
                resolution: null
            };
            
            await addDoc(collection(db, 'content_conflicts'), conflictDoc);
            
            return {
                success: false,
                action: 'manual',
                message: 'Content conflict detected. Please resolve manually in the admin panel.',
                conflictId: conflictDoc.id
            };
        } catch (error) {
            console.error('Manual resolution error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get content edit history
    async getContentHistory(contentId, contentType, limitCount = 20) {
        try {
            const q = query(
                collection(db, 'content_history'),
                where('contentId', '==', contentId),
                where('contentType', '==', contentType),
                orderBy('updatedAt', 'desc'),
                limit(limitCount)
            );
            
            const querySnapshot = await getDocs(q);
            const history = [];
            
            querySnapshot.forEach((doc) => {
                history.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: history };
        } catch (error) {
            console.error('Get content history error:', error);
            return { success: false, error: error.message };
        }
    }

    // Log content changes
    async logContentChange(contentId, contentType, changes, action) {
        try {
            const user = AuthService.currentUser;
            if (!user) return;

            const historyDoc = {
                contentId,
                contentType,
                action, // 'create', 'update', 'delete'
                changes,
                updatedBy: user.uid,
                updatedAt: serverTimestamp(),
                userDisplayName: user.displayName || user.email
            };
            
            await addDoc(collection(db, 'content_history'), historyDoc);
        } catch (error) {
            console.error('Log content change error:', error);
        }
    }

    // Get user activity
    async getUserActivity(userId, limitCount = 50) {
        try {
            const q = query(
                collection(db, 'content_history'),
                where('updatedBy', '==', userId),
                orderBy('updatedAt', 'desc'),
                limit(limitCount)
            );
            
            const querySnapshot = await getDocs(q);
            const activity = [];
            
            querySnapshot.forEach((doc) => {
                activity.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: activity };
        } catch (error) {
            console.error('Get user activity error:', error);
            return { success: false, error: error.message };
        }
    }

    // Set conflict resolution strategy
    setConflictResolutionStrategy(strategy) {
        if (['last-write-wins', 'merge', 'manual'].includes(strategy)) {
            this.conflictResolution.strategy = strategy;
            return { success: true };
        }
        return { success: false, error: 'Invalid strategy' };
    }

    // Get editing status for content
    async getEditingStatus(contentId, contentType) {
        try {
            const lockCheck = await this.checkEditingLock(contentId, contentType);
            const history = await this.getContentHistory(contentId, contentType, 5);
            
            return {
                success: true,
                data: {
                    isLocked: lockCheck.isLocked,
                    lockedBy: lockCheck.lockedBy,
                    lockedAt: lockCheck.lockedAt,
                    recentChanges: history.success ? history.data : []
                }
            };
        } catch (error) {
            console.error('Get editing status error:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new MultiAdminService();
