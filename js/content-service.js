// Content Management Service
import { 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    where, 
    limit,
    startAfter,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, COLLECTIONS, CONTENT_TYPES } from './firebase-config.js';
import AuthService from './auth-service.js';

class ContentService {
    constructor() {
        this.batchSize = 20; // For pagination
    }

    // Generic CRUD operations
    async create(collectionName, data) {
        try {
            const docRef = await addDoc(collection(db, collectionName), {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: AuthService.currentUser?.uid,
                updatedBy: AuthService.currentUser?.uid
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Create error:', error);
            return { success: false, error: error.message };
        }
    }

    async read(collectionName, id) {
        try {
            const docRef = doc(db, collectionName, id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
            } else {
                return { success: false, error: 'Document not found' };
            }
        } catch (error) {
            console.error('Read error:', error);
            return { success: false, error: error.message };
        }
    }

    async update(collectionName, id, data) {
        try {
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp(),
                updatedBy: AuthService.currentUser?.uid
            });
            return { success: true };
        } catch (error) {
            console.error('Update error:', error);
            return { success: false, error: error.message };
        }
    }

    async delete(collectionName, id) {
        try {
            await deleteDoc(doc(db, collectionName, id));
            return { success: true };
        } catch (error) {
            console.error('Delete error:', error);
            return { success: false, error: error.message };
        }
    }

    async list(collectionName, filters = {}, orderByField = 'createdAt', orderDirection = 'desc') {
        try {
            let q = collection(db, collectionName);
            
            // Apply filters
            Object.keys(filters).forEach(key => {
                q = query(q, where(key, '==', filters[key]));
            });
            
            // Apply ordering
            q = query(q, orderBy(orderByField, orderDirection));
            
            const querySnapshot = await getDocs(q);
            const data = [];
            
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data };
        } catch (error) {
            console.error('List error:', error);
            return { success: false, error: error.message };
        }
    }

    // Page-specific operations
    async getPageContent(pageType) {
        try {
            const q = query(
                collection(db, COLLECTIONS.PAGES),
                where('pageType', '==', pageType),
                orderBy('updatedAt', 'desc'),
                limit(1)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { success: true, data: { id: doc.id, ...doc.data() } };
            } else {
                return { success: false, error: 'Page content not found' };
            }
        } catch (error) {
            console.error('Get page content error:', error);
            return { success: false, error: error.message };
        }
    }

    async updatePageContent(pageType, content) {
        try {
            // Check if page exists
            const existingPage = await this.getPageContent(pageType);
            
            if (existingPage.success) {
                // Update existing page
                return await this.update(COLLECTIONS.PAGES, existingPage.data.id, {
                    content,
                    pageType
                });
            } else {
                // Create new page
                return await this.create(COLLECTIONS.PAGES, {
                    content,
                    pageType
                });
            }
        } catch (error) {
            console.error('Update page content error:', error);
            return { success: false, error: error.message };
        }
    }

    // News operations
    async getNews(limitCount = 10, lastDoc = null) {
        try {
            let q = query(
                collection(db, COLLECTIONS.NEWS),
                orderBy('publishedAt', 'desc'),
                limit(limitCount)
            );
            
            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }
            
            const querySnapshot = await getDocs(q);
            const data = [];
            
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data, lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] };
        } catch (error) {
            console.error('Get news error:', error);
            return { success: false, error: error.message };
        }
    }

    async getNewsByCategory(category, limitCount = 10) {
        try {
            const q = query(
                collection(db, COLLECTIONS.NEWS),
                where('category', '==', category),
                orderBy('publishedAt', 'desc'),
                limit(limitCount)
            );
            
            const querySnapshot = await getDocs(q);
            const data = [];
            
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data };
        } catch (error) {
            console.error('Get news by category error:', error);
            return { success: false, error: error.message };
        }
    }

    // Events operations
    async getEvents(limitCount = 10, upcoming = true) {
        try {
            const now = new Date();
            const q = query(
                collection(db, COLLECTIONS.EVENTS),
                where('eventDate', upcoming ? '>=' : '<', now),
                orderBy('eventDate', upcoming ? 'asc' : 'desc'),
                limit(limitCount)
            );
            
            const querySnapshot = await getDocs(q);
            const data = [];
            
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data };
        } catch (error) {
            console.error('Get events error:', error);
            return { success: false, error: error.message };
        }
    }

    // Leadership operations
    async getLeadership() {
        try {
            const q = query(
                collection(db, COLLECTIONS.LEADERSHIP),
                orderBy('position', 'asc')
            );
            
            const querySnapshot = await getDocs(q);
            const data = [];
            
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data };
        } catch (error) {
            console.error('Get leadership error:', error);
            return { success: false, error: error.message };
        }
    }

    // Gallery operations
    async getGalleryImages(category = null, limitCount = 20) {
        try {
            let q = query(
                collection(db, COLLECTIONS.GALLERY),
                orderBy('uploadedAt', 'desc'),
                limit(limitCount)
            );
            
            if (category) {
                q = query(q, where('category', '==', category));
            }
            
            const querySnapshot = await getDocs(q);
            const data = [];
            
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data };
        } catch (error) {
            console.error('Get gallery images error:', error);
            return { success: false, error: error.message };
        }
    }

    // File upload operations
    async uploadFile(file, path) {
        try {
            const storageRef = ref(storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            return { success: true, url: downloadURL, path: snapshot.ref.fullPath };
        } catch (error) {
            console.error('File upload error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteFile(path) {
        try {
            const fileRef = ref(storage, path);
            await deleteObject(fileRef);
            return { success: true };
        } catch (error) {
            console.error('File delete error:', error);
            return { success: false, error: error.message };
        }
    }

    // Batch operations
    async batchCreate(collectionName, items) {
        try {
            const batch = writeBatch(db);
            
            items.forEach(item => {
                const docRef = doc(collection(db, collectionName));
                batch.set(docRef, {
                    ...item,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    createdBy: AuthService.currentUser?.uid,
                    updatedBy: AuthService.currentUser?.uid
                });
            });
            
            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Batch create error:', error);
            return { success: false, error: error.message };
        }
    }

    async batchUpdate(collectionName, updates) {
        try {
            const batch = writeBatch(db);
            
            Object.keys(updates).forEach(id => {
                const docRef = doc(db, collectionName, id);
                batch.update(docRef, {
                    ...updates[id],
                    updatedAt: serverTimestamp(),
                    updatedBy: AuthService.currentUser?.uid
                });
            });
            
            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Batch update error:', error);
            return { success: false, error: error.message };
        }
    }

    // Search functionality
    async searchContent(collectionName, searchTerm, fields = []) {
        try {
            // Note: Firestore doesn't support full-text search natively
            // This is a basic implementation - consider using Algolia or similar for production
            const q = query(collection(db, collectionName));
            const querySnapshot = await getDocs(q);
            const data = [];
            
            querySnapshot.forEach((doc) => {
                const docData = { id: doc.id, ...doc.data() };
                
                // Simple text search in specified fields
                const searchLower = searchTerm.toLowerCase();
                const matches = fields.some(field => {
                    const value = docData[field];
                    return value && value.toString().toLowerCase().includes(searchLower);
                });
                
                if (matches) {
                    data.push(docData);
                }
            });
            
            return { success: true, data };
        } catch (error) {
            console.error('Search error:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new ContentService();
