// Firebase Configuration for Madi Makerere Students Association
// Replace with your actual Firebase project configuration

const firebaseConfig = {
    apiKey: "AIzaSyBx0SpQdpijzJTo7Qx6uEaaBH53V3gp9aU",
    authDomain: "mamsa-2e7ef.firebaseapp.com",
    projectId: "mamsa-2e7ef",
    storageBucket: "mamsa-2e7ef.firebasestorage.app",
    messagingSenderId: "827186522983",
    appId: "1:827186522983:web:79f6640c2529e5d0c19dc2",
    measurementId: "G-ZQPLHJ29CY"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

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
