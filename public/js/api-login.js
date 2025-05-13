// Client-side script to handle API login and redirection
// Save this as public/js/api-login.js

document.addEventListener('DOMContentLoaded', function() {
    // Function to handle API login
    function handleApiLogin(email, password) {
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
                    // Store token in localStorage if needed for future API calls
                    localStorage.setItem('authToken', data.token);
                    
                    // Redirect to the dashboard
                    window.location.href = data.redirect;
                } else {
                    throw new Error(data.message || 'Login failed');
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                // Display error message to user
                alert(error.message || 'Login failed. Please try again.');
            });
    }

    // Example of how you might use this function
    // You can adapt this based on your UI
    const apiLoginForm = document.getElementById('api-login-form');
    if (apiLoginForm) {
        apiLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('api-email').value;
            const password = document.getElementById('api-password').value;
            handleApiLogin(email, password);
        });
    }
});