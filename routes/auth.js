// Updated routes/auth.js with fixed login route

const express = require('express');
const router = express.Router();
const { authAPI } = require('../services/api');

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.flash('error_msg', 'Please log in to access this resource');
    res.redirect('/auth/login');
  }
};

// Middleware to check if user is logged out
const isLoggedOut = (req, res, next) => {
  if (!req.session.user) {
    next();
  } else {
    // Redirect based on user role
    const redirectPath = req.session.user.is_admin === 1 ? '/admin/dashboard' : '/user/dashboard';
    res.redirect(redirectPath);
  }
};

// Login page - WITHOUT middleware that could redirect
router.get('/login', (req, res) => {
  res.render('pages/login', {
    title: 'Login'
  });
});

// Process web form login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const response = await authAPI.login({ email, password });
    
    // Store user in session with proper role
    req.session.user = {
      id: response.user.id,
      name: response.user.full_name,
      email: response.user.email,
      is_admin: response.user.is_admin,
      role: response.user.is_admin === 1 ? 'admin' : 'user' // Explicitly set role for views
    };
    
    global.token = response.token;
    
    // Redirect based on user role
    const redirectPath = response.user.is_admin === 1 ? '/admin/dashboard' : '/user/dashboard';
    res.redirect(redirectPath);
  } catch (err) {
    console.error('Login Error:', err);
    req.flash('error_msg', err.response?.data?.message || 'Invalid email or password');
    res.redirect('/auth/login');
  }
});

// API login endpoint that redirects like the web form
router.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    const response = await authAPI.login({ email, password });
    
    // Store user in session with proper role
    req.session.user = {
      id: response.user.id,
      name: response.user.full_name,
      email: response.user.email,
      is_admin: response.user.is_admin,
      role: response.user.is_admin === 1 ? 'admin' : 'user' // Explicitly set role for views
    };
    
    global.token = response.token;
    
    // Decide how to respond based on the Accept header
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/json')) {
      // If client expects JSON, send JSON with redirect info
      return res.status(200).json({
        success: true,
        token: response.token,
        user: response.user,
        redirect: response.user.is_admin === 1 ? '/admin/dashboard' : '/user/dashboard'
      });
    } else {
      // Otherwise redirect directly
      const redirectPath = response.user.is_admin === 1 ? '/admin/dashboard' : '/user/dashboard';
      return res.redirect(redirectPath);
    }
  } catch (err) {
    console.error('Login Error:', err);
    
    // Decide how to respond based on the Accept header
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/json')) {
      // If client expects JSON, send JSON error
      return res.status(401).json({ 
        success: false, 
        message: err.response?.data?.message || 'Invalid email or password' 
      });
    } else {
      // For non-JSON clients, flash an error and redirect to login
      req.flash('error_msg', err.response?.data?.message || 'Invalid email or password');
      return res.redirect('/auth/login');
    }
  }
});

// Registration page
router.get('/register', isLoggedOut, (req, res) => {
  res.render('pages/register', {
    title: 'Register'
  });
});

// Process registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    
    // Client-side validation
    if (password !== confirmPassword) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect('/auth/register');
    }
    
    await authAPI.register({ name, email, password });
    
    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/auth/login');
  } catch (err) {
    req.flash('error_msg', err.response?.data?.message || 'Registration failed');
    res.redirect('/auth/register');
  }
});

// Forgot password page
router.get('/forgot-password', (req, res) => {
  res.render('pages/forgot-password', {
    title: 'Forgot Password'
  });
});

// Process forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    await authAPI.forgotPassword(email);
    
    req.flash('success_msg', 'Password reset link has been sent to your email');
    res.redirect('/auth/login');
  } catch (err) {
    req.flash('error_msg', err.response?.data?.message || 'Failed to send reset link');
    res.redirect('/auth/forgot-password');
  }
});

// Reset password page
router.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;
  
  res.render('pages/reset-password', {
    title: 'Reset Password',
    token: token
  });
});

// Process reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    
    // Client-side validation
    if (password !== confirmPassword) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect(`/auth/reset-password/${token}`);
    }
    
    await authAPI.resetPassword(token, password);
    
    req.flash('success_msg', 'Your password has been reset, you can now log in');
    res.redirect('/auth/login');
  } catch (err) {
    req.flash('error_msg', err.response?.data?.message || 'Failed to reset password');
    res.redirect(`/auth/reset-password/${req.body.token}`);
  }
});

// Logout
router.get('/logout', async (req, res) => {
  try {
    // Call logout API to invalidate token if needed
    if (req.session.user && global.token) {
      await authAPI.logout();
    }
    
    // Clear session
    req.session.destroy();
    global.token = null;
    
    // In addition to server-side logout, we'll tell the client to clear localStorage
    res.send(`
      <script>
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/';
      </script>
    `);
  } catch (err) {
    console.error('Logout Error:', err);
    // Even if API call fails, destroy session
    req.session.destroy();
    global.token = null;
    
    res.send(`
      <script>
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/';
      </script>
    `);
  }
});

module.exports = router;