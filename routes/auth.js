// Updated routes/auth.js file to handle the API login request

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
    const redirectPath = req.session.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
    res.redirect(redirectPath);
  }
};

// Login page
router.get('/login', isLoggedOut, (req, res) => {
  res.render('pages/login', {
    title: 'Login'
  });
});

// Process web form login
router.post('/login', isLoggedOut, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const response = await authAPI.login({ email, password });
    
    // Store user in session
    req.session.user = response.user;
    global.token = response.token;
    
    // Redirect based on user role
    const redirectPath = response.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
    res.redirect(redirectPath);
  } catch (err) {
    req.flash('error_msg', err.response?.data?.message || 'Invalid email or password');
    res.redirect('/auth/login');
  }
});

// API login endpoint for REST clients
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
    
    // Return JSON response with token and user info
    return res.status(200).json({
      success: true,
      token: response.token,
      user: {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role
      }
    });
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      message: err.response?.data?.message || 'Invalid email or password' 
    });
  }
});

// Registration page
router.get('/register', isLoggedOut, (req, res) => {
  res.render('pages/register', {
    title: 'Register'
  });
});

// Process registration
router.post('/register', isLoggedOut, async (req, res) => {
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
router.get('/forgot-password', isLoggedOut, (req, res) => {
  res.render('pages/forgot-password', {
    title: 'Forgot Password'
  });
});

// Process forgot password
router.post('/forgot-password', isLoggedOut, async (req, res) => {
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
router.get('/reset-password/:token', isLoggedOut, (req, res) => {
  const { token } = req.params;
  
  res.render('pages/reset-password', {
    title: 'Reset Password',
    token: token
  });
});

// Process reset password
router.post('/reset-password', isLoggedOut, async (req, res) => {
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
router.get('/logout', isLoggedIn, async (req, res) => {
  try {
    // Call logout API to invalidate token if needed
    await authAPI.logout();
    
    // Clear session
    req.session.destroy();
    global.token = null;
    
    res.redirect('/');
  } catch (err) {
    // Even if API call fails, destroy session
    req.session.destroy();
    global.token = null;
    
    res.redirect('/');
  }
});

module.exports = router;