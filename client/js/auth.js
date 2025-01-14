// auth.js
class AuthHandler {
    static init() {
        // Check authentication on protected pages
        if (window.location.pathname.includes('profile.html')) {
            this.checkAuth();
        }
    }

    static checkAuth() {
        const token = this.getAuthToken();
        if (!token) {
            this.redirectToLogin();
            return false;
        }
        return true;
    }

    static redirectToLogin() {
        window.location.href = '/Najeekai/client/login.html';
    }

    static getAuthToken() {
        return localStorage.getItem('authToken');
    }

    static setAuthToken(token) {
        localStorage.setItem('authToken', token);
    }

    static clearAuth() {
        localStorage.removeItem('authToken');
        this.redirectToLogin();
    }

    static async makeAuthenticatedRequest(url, options = {}) {
        const token = this.getAuthToken();
        if (!token) {
            this.redirectToLogin();
            throw new Error('No authentication token found');
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (response.status === 401) {
                this.clearAuth();
                throw new Error('Authentication failed');
            }

            return response;
        } catch (error) {
            console.error('Request failed:', error);
            throw error;
        }
    }
}

// Initialize authentication check
document.addEventListener('DOMContentLoaded', () => {
    AuthHandler.init();
});

// Profile update function
async function updateProfile(profileData) {
    try {
        const response = await AuthHandler.makeAuthenticatedRequest('/api/customer.php', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update profile');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}

// Profile form submission handler
if (document.getElementById('profileForm')) {
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitAlert = document.getElementById('submitAlert');
        const formData = new FormData(e.target);
        const profileData = Object.fromEntries(formData);
        
        try {
            const result = await updateProfile(profileData);
            submitAlert.className = 'bg-green-100 text-green-700 rounded-md p-4 mb-4';
            submitAlert.textContent = 'Profile updated successfully';
            submitAlert.classList.remove('hidden');
        } catch (error) {
            submitAlert.className = 'bg-red-100 text-red-700 rounded-md p-4 mb-4';
            submitAlert.textContent = error.message || 'Failed to update profile';
            submitAlert.classList.remove('hidden');
        }
    });
}