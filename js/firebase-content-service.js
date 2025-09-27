// Firebase Content Management Service
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
    onSnapshot,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, COLLECTIONS, CONTENT_TYPES } from '../firebase-config.js';

class FirebaseContentService {
    constructor() {
        this.isOnline = navigator.onLine;
        this.setupOnlineListener();
    }

    setupOnlineListener() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Connection restored');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Connection lost');
        });
    }

    // Generic CRUD operations
    async createDocument(collectionName, data) {
        try {
            const docRef = await addDoc(collection(db, collectionName), {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error creating document:', error);
            return { success: false, error: error.message };
        }
    }

    async getDocument(collectionName, docId) {
        try {
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
            } else {
                return { success: false, error: 'Document not found' };
            }
        } catch (error) {
            console.error('Error getting document:', error);
            return { success: false, error: error.message };
        }
    }

    async updateDocument(collectionName, docId, data) {
        try {
            const docRef = doc(db, collectionName, docId);
            await updateDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating document:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteDocument(collectionName, docId) {
        try {
            await deleteDoc(doc(db, collectionName, docId));
            return { success: true };
        } catch (error) {
            console.error('Error deleting document:', error);
            return { success: false, error: error.message };
        }
    }

    async getCollection(collectionName, orderByField = 'createdAt', orderDirection = 'desc') {
        try {
            const q = query(collection(db, collectionName), orderBy(orderByField, orderDirection));
            const querySnapshot = await getDocs(q);
            const documents = [];
            
            querySnapshot.forEach((doc) => {
                documents.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: documents };
        } catch (error) {
            console.error('Error getting collection:', error);
            return { success: false, error: error.message };
        }
    }

    // Page Content Management
    async getPageContent(pageType) {
        try {
            const q = query(
                collection(db, COLLECTIONS.PAGES), 
                where('pageType', '==', pageType)
            );
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { success: true, data: { id: doc.id, ...doc.data() } };
            } else {
                return { success: false, error: 'Page content not found' };
            }
        } catch (error) {
            console.error('Error getting page content:', error);
            return { success: false, error: error.message };
        }
    }

    async updatePageContent(pageType, content) {
        try {
            const q = query(
                collection(db, COLLECTIONS.PAGES), 
                where('pageType', '==', pageType)
            );
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, {
                    content: content,
                    updatedAt: serverTimestamp()
                });
                return { success: true };
            } else {
                // Create new page content if it doesn't exist
                const result = await this.createDocument(COLLECTIONS.PAGES, {
                    pageType: pageType,
                    content: content
                });
                return result;
            }
        } catch (error) {
            console.error('Error updating page content:', error);
            return { success: false, error: error.message };
        }
    }

    // News Management
    async getNewsArticles(limit = 10) {
        try {
            const q = query(
                collection(db, COLLECTIONS.NEWS), 
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const articles = [];
            
            querySnapshot.forEach((doc) => {
                articles.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: articles.slice(0, limit) };
        } catch (error) {
            console.error('Error getting news articles:', error);
            return { success: false, error: error.message };
        }
    }

    async createNewsArticle(articleData) {
        const data = {
            ...articleData,
            published: false,
            views: 0,
            likes: 0
        };
        return await this.createDocument(COLLECTIONS.NEWS, data);
    }

    async updateNewsArticle(articleId, articleData) {
        return await this.updateDocument(COLLECTIONS.NEWS, articleId, articleData);
    }

    async publishNewsArticle(articleId) {
        return await this.updateDocument(COLLECTIONS.NEWS, articleId, { 
            published: true,
            publishedAt: serverTimestamp()
        });
    }

    // Events Management
    async getEvents(limit = 10) {
        try {
            const q = query(
                collection(db, COLLECTIONS.EVENTS), 
                orderBy('eventDate', 'asc')
            );
            const querySnapshot = await getDocs(q);
            const events = [];
            
            querySnapshot.forEach((doc) => {
                events.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: events.slice(0, limit) };
        } catch (error) {
            console.error('Error getting events:', error);
            return { success: false, error: error.message };
        }
    }

    async createEvent(eventData) {
        return await this.createDocument(COLLECTIONS.EVENTS, eventData);
    }

    async updateEvent(eventId, eventData) {
        return await this.updateDocument(COLLECTIONS.EVENTS, eventId, eventData);
    }

    // Leadership Management
    async getLeadershipTeam() {
        try {
            const q = query(
                collection(db, COLLECTIONS.LEADERSHIP), 
                orderBy('position', 'asc')
            );
            const querySnapshot = await getDocs(q);
            const team = [];
            
            querySnapshot.forEach((doc) => {
                team.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: team };
        } catch (error) {
            console.error('Error getting leadership team:', error);
            return { success: false, error: error.message };
        }
    }

    async updateLeadershipMember(memberId, memberData) {
        return await this.updateDocument(COLLECTIONS.LEADERSHIP, memberId, memberData);
    }

    // Gallery Management
    async getGalleryImages(limit = 20) {
        try {
            const q = query(
                collection(db, COLLECTIONS.GALLERY), 
                orderBy('uploadedAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const images = [];
            
            querySnapshot.forEach((doc) => {
                images.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: images.slice(0, limit) };
        } catch (error) {
            console.error('Error getting gallery images:', error);
            return { success: false, error: error.message };
        }
    }

    async uploadImage(file, path) {
        try {
            const storageRef = ref(storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            return { 
                success: true, 
                url: downloadURL,
                path: snapshot.ref.fullPath
            };
        } catch (error) {
            console.error('Error uploading image:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteImage(imagePath) {
        try {
            const imageRef = ref(storage, imagePath);
            await deleteObject(imageRef);
            return { success: true };
        } catch (error) {
            console.error('Error deleting image:', error);
            return { success: false, error: error.message };
        }
    }

    // Real-time listeners
    setupRealtimeListener(collectionName, callback) {
        const q = query(collection(db, collectionName), orderBy('updatedAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const documents = [];
            snapshot.forEach((doc) => {
                documents.push({ id: doc.id, ...doc.data() });
            });
            callback({ success: true, data: documents });
        }, (error) => {
            console.error('Realtime listener error:', error);
            callback({ success: false, error: error.message });
        });
    }

    // Batch operations
    async batchUpdate(documents) {
        try {
            const batch = writeBatch(db);
            
            documents.forEach(({ collectionName, docId, data }) => {
                const docRef = doc(db, collectionName, docId);
                batch.update(docRef, {
                    ...data,
                    updatedAt: serverTimestamp()
                });
            });
            
            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error in batch update:', error);
            return { success: false, error: error.message };
        }
    }

    // Content validation
    validateContent(content, type) {
        const errors = [];
        
        switch (type) {
            case 'news':
                if (!content.title || content.title.trim().length < 5) {
                    errors.push('Title must be at least 5 characters long');
                }
                if (!content.content || content.content.trim().length < 50) {
                    errors.push('Content must be at least 50 characters long');
                }
                break;
                
            case 'event':
                if (!content.title || content.title.trim().length < 5) {
                    errors.push('Event title must be at least 5 characters long');
                }
                if (!content.eventDate) {
                    errors.push('Event date is required');
                }
                if (!content.location || content.location.trim().length < 3) {
                    errors.push('Event location is required');
                }
                break;
                
            case 'leadership':
                if (!content.name || content.name.trim().length < 2) {
                    errors.push('Name must be at least 2 characters long');
                }
                if (!content.position || content.position.trim().length < 3) {
                    errors.push('Position must be at least 3 characters long');
                }
                break;
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Export singleton instance
export const contentService = new FirebaseContentService();
export default contentService;
