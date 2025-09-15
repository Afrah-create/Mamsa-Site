// Firebase Configuration for Madi Makerere Students Association
// Replace with your actual Firebase project configuration

const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "madi-makerere-students.firebaseapp.com",
    projectId: "madi-makerere-students",
    storageBucket: "madi-makerere-students.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Database Collections Configuration
export const COLLECTIONS = {
    PAGES: 'pages',
    NEWS: 'news',
    EVENTS: 'events',
    LEADERSHIP: 'leadership',
    GALLERY: 'gallery',
    USERS: 'users',
    SETTINGS: 'settings',
    BACKUPS: 'backups'
};

// User Roles
export const USER_ROLES = {
    ADMIN: 'admin',
    EDITOR: 'editor',
    CONTRIBUTOR: 'contributor'
};

// Content Types
export const CONTENT_TYPES = {
    HOMEPAGE: 'homepage',
    ABOUT: 'about',
    LEADERSHIP: 'leadership',
    EVENTS: 'events',
    NEWS: 'news',
    GALLERY: 'gallery',
    SERVICES: 'services',
    CONTACT: 'contact'
};

export default app;
