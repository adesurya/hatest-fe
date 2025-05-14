// user-profile.js - Fixed version

/**
 * Profile Service - Handles API requests for user profile
 */
class ProfileService {
    /**
     * Get user profile from API
     * @returns {Promise<Object>} Profile data
     */
    static async getUserProfile() {
        try {
            // Get auth token from localStorage
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                return {
                    success: false,
                    message: 'No authentication token found'
                };
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
                throw new Error('Response is not valid JSON. Server might be returning HTML error page.');
            }
            
            // Parse JSON response
            const data = await response.json();
            
            // Check if response is successful
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch profile data');
            }
            
            return data;
        } catch (error) {
            console.error('Profile fetch error:', error);
            return {
                success: false,
                message: error.message || 'Failed to load profile data'
            };
        }
    }
    
    /**
     * Update user profile
     * @param {FormData} formData Form data containing profile updates
     * @returns {Promise<Object>} Update result
     */
    static async updateProfile(formData) {
        try {
            // Get auth token from localStorage
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                return {
                    success: false,
                    message: 'No authentication token found'
                };
            }
            
            // Make API request
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                    // Note: Do not set Content-Type when using FormData
                },
                body: formData
            });
            
            // Check content type to ensure it's JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Response is not valid JSON. Server might be returning HTML error page.');
            }
            
            // Parse JSON response
            const data = await response.json();
            
            // Check if response is successful
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }
            
            return data;
        } catch (error) {
            console.error('Profile update error:', error);
            return {
                success: false,
                message: error.message || 'Failed to update profile'
            };
        }
    }
    
    /**
     * Update user profile (JSON version for non-file updates)
     * @param {Object} userData User data object
     * @returns {Promise<Object>} Update result
     */
    static async updateProfileJSON(userData) {
        try {
            // Get auth token from localStorage
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                return {
                    success: false,
                    message: 'No authentication token found'
                };
            }
            
            // Make API request
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            // Check content type to ensure it's JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Response is not valid JSON. Server might be returning HTML error page.');
            }
            
            // Parse JSON response
            const data = await response.json();
            
            // Check if response is successful
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }
            
            return data;
        } catch (error) {
            console.error('Profile update error:', error);
            return {
                success: false,
                message: error.message || 'Failed to update profile'
            };
        }
    }
}

/**
 * Profile UI - Handles UI updates for profile page
 */
class ProfileUI {
    /**
     * Populate user data in the UI
     * @param {Object} userData User data object
     */
    populateUserData(userData) {
        // Update user name and email in profile header
        const userNameElement = document.querySelector('.user-full-name');
        const userEmailElement = document.querySelector('.user-email');
        
        if (userNameElement) userNameElement.textContent = userData.full_name || 'User';
        if (userEmailElement) userEmailElement.textContent = userData.email || '';
        
        // Update navbar user name
        const navbarUserName = document.querySelector('.user-name');
        if (navbarUserName) {
            navbarUserName.textContent = userData.full_name || 'User';
        }
        
        // Update navbar user initial
        const userInitialElement = document.querySelector('.user-initial');
        if (userInitialElement && userData.full_name) {
            userInitialElement.textContent = userData.full_name.charAt(0).toUpperCase();
        }
        
        // Update membership status
        const membershipStatus = userData.membership_status || 'inactive';
        const statusBadge = document.querySelector('.status-badge');
        const membershipStatusElement = document.querySelector('.membership-status');
        
        if (statusBadge && membershipStatusElement) {
            membershipStatusElement.textContent = 
                membershipStatus === 'active' ? 'Active' : 
                membershipStatus === 'pending' ? 'Pending' : 'Inactive';
                
            statusBadge.className = 'badge rounded-pill px-3 py-2 status-badge ' + 
                (membershipStatus === 'active' ? 'bg-success' : 
                membershipStatus === 'pending' ? 'bg-warning' : 'bg-secondary');
        }
        
        // Update profile photo
        if (userData.profile_photo) {
            const profilePhoto = document.querySelector('.profile-photo');
            const profilePhotoPlaceholder = document.querySelector('.profile-photo-placeholder');
            
            if (profilePhoto) {
                profilePhoto.src = userData.profile_photo;
                profilePhoto.style.display = 'block';
                
                if (profilePhotoPlaceholder) {
                    profilePhotoPlaceholder.style.display = 'none';
                }
            }
            
            const photoPreview = document.querySelector('.profile-photo-preview');
            const profilePreviewPlaceholder = document.querySelector('.profile-preview-placeholder');
            
            if (photoPreview) {
                photoPreview.src = userData.profile_photo;
                photoPreview.style.display = 'block';
                
                if (profilePreviewPlaceholder) {
                    profilePreviewPlaceholder.style.display = 'none';
                }
            }
        }
        
        // Update ID card photo
        if (userData.id_card_photo) {
            const idCardPhoto = document.querySelector('.id-card-photo-preview');
            const idCardPreviewPlaceholder = document.querySelector('.id-card-preview-placeholder');
            
            if (idCardPhoto) {
                idCardPhoto.src = userData.id_card_photo;
                idCardPhoto.style.display = 'block';
                
                if (idCardPreviewPlaceholder) {
                    idCardPreviewPlaceholder.style.display = 'none';
                }
            }
        }
        
        // Update form fields
        const fullNameInput = document.getElementById('full_name');
        const emailInput = document.getElementById('email');
        const phoneNumberInput = document.getElementById('phone_number');
        const birthPlaceInput = document.getElementById('birth_place');
        const birthDateInput = document.getElementById('birth_date');
        const institutionInput = document.getElementById('institution');
        const collegiumInput = document.getElementById('collegium_certificate_number');
        
        if (fullNameInput) fullNameInput.value = userData.full_name || '';
        if (emailInput) emailInput.value = userData.email || '';
        if (phoneNumberInput) phoneNumberInput.value = userData.phone_number || '';
        if (birthPlaceInput) birthPlaceInput.value = userData.birth_place || '';
        
        // Format birth date for input field (YYYY-MM-DD)
        if (birthDateInput && userData.birth_date) {
            const birthDate = new Date(userData.birth_date);
            const year = birthDate.getFullYear();
            const month = String(birthDate.getMonth() + 1).padStart(2, '0');
            const day = String(birthDate.getDate()).padStart(2, '0');
            birthDateInput.value = `${year}-${month}-${day}`;
        } else if (birthDateInput) {
            birthDateInput.value = '';
        }
        
        if (institutionInput) institutionInput.value = userData.institution || '';
        if (collegiumInput) collegiumInput.value = userData.collegium_certificate_number || '';
    }
    
    /**
     * Show success toast notification
     * @param {string} message Success message
     */
    showSuccessToast(message) {
        const alertContainer = document.querySelector('.alert-container');
        if (alertContainer) {
            alertContainer.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    <i class="fas fa-check-circle me-2"></i> ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
        }
    }
    
    /**
     * Show error toast notification
     * @param {string} message Error message
     */
    showErrorToast(message) {
        const alertContainer = document.querySelector('.alert-container');
        if (alertContainer) {
            alertContainer.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="fas fa-exclamation-circle me-2"></i> ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
        }
    }
}

// Initialize handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize profile page
    const profilePage = new ProfilePage();
    profilePage.init();
});

/**
 * Profile Page - Main controller for the profile page
 */
class ProfilePage {
    constructor() {
        this.profileService = ProfileService;
        this.ui = new ProfileUI();
        this.isEditMode = false;
        
        // Cache DOM elements if they exist
        this.profileForm = document.getElementById('profile-form');
        this.editProfileBtn = document.getElementById('edit-profile-btn');
        this.cancelEditBtn = document.getElementById('cancel-edit-btn');
        this.profilePhotoInput = document.getElementById('profile_photo');
        this.idCardPhotoInput = document.getElementById('id_card_photo');
        
        // Check for required elements
        this.isInitialized = this.checkRequiredElements();
    }
    
    /**
     * Check if required elements are present in the DOM
     * @returns {boolean} True if all required elements are present
     */
    checkRequiredElements() {
        if (!this.profileForm) {
            console.error('Profile form not found in the DOM');
            return false;
        }
        
        if (!this.editProfileBtn) {
            console.error('Edit profile button not found in the DOM');
            return false;
        }
        
        if (!this.cancelEditBtn) {
            console.error('Cancel edit button not found in the DOM');
            return false;
        }
        
        // We can work without these, so just log warnings
        if (!this.profilePhotoInput) {
            console.warn('Profile photo input not found in the DOM');
        }
        
        if (!this.idCardPhotoInput) {
            console.warn('ID card photo input not found in the DOM');
        }
        
        const profileLoading = document.querySelector('.profile-loading');
        if (!profileLoading) {
            console.error('Profile loading indicator not found in the DOM');
            return false;
        }
        
        const profileInfoContainer = document.querySelector('.profile-info-container');
        if (!profileInfoContainer) {
            console.error('Profile info container not found in the DOM');
            return false;
        }
        
        return true;
    }
    
    /**
     * Initialize the profile page
     */
    init() {
        if (!this.isInitialized) {
            console.error('Cannot initialize profile page: required elements missing');
            return;
        }
        
        // Fetch profile data
        this.loadProfile();
        
        // Attach event listeners
        this.attachEventListeners();
    }
    
    /**
     * Attach event listeners to DOM elements
     */
    attachEventListeners() {
        // Edit profile button
        if (this.editProfileBtn) {
            this.editProfileBtn.addEventListener('click', this.toggleEditMode.bind(this));
        }
        
        // Cancel edit button
        if (this.cancelEditBtn) {
            this.cancelEditBtn.addEventListener('click', this.cancelEdit.bind(this));
        }
        
        // Profile form submission
        if (this.profileForm) {
            this.profileForm.addEventListener('submit', this.handleProfileUpdate.bind(this));
        }
        
        // Profile photo upload preview
        if (this.profilePhotoInput) {
            this.profilePhotoInput.addEventListener('change', this.handleProfilePhotoPreview.bind(this));
        }
        
        // ID card photo upload preview
        if (this.idCardPhotoInput) {
            this.idCardPhotoInput.addEventListener('change', this.handleIdCardPhotoPreview.bind(this));
        }
    }
    
    /**
     * Load user profile data
     */
    async loadProfile() {
        try {
            // Show loading indicator
            const loadingEl = document.querySelector('.profile-loading');
            const infoContainerEl = document.querySelector('.profile-info-container');
            
            if (loadingEl) loadingEl.style.display = 'block';
            if (infoContainerEl) infoContainerEl.style.display = 'none';
            
            // Fetch profile data
            const response = await this.profileService.getUserProfile();
            
            if (response.success) {
                // Update UI with profile data
                this.ui.populateUserData(response.user);
                
                // Update localStorage with user info
                this.updateUserInfo(response.user);
                
                // Set form to read-only mode
                this.setFormReadOnly(true);
                
                // Show profile info container
                if (infoContainerEl) infoContainerEl.style.display = 'block';
            } else {
                this.ui.showErrorToast(response.message || 'Failed to load profile data');
                console.error('Failed to load profile:', response.message);
            }
        } catch (error) {
            this.ui.showErrorToast('An error occurred while loading profile data');
            console.error('Profile load error:', error);
        } finally {
            // Hide loading indicator
            const loadingEl = document.querySelector('.profile-loading');
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }
    
    /**
     * Handle form submission for profile update
     * @param {Event} event Form submit event
     */
    async handleProfileUpdate(event) {
        event.preventDefault();
        
        try {
            // Create FormData from form
            const formData = new FormData(this.profileForm);
            
            // Only include file inputs if they have a file selected
            if (this.profilePhotoInput && !this.profilePhotoInput.files.length) {
                formData.delete('profile_photo');
            }
            
            if (this.idCardPhotoInput && !this.idCardPhotoInput.files.length) {
                formData.delete('id_card_photo');
            }
            
            // Submit update
            const response = await this.profileService.updateProfile(formData);
            
            if (response.success) {
                // Show success message
                this.ui.showSuccessToast('Profile updated successfully');
                
                // Update UI with new data
                this.ui.populateUserData(response.user || await this.refreshUserData());
                
                // Update localStorage with user info
                this.updateUserInfo(response.user);
                
                // Switch back to view mode
                this.setFormReadOnly(true);
                this.isEditMode = false;
                
                // Update button text if it exists
                if (this.editProfileBtn) {
                    this.editProfileBtn.innerHTML = '<i class="fas fa-edit me-2"></i> Edit Profile';
                }
            } else {
                this.ui.showErrorToast(response.message || 'Failed to update profile');
            }
        } catch (error) {
            this.ui.showErrorToast('An error occurred while updating profile');
            console.error('Profile update error:', error);
        }
    }
    
    /**
     * Refresh user data from API
     * @returns {Promise<Object>} Updated user data
     */
    async refreshUserData() {
        const response = await this.profileService.getUserProfile();
        return response.success ? response.user : null;
    }
    
    /**
     * Update user info in localStorage
     * @param {Object} userData User data object 
     */
    updateUserInfo(userData) {
        if (userData) {
            localStorage.setItem('user', JSON.stringify({
                id: userData.id,
                name: userData.full_name,
                email: userData.email,
                role: userData.role
            }));
        }
    }
    
    /**
     * Toggle between edit and view modes
     */
    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        this.setFormReadOnly(!this.isEditMode);
        
        // Update button text
        if (this.editProfileBtn) {
            this.editProfileBtn.innerHTML = this.isEditMode ? 
                '<i class="fas fa-times me-2"></i> Cancel' : 
                '<i class="fas fa-edit me-2"></i> Edit Profile';
        }
    }
    
    /**
     * Cancel edit mode
     */
    cancelEdit() {
        // Reset form to original data
        this.loadProfile();
        
        // Switch back to view mode
        this.isEditMode = false;
        this.setFormReadOnly(true);
        
        // Update button text
        if (this.editProfileBtn) {
            this.editProfileBtn.innerHTML = '<i class="fas fa-edit me-2"></i> Edit Profile';
        }
    }
    
    /**
     * Set form fields to read-only mode
     * @param {boolean} readonly Whether fields should be readonly
     */
    setFormReadOnly(readonly = true) {
        if (!this.profileForm) return;
        
        // Text input fields
        const inputs = this.profileForm.querySelectorAll('input:not([type="file"]):not([readonly])');
        inputs.forEach(input => {
            input.readOnly = readonly;
            if (readonly) {
                input.classList.add('bg-light');
            } else {
                input.classList.remove('bg-light');
            }
        });
        
        // File inputs and buttons
        const fileInputContainers = this.profileForm.querySelectorAll('.col-md-6');
        fileInputContainers.forEach(container => {
            // Only handle containers that have file inputs
            if (container.querySelector('input[type="file"]')) {
                if (readonly) {
                    container.style.display = 'none';
                } else {
                    container.style.display = 'block';
                }
            }
        });
        
        // Handle the submit and cancel button visibility
        if (this.cancelEditBtn) {
            this.cancelEditBtn.style.display = readonly ? 'none' : 'inline-block';
        }
        
        const submitBtn = this.profileForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.style.display = readonly ? 'none' : 'inline-block';
        }
    }
    
    /**
     * Handle profile photo preview
     * @param {Event} event File input change event
     */
    handleProfilePhotoPreview(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.previewImage(file, '.profile-photo-preview', '.profile-preview-placeholder');
    }
    
    /**
     * Handle ID card photo preview
     * @param {Event} event File input change event
     */
    handleIdCardPhotoPreview(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.previewImage(file, '.id-card-photo-preview', '.id-card-preview-placeholder');
    }
    
    /**
     * Preview an image file in the specified element
     * @param {File} file Image file
     * @param {string} previewSelector CSS selector for preview image
     * @param {string} placeholderSelector CSS selector for placeholder element
     */
    previewImage(file, previewSelector, placeholderSelector) {
        // Validate file type
        if (!file.type.match('image.*')) {
            this.ui.showErrorToast('Please select an image file');
            return;
        }
        
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            this.ui.showErrorToast('File size must not exceed 2MB');
            return;
        }
        
        const reader = new FileReader();
        const preview = document.querySelector(previewSelector);
        const placeholder = document.querySelector(placeholderSelector);
        
        reader.onload = function(e) {
            // Display preview if the element exists
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            
            // Hide placeholder if it exists
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    }
}