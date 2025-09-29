// Admin Login with Supabase Authentication

class AdminLogin {
    constructor() {
        this.supabase = window.supabaseClient;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingSession();
        this.showSessionMessages();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('login-form');
        const passwordToggle = document.getElementById('password-toggle');
        const passwordInput = document.getElementById('password');
        const forgotPasswordLink = document.querySelector('.forgot-password');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (passwordToggle && passwordInput) {
            passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
        }

        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => this.handleForgotPassword(e));
        }
    }

    async checkExistingSession() {
        try {
            // Check localStorage session first
            const storedSession = localStorage.getItem('admin_user');
            if (storedSession) {
                const sessionData = JSON.parse(storedSession);
                const now = new Date();
                const expiresAt = new Date(sessionData.expiresAt);
                
                // If session hasn't expired, check with Supabase
                if (now < expiresAt) {
                    const { data: { user }, error } = await this.supabase.auth.getUser();
                    
                    if (user && !error && user.email === sessionData.email) {
                        // Valid session, redirect to dashboard
                        window.location.href = 'index.html';
                        return;
                    } else {
                        // Invalid or expired session, clear localStorage
                        localStorage.removeItem('admin_user');
                        localStorage.removeItem('admin_token');
                        localStorage.removeItem('admin_refresh_token');
                    }
                } else {
                    // Session expired, clear localStorage
                    localStorage.removeItem('admin_user');
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_refresh_token');
                }
            }
            
            // Check Supabase session as fallback
            const { data: { user }, error } = await this.supabase.auth.getUser();
            
            if (user && !error) {
                // User is logged in but not in localStorage, redirect to dashboard
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('login-btn');
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoading = loginBtn.querySelector('.btn-loading');

        // Show loading state
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        loginBtn.disabled = true;

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            if (data.user) {
                this.showNotification('Login successful! Redirecting...', 'success');
                
                // Check remember me option
                const rememberMe = document.getElementById('remember-me').checked;
                
                // Store user session info with expiration based on remember me
                const sessionData = {
                    id: data.user.id,
                    email: data.user.email,
                    loginTime: new Date().toISOString(),
                    remember: rememberMe,
                    expiresAt: rememberMe ? 
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : // 30 days
                        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day
                };
                
                localStorage.setItem('admin_user', JSON.stringify(sessionData));

                // Store session token for automatic refresh
                if (data.session?.access_token) {
                    localStorage.setItem('admin_token', data.session.access_token);
                    localStorage.setItem('admin_refresh_token', data.session.refresh_token);
                }

                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }

        } catch (error) {
            console.error('Login error:', error);
            
            let errorMessage = 'Login failed. Please try again.';
            
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Invalid email or password.';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Please confirm your email address before logging in.';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Too many login attempts. Please try again later.';
            }

            this.showNotification(errorMessage, 'error');
        } finally {
            // Reset button state
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            loginBtn.disabled = false;
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const passwordToggle = document.getElementById('password-toggle');
        const icon = passwordToggle.querySelector('i');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    showSessionMessages() {
        // Check for auth failure reason
        const authFailureReason = sessionStorage.getItem('auth_failure_reason');
        if (authFailureReason) {
            this.showNotification(authFailureReason, 'error');
            sessionStorage.removeItem('auth_failure_reason');
            return;
        }

        // Check for non-admin user message
        const nonAdminUserData = sessionStorage.getItem('non_admin_user');
        if (nonAdminUserData) {
            try {
                const userData = JSON.parse(nonAdminUserData);
                this.showNotification(userData.message, 'warning');
                // Pre-fill email field
                const emailInput = document.getElementById('email');
                if (emailInput) {
                    emailInput.value = userData.email;
                }
            } catch (e) {
                console.error('Error parsing non-admin user data:', e);
            }
            sessionStorage.removeItem('non_admin_user');
            return;
        }

        // Check for password reset success
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('reset') === 'success') {
            this.showNotification('Password reset successful! You can now sign in with your new password.', 'success');
            // Clean URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        
        if (!email) {
            this.showNotification('Please enter your email address first.', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address.', 'error');
            return;
        }

        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/admin/login.html?reset=success`
            });

            if (error) {
                throw error;
            }

            this.showNotification('Password reset link sent! Check your email and follow the instructions to reset your password.', 'success');
            
        } catch (error) {
            console.error('Password reset error:', error);
            
            let errorMessage = 'Failed to send password reset email. Please try again.';
            
            if (error.message.includes('email address')) {
                errorMessage = 'No account found with this email address.';
            } else if (error.message.includes('rate limit')) {
                errorMessage = 'Too many reset attempts. Please wait before trying again.';
            }

            this.showNotification(errorMessage, 'error');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Initialize login when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminLogin();
});
