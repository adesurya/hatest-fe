// routes/user.js - User dashboard routes with API integration

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

// API token check middleware
const hasAPIToken = (req, res, next) => {
  if (global.token) {
    next();
  } else {
    return res.status(401).render('pages/error', {
      title: 'Error',
      message: 'Your session has expired. Please log in again.',
      status: 401
    });
  }
};

// User dashboard
router.get('/dashboard', hasAPIToken, async (req, res) => {
  try {
    const dashboardData = await userAPI.getUserDashboard();
    
    res.render('pages/user/dashboard', {
      title: 'Dashboard',
      dashboardData: dashboardData,
      user: req.session.user
    });
  } catch (err) {
    console.error('API Error:', err);
    
    // Check if it's an authentication error
    if (err.response && err.response.status === 401) {
      req.session.destroy();
      global.token = null;
      req.flash('error_msg', 'Your session has expired. Please log in again.');
      return res.redirect('/auth/login');
    }
    
    res.status(500).render('pages/error', {
      title: 'Error',
      message: err.response?.data?.message || 'Failed to load dashboard data',
      status: err.response?.status || 500
    });
  }
});

// User profile page
router.get('/profile', hasAPIToken, async (req, res) => {
  try {
    // We'll load the profile data client-side with JavaScript
    res.render('pages/user/profile', {
      title: 'My Profile',
      user: req.session.user
    });
  } catch (err) {
    console.error('API Error:', err);
    
    // Check if it's an authentication error
    if (err.response && err.response.status === 401) {
      req.session.destroy();
      global.token = null;
      req.flash('error_msg', 'Your session has expired. Please log in again.');
      return res.redirect('/auth/login');
    }
    
    res.status(500).render('pages/error', {
      title: 'Error',
      message: err.response?.data?.message || 'Failed to load profile data',
      status: err.response?.status || 500
    });
  }
});

// Change password page
router.get('/change-password', hasAPIToken, (req, res) => {
  res.render('pages/user/change-password', {
    title: 'Change Password',
    user: req.session.user
  });
});

// User activities page
router.get('/activities', hasAPIToken, async (req, res) => {
  try {
    const activities = await userAPI.getUserActivities();
    
    res.render('pages/user/activities', {
      title: 'My Activities',
      activities: activities,
      user: req.session.user
    });
  } catch (err) {
    console.error('API Error:', err);
    
    // Check if it's an authentication error
    if (err.response && err.response.status === 401) {
      req.session.destroy();
      global.token = null;
      req.flash('error_msg', 'Your session has expired. Please log in again.');
      return res.redirect('/auth/login');
    }
    
    res.status(500).render('pages/error', {
      title: 'Error',
      message: err.response?.data?.message || 'Failed to load activities data',
      status: err.response?.status || 500
    });
  }
});

// User membership page
router.get('/membership', hasAPIToken, async (req, res) => {
  try {
    const membership = await userAPI.getUserMembership();
    
    res.render('pages/user/membership', {
      title: 'Membership',
      membership: membership,
      user: req.session.user
    });
  } catch (err) {
    console.error('API Error:', err);
    
    // Check if it's an authentication error
    if (err.response && err.response.status === 401) {
      req.session.destroy();
      global.token = null;
      req.flash('error_msg', 'Your session has expired. Please log in again.');
      return res.redirect('/auth/login');
    }
    
    res.status(500).render('pages/error', {
      title: 'Error',
      message: err.response?.data?.message || 'Failed to load membership data',
      status: err.response?.status || 500
    });
  }
});

// User certificates page
router.get('/certificates', hasAPIToken, async (req, res) => {
  try {
    const certificates = await userAPI.getUserCertificates();
    
    res.render('pages/user/certificates', {
      title: 'Certificates',
      certificates: certificates,
      user: req.session.user
    });
  } catch (err) {
    console.error('API Error:', err);
    
    // Check if it's an authentication error
    if (err.response && err.response.status === 401) {
      req.session.destroy();
      global.token = null;
      req.flash('error_msg', 'Your session has expired. Please log in again.');
      return res.redirect('/auth/login');
    }
    
    res.status(500).render('pages/error', {
      title: 'Error',
      message: err.response?.data?.message || 'Failed to load certificates data',
      status: err.response?.status || 500
    });
  }
});

module.exports = router;