// routes/admin.js - Admin dashboard routes with API integration

const express = require('express');
const router = express.Router();
const { adminAPI } = require('../services/api');

// Admin middleware - checks if user is admin
const isAdmin = (req, res, next) => {
  if (req.session.user && (req.session.user.role === 'admin' || req.session.user.is_admin === 1)) {
    next();
  } else {
    req.flash('error_msg', 'Access denied. Admin privileges required.');
    res.redirect('/auth/login');
  }
};

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

// Apply admin middleware to all routes
router.use(isAdmin);
router.use(hasAPIToken);

// Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const dashboardStats = await adminAPI.getDashboardStats();
    
    res.render('pages/admin/dashboard', {
      title: 'Admin Dashboard',
      stats: dashboardStats,
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

router.get('/profile', async (req, res) => {
  try {
    // Render the admin profile page
    res.render('pages/admin/profile', {
      title: 'Admin Profile',
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

// Users management
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const users = await adminAPI.getUsers(page, limit);
    
    res.render('pages/admin/users', {
      title: 'Manage Users',
      users: users.data,
      pagination: {
        page: users.page,
        limit: users.limit,
        totalPages: users.totalPages,
        totalItems: users.totalItems
      },
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
      message: err.response?.data?.message || 'Failed to load users data',
      status: err.response?.status || 500
    });
  }
});

// User create form
router.get('/users/create', (req, res) => {
  res.render('pages/admin/user-form', {
    title: 'Create User',
    user: req.session.user,
    userData: null,
    isEdit: false
  });
});

// User edit form
router.get('/users/edit/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = await adminAPI.getUserById(userId);
    
    res.render('pages/admin/user-form', {
      title: 'Edit User',
      user: req.session.user,
      userData: userData,
      isEdit: true
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
    
    req.flash('error_msg', err.response?.data?.message || 'User not found');
    res.redirect('/admin/users');
  }
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const userData = {
      full_name: req.body.full_name,
      email: req.body.email,
      password: req.body.password,
      phone_number: req.body.phone_number,
      birth_place: req.body.birth_place,
      birth_date: req.body.birth_date,
      institution: req.body.institution,
      collegium_certificate_number: req.body.collegium_certificate_number,
      is_admin: req.body.is_admin === 'on' ? 1 : 0
    };
    
    await adminAPI.createUser(userData);
    
    req.flash('success_msg', 'User created successfully');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('API Error:', err);
    
    // Check if it's an authentication error
    if (err.response && err.response.status === 401) {
      req.session.destroy();
      global.token = null;
      req.flash('error_msg', 'Your session has expired. Please log in again.');
      return res.redirect('/auth/login');
    }
    
    req.flash('error_msg', err.response?.data?.message || 'Failed to create user');
    res.redirect('/admin/users/create');
  }
});

// Update user
router.post('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = {
      full_name: req.body.full_name,
      email: req.body.email,
      phone_number: req.body.phone_number,
      birth_place: req.body.birth_place,
      birth_date: req.body.birth_date,
      institution: req.body.institution,
      collegium_certificate_number: req.body.collegium_certificate_number,
      is_admin: req.body.is_admin === 'on' ? 1 : 0
    };
    
    // Only update password if provided
    if (req.body.password) {
      userData.password = req.body.password;
    }
    
    await adminAPI.updateUser(userId, userData);
    
    req.flash('success_msg', 'User updated successfully');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('API Error:', err);
    
    // Check if it's an authentication error
    if (err.response && err.response.status === 401) {
      req.session.destroy();
      global.token = null;
      req.flash('error_msg', 'Your session has expired. Please log in again.');
      return res.redirect('/auth/login');
    }
    
    req.flash('error_msg', err.response?.data?.message || 'Failed to update user');
    res.redirect(`/admin/users/edit/${req.params.id}`);
  }
});

// Delete user
router.post('/users/delete/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    await adminAPI.deleteUser(userId);
    
    req.flash('success_msg', 'User deleted successfully');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('API Error:', err);
    
    // Check if it's an authentication error
    if (err.response && err.response.status === 401) {
      req.session.destroy();
      global.token = null;
      req.flash('error_msg', 'Your session has expired. Please log in again.');
      return res.redirect('/auth/login');
    }
    
    req.flash('error_msg', err.response?.data?.message || 'Failed to delete user');
    res.redirect('/admin/users');
  }
});

// Add more admin routes as needed for other features

module.exports = router;