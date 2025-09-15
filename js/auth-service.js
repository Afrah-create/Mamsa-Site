// Firebase Authentication Service
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, COLLECTIONS, USER_ROLES } from './firebase-config.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.init();
    }

    init() {
        // Listen for authentication state changes
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserRole(user.uid);
                this.onAuthStateChange(true, user);
            } else {
                this.currentUser = null;
                this.userRole = null;
                this.onAuthStateChange(false, null);
            }
        });
    }

    async loadUserRole(uid) {
        try {
            const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
            if (userDoc.exists()) {
                this.userRole = userDoc.data().role;
            } else {
                this.userRole = USER_ROLES.CONTRIBUTOR; // Default role
            }
        } catch (error) {
            console.error('Error loading user role:', error);
            this.userRole = USER_ROLES.CONTRIBUTOR;
        }
    }

    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Log login activity
            await this.logActivity('login', user.uid);
            
            return { success: true, user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signUp(email, password, userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update user profile
            await updateProfile(user, {
                displayName: userData.displayName || userData.name
            });

            // Create user document in Firestore
            await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
                email: user.email,
                displayName: userData.displayName || userData.name,
                role: userData.role || USER_ROLES.CONTRIBUTOR,
                createdAt: new Date(),
                lastLogin: new Date(),
                isActive: true
            });

            // Log registration activity
            await this.logActivity('register', user.uid);

            return { success: true, user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            if (this.currentUser) {
                await this.logActivity('logout', this.currentUser.uid);
            }
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUserProfile(uid, updates) {
        try {
            await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
                ...updates,
                updatedAt: new Date()
            });
            return { success: true };
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, error: error.message };
        }
    }

    async logActivity(action, uid) {
        try {
            const activityDoc = {
                action,
                userId: uid,
                timestamp: new Date(),
                userAgent: navigator.userAgent,
                ip: await this.getClientIP()
            };
            
            // Store activity log (you might want to create a separate collection for this)
            await setDoc(doc(db, 'activity_logs', `${Date.now()}_${uid}`), activityDoc);
        } catch (error) {
            console.error('Activity logging error:', error);
        }
    }

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    // Permission checking methods
    canEdit() {
        return this.userRole === USER_ROLES.ADMIN || this.userRole === USER_ROLES.EDITOR;
    }

    canDelete() {
        return this.userRole === USER_ROLES.ADMIN;
    }

    canManageUsers() {
        return this.userRole === USER_ROLES.ADMIN;
    }

    canAccessAdmin() {
        return this.userRole === USER_ROLES.ADMIN || this.userRole === USER_ROLES.EDITOR;
    }

    // Callback for auth state changes
    onAuthStateChange(isAuthenticated, user) {
        // Override this method in your app to handle auth state changes
        console.log('Auth state changed:', isAuthenticated, user);
    }

    // Get current user info
    getCurrentUser() {
        return {
            user: this.currentUser,
            role: this.userRole,
            isAuthenticated: !!this.currentUser
        };
    }
}

export default new AuthService();
