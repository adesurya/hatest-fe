// profile-service.js - Fixed version for API integration

/**
 * Profile Service - Handles API requests for the user profile page
 */
class ProfileService {
    /**
     * Get user profile from API
     * @returns {Promise<Object>} Response with user data
     */
    static async getUserProfile() {
        try {
            // Get auth token from localStorage
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                console.error('No authentication token found');
                return { success: false, message: 'No authentication token found. Please log in again.' };
            }
            
            // Make API request
            const response = await fetch('/api/users/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Check content type to ensure it's JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Response is not JSON, content-type:', contentType);
                throw new Error('Server returned an invalid response format. Please try again later.');
            }
            
            const data = await response.json();
            
            // Handle unauthorized access (expired token)
            if (response.status === 401) {
                // Clear token and redirect to login
                localStorage.removeItem('authToken');
                window.location.href = '/auth/login?session=expired';
                return { 
                    success: false, 
                    message: 'Your session has expired. Please log in again.' 
                };
            }
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch profile data');
            }
            
            return data;
        } catch (error) {
            console.error('Profile fetch error:', error);
            
            // Check if it's a JSON parsing error (invalid response from server)
            if (error instanceof SyntaxError) {
                return {
                    success: false,
                    message: 'Server returned an invalid response. Please try again later.'
                };
            }
            
            return {
                success: false,
                message: error.message || 'Failed to load profile data. Please try again later.'
            };
        }
    }
    
    /**
     * Update user profile
     * @param {FormData} formData Form data for profile update
     * @returns {Promise<Object>} Response with updated user data
     */
    static async updateProfile(formData) {
        try {
            // Get auth token from localStorage
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                console.error('No authentication token found');
                return { success: false, message: 'No authentication token found. Please log in again.' };
            }
            
            // Make API request
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                    // Do not set Content-Type when using FormData
                },
                body: formData
            });
            
            // Check content type to ensure it's JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Response is not JSON, content-type:', contentType);
                throw new Error('Server returned an invalid response format. Please try again later.');
            }
            
            const data = await response.json();
            
            // Handle unauthorized access (expired token)
            if (response.status === 401) {
                // Clear token and redirect to login
                localStorage.removeItem('authToken');
                window.location.href = '/auth/login?session=expired';
                return { 
                    success: false, 
                    message: 'Your session has expired. Please log in again.' 
                };
            }
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }
            
            return data;
        } catch (error) {
            console.error('Profile update error:', error);
            
            // Check if it's a JSON parsing error (invalid response from server)
            if (error instanceof SyntaxError) {
                return {
                    success: false,
                    message: 'Server returned an invalid response. Please try again later.'
                };
            }
            
            return {
                success: false,
                message: error.message || 'Failed to update profile. Please try again later.'
            };
        }
    }
    
    /**
     * Debug API endpoint to check if it's accessible
     * @returns {Promise<boolean>} True if API is accessible
     */
    static async checkAPI() {
        try {
            // Make a simple request to check if API is accessible
            const response = await fetch('/api/heartbeat', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('API check error:', error);
            return false;
        }
    }
}