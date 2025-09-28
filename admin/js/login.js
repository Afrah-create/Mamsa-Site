// Admin Login with Supabase Authentication

class AdminLogin {
    constructor() {
        this.supabase = window.supabaseClient;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingSession();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('login-form');
        const passwordToggle = document.getElementById('password-toggle');
        const passwordInput = document.getElementById('password');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (passwordToggle && passwordInput) {
            passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
        }
    }

    async checkExistingSession() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();
            
            if (user && !error) {
                // User is already logged in, redirect to dashboard
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
                
                // Store user session info
                localStorage.setItem('admin_user', JSON.stringify({
                    id: data.user.id,
                    email: data.user.email,
                    loginTime: new Date().toISOString()
                }));

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
}

// Initialize login when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminLogin();
});
