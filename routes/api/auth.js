// routes/api/auth.js
const express = require('express');
const router = express.Router();
const { authAPI } = require('../../services/api');

// Handle login endpoint
router.post('/login', async (req, res) => {
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
    console.error('Login Error:', err);
    return res.status(401).json({ 
      success: false, 
      message: err.response?.data?.message || 'Invalid email or password' 
    });
  }
});

// Register API endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      });
    }
    
    const response = await authAPI.register({ name, email, password });
    
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email
      }
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.response?.data?.message || 'Registration failed'
    });
  }
});

// Forgot password API endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    await authAPI.forgotPassword(email);
    
    return res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email'
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.response?.data?.message || 'Failed to send reset link'
    });
  }
});

// Reset password API endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }
    
    await authAPI.resetPassword(token, password);
    
    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.response?.data?.message || 'Failed to reset password'
    });
  }
});

// Logout API endpoint
router.post('/logout', async (req, res) => {
  try {
    await authAPI.logout();
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.response?.data?.message || 'Logout failed'
    });
  }
});

module.exports = router;