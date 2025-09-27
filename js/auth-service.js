// Firebase Authentication Service
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, USER_ROLES } from '../firebase-config.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.setupAuthListener();
    }

    setupAuthListener() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                // Get user role from Firestore
                const userRole = await this.getUserRole(user.uid);
                this.currentUser.role = userRole;
            } else {
                this.currentUser = null;
            }
            this.isInitialized = true;
        });
    }

    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userRole = await this.getUserRole(userCredential.user.uid);
            
            return {
                success: true,
                user: {
                    ...userCredential.user,
                    role: userRole
                }
            };
        } catch (error) {
            console.error('Sign in error:', error);
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    async signUp(email, password, userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update user profile
            await updateProfile(userCredential.user, {
                displayName: userData.name
            });

            // Save user data to Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name: userData.name,
                email: userData.email,
                role: userData.role || USER_ROLES.CONTRIBUTOR,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            return {
                success: true,
                user: userCredential.user
            };
        } catch (error) {
            console.error('Sign up error:', error);
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    async signOut() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getCurrentUser() {
        if (!this.isInitialized) {
            // Wait for auth state to be initialized
            return new Promise((resolve) => {
                const unsubscribe = onAuthStateChanged(auth, (user) => {
                    unsubscribe();
                    resolve(user);
                });
            });
        }
        return this.currentUser;
    }

    async getUserRole(uid) {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                return userDoc.data().role || USER_ROLES.CONTRIBUTOR;
            }
            return USER_ROLES.CONTRIBUTOR;
        } catch (error) {
            console.error('Error getting user role:', error);
            return USER_ROLES.CONTRIBUTOR;
        }
    }

    async updateUserRole(uid, role) {
        try {
            await setDoc(doc(db, 'users', uid), {
                role: role,
                updatedAt: new Date()
            }, { merge: true });
            return { success: true };
        } catch (error) {
            console.error('Error updating user role:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    hasRole(requiredRole) {
        if (!this.currentUser) return false;
        
        const roleHierarchy = {
            [USER_ROLES.CONTRIBUTOR]: 1,
            [USER_ROLES.EDITOR]: 2,
            [USER_ROLES.ADMIN]: 3
        };

        const userRoleLevel = roleHierarchy[this.currentUser.role] || 0;
        const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

        return userRoleLevel >= requiredRoleLevel;
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No user found with this email address.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/user-disabled': 'This user account has been disabled.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/invalid-credential': 'Invalid email or password.'
        };

        return errorMessages[errorCode] || 'An error occurred. Please try again.';
    }

    // Check if user can perform action
    canPerformAction(action) {
        if (!this.isAuthenticated()) return false;

        const permissions = {
            'view_content': [USER_ROLES.CONTRIBUTOR, USER_ROLES.EDITOR, USER_ROLES.ADMIN],
            'edit_content': [USER_ROLES.EDITOR, USER_ROLES.ADMIN],
            'delete_content': [USER_ROLES.ADMIN],
            'manage_users': [USER_ROLES.ADMIN],
            'manage_settings': [USER_ROLES.ADMIN]
        };

        const allowedRoles = permissions[action] || [];
        return allowedRoles.includes(this.currentUser.role);
    }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
