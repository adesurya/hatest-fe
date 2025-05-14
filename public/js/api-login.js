// Client-side script to handle API login and redirection
// Save this as public/js/api-login.js

document.addEventListener('DOMContentLoaded', function() {
    // Function to handle API login
    function handleApiLogin(email, password) {
        // Show loading indicator
        const loginButton = document.querySelector('#login-button');
        if (loginButton) {
            loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            loginButton.disabled = true;
        }

        // Create the request options
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        };

        // Make the fetch request
        fetch('/api/auth/login', options)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.message || 'Login failed');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Store token in localStorage for future API calls
                    localStorage.setItem('authToken', data.token);
                    
                    // Store basic user info in localStorage
                    localStorage.setItem('user', JSON.stringify({
                        id: data.user.id,
                        name: data.user.full_name,
                        email: data.user.email,
                        role: data.user.role
                    }));
                    
                    // Redirect based on user role (is_admin value)
                    if (data.user.is_admin === 1) {
                        window.location.href = '/admin/dashboard';
                    } else {
                        window.location.href = '/user/dashboard';
                    }
                } else {
                    throw new Error(data.message || 'Login failed');
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                
                // Reset login button
                if (loginButton) {
                    loginButton.innerHTML = 'Login';
                    loginButton.disabled = false;
                }
                
                // Display error message to user
                const errorElement = document.getElementById('login-error');
                if (errorElement) {
                    errorElement.textContent = error.message || 'Login failed. Please try again.';
                    errorElement.style.display = 'block';
                } else {
                    alert(error.message || 'Login failed. Please try again.');
                }
            });
    }

    // Attach event listener to the login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            handleApiLogin(email, password);
        });
    }

    // Handle API login form
    const apiLoginForm = document.getElementById('api-login-form');
    if (apiLoginForm) {
        apiLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('api-email').value;
            const password = document.getElementById('api-password').value;
            handleApiLogin(email, password);
        });
    }

    // Check for auth token on page load to maintain session
    const authToken = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Update UI to show logged-in user if token exists
    if (authToken && user) {
        const loginLink = document.querySelector('a[href="/auth/login"]');
        if (loginLink) {
            const userDropdown = document.createElement('div');
            userDropdown.className = 'dropdown';
            userDropdown.innerHTML = `
                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownAccount" role="button"
                   data-bs-toggle="dropdown" aria-expanded="false">
                   <i class="fas fa-user-circle me-1"></i> ${user.name}
                </a>
                <ul class="dropdown-menu" aria-labelledby="navbarDropdownAccount">
                    ${user.role === 'Administrator' ? 
                        '<li><a class="dropdown-item" href="/admin/dashboard">Admin Dashboard</a></li>' : 
                        '<li><a class="dropdown-item" href="/user/dashboard">Dashboard</a></li>'}
                    <li><a class="dropdown-item" href="/user/profile">Profil Saya</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="logout-link">Logout</a></li>
                </ul>
            `;
            
            // Replace login link with user dropdown
            loginLink.parentNode.replaceWith(userDropdown);
            
            // Add event listener to logout link
            document.getElementById('logout-link').addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/auth/logout';
            });
        }
    }
});