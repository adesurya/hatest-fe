// public/js/user-profile.js

document.addEventListener('DOMContentLoaded', function() {
    // Function to fetch user profile from API
    function fetchUserProfile() {
        // Get auth token from localStorage
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            // Redirect to login if no token
            window.location.href = '/auth/login';
            return;
        }
        
        // Show loading indicator
        const profileContainer = document.querySelector('.profile-info-container');
        if (profileContainer) {
            profileContainer.innerHTML = '<div class="text-center p-5"><i class="fas fa-spinner fa-spin fa-3x"></i><p class="mt-3">Loading profile...</p></div>';
        }
        
        // Fetch profile data from API
        fetch('/api/users/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Failed to fetch profile');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Update user data in localStorage
                localStorage.setItem('user', JSON.stringify({
                    id: data.user.id,
                    name: data.user.full_name,
                    email: data.user.email,
                    role: data.user.role
                }));
                
                // Populate profile form fields
                populateProfileForm(data.user);
                
                // Update profile photo if available
                updateProfilePhoto(data.user.profile_photo);
            } else {
                throw new Error(data.message || 'Failed to fetch profile');
            }
        })
        .catch(error => {
            console.error('Profile fetch error:', error);
            
            // Display error message
            if (profileContainer) {
                profileContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i> 
                        ${error.message || 'Failed to load profile. Please try again.'}
                    </div>
                `;
            }
        });
    }
    
    // Function to populate profile form with user data
    function populateProfileForm(userData) {
        // Find form fields and populate with user data
        const fields = {
            'full_name': userData.full_name || '',
            'email': userData.email || '',
            'phone_number': userData.phone_number || '',
            'birth_place': userData.birth_place || '',
            'birth_date': userData.birth_date ? userData.birth_date.substring(0, 10) : '',
            'institution': userData.institution || '',
            'collegium_certificate_number': userData.collegium_certificate_number || ''
        };
        
        // Populate each field if it exists in the DOM
        Object.keys(fields).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                field.value = fields[key];
            }
        });
        
        // Update membership status if the element exists
        const membershipStatus = document.querySelector('.membership-status');
        if (membershipStatus) {
            membershipStatus.textContent = userData.membership_status || 'Inactive';
            
            // Update status badge color
            const statusBadge = document.querySelector('.status-badge');
            if (statusBadge) {
                if (userData.membership_status === 'active') {
                    statusBadge.classList.add('bg-success');
                    statusBadge.classList.remove('bg-warning', 'bg-danger');
                } else if (userData.membership_status === 'pending') {
                    statusBadge.classList.add('bg-warning');
                    statusBadge.classList.remove('bg-success', 'bg-danger');
                } else {
                    statusBadge.classList.add('bg-danger');
                    statusBadge.classList.remove('bg-success', 'bg-warning');
                }
            }
        }
        
        // Show content after loading
        const profileContainer = document.querySelector('.profile-info-container');
        if (profileContainer) {
            profileContainer.style.display = 'block';
        }
        
        const loadingIndicator = document.querySelector('.profile-loading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
    
    // Function to update profile photo display
    function updateProfilePhoto(photoUrl) {
        const profilePhoto = document.querySelector('.profile-photo');
        const profilePhotoPlaceholder = document.querySelector('.profile-photo-placeholder');
        
        if (profilePhoto && photoUrl) {
            profilePhoto.src = photoUrl;
            profilePhoto.style.display = 'block';
            
            if (profilePhotoPlaceholder) {
                profilePhotoPlaceholder.style.display = 'none';
            }
        } else if (profilePhotoPlaceholder) {
            profilePhotoPlaceholder.style.display = 'flex';
            
            if (profilePhoto) {
                profilePhoto.style.display = 'none';
            }
        }
    }
    
    // Handle profile photo preview
    const profilePhotoInput = document.getElementById('profile_photo');
    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    // Display preview
                    const profilePhoto = document.querySelector('.profile-photo-preview');
                    if (profilePhoto) {
                        profilePhoto.src = e.target.result;
                        profilePhoto.style.display = 'block';
                    }
                    
                    // Hide placeholder
                    const profilePhotoPlaceholder = document.querySelector('.profile-photo-placeholder');
                    if (profilePhotoPlaceholder) {
                        profilePhotoPlaceholder.style.display = 'none';
                    }
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Handle profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show loading state
            const submitButton = document.querySelector('[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                submitButton.disabled = true;
            }
            
            // Get auth token
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                window.location.href = '/auth/login';
                return;
            }
            
            // Create FormData object to handle file uploads
            const formData = new FormData(profileForm);
            
            // Send update request
            fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.message || 'Failed to update profile');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Show success message
                    const alertContainer = document.querySelector('.alert-container');
                    if (alertContainer) {
                        alertContainer.innerHTML = `
                            <div class="alert alert-success alert-dismissible fade show" role="alert">
                                <i class="fas fa-check-circle me-2"></i> Profile updated successfully
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>
                        `;
                    }
                    
                    // Update user in localStorage
                    if (data.user) {
                        localStorage.setItem('user', JSON.stringify({
                            id: data.user.id,
                            name: data.user.full_name,
                            email: data.user.email,
                            role: data.user.role
                        }));
                    }
                    
                    // Update header user name
                    const navbarUserName = document.querySelector('#navbarDropdownAccount');
                    if (navbarUserName && data.user && data.user.full_name) {
                        navbarUserName.innerHTML = `<i class="fas fa-user-circle me-1"></i> ${data.user.full_name}`;
                    }
                } else {
                    throw new Error(data.message || 'Failed to update profile');
                }
            })
            .catch(error => {
                console.error('Profile update error:', error);
                
                // Show error message
                const alertContainer = document.querySelector('.alert-container');
                if (alertContainer) {
                    alertContainer.innerHTML = `
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            <i class="fas fa-exclamation-circle me-2"></i> ${error.message || 'Failed to update profile. Please try again.'}
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `;
                }
            })
            .finally(() => {
                // Reset button state
                if (submitButton) {
                    submitButton.innerHTML = 'Save Changes';
                    submitButton.disabled = false;
                }
            });
        });
    }
    
    // Initialize profile if on profile page
    if (window.location.pathname === '/user/profile') {
        fetchUserProfile();
    }
    
    // Handle password change form if it exists
    const passwordForm = document.getElementById('change-password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Check if passwords match
            const newPassword = document.getElementById('new_password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            if (newPassword !== confirmPassword) {
                const alertContainer = document.querySelector('.alert-container');
                if (alertContainer) {
                    alertContainer.innerHTML = `
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            <i class="fas fa-exclamation-circle me-2"></i> Passwords do not match
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `;
                }
                return;
            }
            
            // Show loading state
            const submitButton = document.querySelector('[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
                submitButton.disabled = true;
            }
            
            // Get auth token
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                window.location.href = '/auth/login';
                return;
            }
            
            // Prepare data
            const formData = new FormData(passwordForm);
            const data = {
                current_password: formData.get('current_password'),
                new_password: formData.get('new_password')
            };
            
            // Send password change request
            fetch('/api/users/change-password', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.message || 'Failed to change password');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Show success message
                    const alertContainer = document.querySelector('.alert-container');
                    if (alertContainer) {
                        alertContainer.innerHTML = `
                            <div class="alert alert-success alert-dismissible fade show" role="alert">
                                <i class="fas fa-check-circle me-2"></i> Password changed successfully
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>
                        `;
                    }
                    
                    // Clear form
                    passwordForm.reset();
                } else {
                    throw new Error(data.message || 'Failed to change password');
                }
            })
            .catch(error => {
                console.error('Password change error:', error);
                
                // Show error message
                const alertContainer = document.querySelector('.alert-container');
                if (alertContainer) {
                    alertContainer.innerHTML = `
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            <i class="fas fa-exclamation-circle me-2"></i> ${error.message || 'Failed to change password. Please try again.'}
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `;
                }
            })
            .finally(() => {
                // Reset button state
                if (submitButton) {
                    submitButton.innerHTML = 'Change Password';
                    submitButton.disabled = false;
                }
            });
        });
    }
});