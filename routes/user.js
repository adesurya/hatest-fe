// routes/user.js - User dashboard routes

const express = require('express');
const router = express.Router();
const { userAPI } = require('../services/api');

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.flash('error_msg', 'Please log in to access this resource');
    res.redirect('/auth/login');
  }
};

// Apply middleware to all routes
router.use(isLoggedIn);

// User dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const dashboardData = await userAPI.getUserDashboard();
    
    res.render('pages/user/dashboard', {
      title: 'Dashboard',
      dashboardData: dashboardData,
      user: req.session.user
    });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).render('pages/error', {
      title: 'Error',
      message: err.response?.data?.message || 'Failed to load dashboard data',
      status: err.response?.status || 500
    });
  }
});

// User profile
router.get('/profile', async (req, res) => {
  try {
    const profile = await userAPI.getUserProfile();
    
    res.render('pages/user/profile', {
      title: 'My Profile',
      profile: profile,
      user: req.session.user
    });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).render('pages/error', {
      title: 'Error',
      message: err.response?.data?.message || 'Failed to load profile data',
      status: err.response?.status || 500
    });
  }
});

// Update profile
router.post('/profile', async (req, res) => {
  try {
    const profileData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      // Add other profile fields as needed
    };
    
    const updatedProfile = await userAPI.updateUserProfile(profileData);
    
    // Update session user data
    req.session.user = {
      ...req.session.user,
      name: updatedProfile.name,
      email: updatedProfile.email
    };
    
    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/user/profile');
  } catch (err) {
    console.error('API Error:', err);
    req.flash('error_msg', err.response?.data?.message || 'Failed to update profile');
    res.redirect('/user/profile');
  }
});

// Change password page
router.get('/change-password', (req, res) => {
  res.render('pages/user/change-password', {
    title: 'Change Password',
    user: req.session.user
  });
});

// Process change password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Client-side validation
    if (newPassword !== confirmPassword) {
      req.flash('error_msg', 'New passwords do not match');
      return res.redirect('/user/change-password');
    }
    
    await userAPI.changePassword({
      currentPassword,
      newPassword
    });
    
    req.flash('success_msg', 'Password changed successfully');
    res.redirect('/user/profile');
  } catch (err) {
    console.error('API Error:', err);
    req.flash('error_msg', err.response?.data?.message || 'Failed to change password');
    res.redirect('/user/change-password');
  }
});

// Additional user routes could be added here

module.exports = router;