// routes/admin.js - Admin dashboard routes

const express = require('express');
const router = express.Router();
const { adminAPI } = require('../services/api');

// Admin middleware - checks if user is admin
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    req.flash('error_msg', 'Access denied. Admin privileges required.');
    res.redirect('/auth/login');
  }
};

// Apply admin middleware to all routes
router.use(isAdmin);

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
    res.status(500).render('pages/error', {
      title: 'Error',
      message: err.response?.data?.message || 'Failed to load dashboard data',
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
    req.flash('error_msg', err.response?.data?.message || 'User not found');
    res.redirect('/admin/users');
  }
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const userData = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role
    };
    
    await adminAPI.createUser(userData);
    
    req.flash('success_msg', 'User created successfully');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('API Error:', err);
    req.flash('error_msg', err.response?.data?.message || 'Failed to create user');
    res.redirect('/admin/users/create');
  }
});

// Update user
router.post('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role
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
    req.flash('error_msg', err.response?.data?.message || 'Failed to delete user');
    res.redirect('/admin/users');
  }
});

// Sliders management
router.get('/sliders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const sliders = await adminAPI.getAdminSliders(page, limit);
    
    res.render('pages/admin/sliders', {
      title: 'Manage Sliders',
      sliders: sliders.data,
      pagination: {
        page: sliders.page,
        limit: sliders.limit,
        totalPages: sliders.totalPages,
        totalItems: sliders.totalItems
      },
      user: req.session.user
    });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).render('pages/error', {
      title: 'Error',
      message: err.response?.data?.message || 'Failed to load sliders data',
      status: err.response?.status || 500
    });
  }
});

// Slider create form
router.get('/sliders/create', (req, res) => {
  res.render('pages/admin/slider-form', {
    title: 'Create Slider',
    user: req.session.user,
    slider: null,
    isEdit: false
  });
});

// Slider edit form
router.get('/sliders/edit/:id', async (req, res) => {
  try {
    const sliderId = req.params.id;
    // Assuming getSliderById is a method in adminAPI
    const slider = await adminAPI.getSliderById(sliderId);
    
    res.render('pages/admin/slider-form', {
      title: 'Edit Slider',
      user: req.session.user,
      slider: slider,
      isEdit: true
    });
  } catch (err) {
    console.error('API Error:', err);
    req.flash('error_msg', err.response?.data?.message || 'Slider not found');
    res.redirect('/admin/sliders');
  }
});

// Create slider
router.post('/sliders', async (req, res) => {
  try {
    // Handle file upload for slider image
    // For simplicity, assuming image URL is sent directly
    const sliderData = {
      title: req.body.title,
      subtitle: req.body.subtitle,
      imageUrl: req.body.imageUrl,
      buttonText: req.body.buttonText,
      buttonUrl: req.body.buttonUrl,
      order: req.body.order,
      active: req.body.active === 'on'
    };
    
    await adminAPI.createSlider(sliderData);
    
    req.flash('success_msg', 'Slider created successfully');
    res.redirect('/admin/sliders');
  } catch (err) {
    console.error('API Error:', err);
    req.flash('error_msg', err.response?.data?.message || 'Failed to create slider');
    res.redirect('/admin/sliders/create');
  }
});

// Update slider
router.post('/sliders/:id', async (req, res) => {
  try {
    const sliderId = req.params.id;
    
    const sliderData = {
      title: req.body.title,
      subtitle: req.body.subtitle,
      imageUrl: req.body.imageUrl,
      buttonText: req.body.buttonText,
      buttonUrl: req.body.buttonUrl,
      order: req.body.order,
      active: req.body.active === 'on'
    };
    
    await adminAPI.updateSlider(sliderId, sliderData);
    
    req.flash('success_msg', 'Slider updated successfully');
    res.redirect('/admin/sliders');
  } catch (err) {
    console.error('API Error:', err);
    req.flash('error_msg', err.response?.data?.message || 'Failed to update slider');
    res.redirect(`/admin/sliders/edit/${req.params.id}`);
  }
});

// Delete slider
router.post('/sliders/delete/:id', async (req, res) => {
  try {
    const sliderId = req.params.id;
    
    await adminAPI.deleteSlider(sliderId);
    
    req.flash('success_msg', 'Slider deleted successfully');
    res.redirect('/admin/sliders');
  } catch (err) {
    console.error('API Error:', err);
    req.flash('error_msg', err.response?.data?.message || 'Failed to delete slider');
    res.redirect('/admin/sliders');
  }
});

// Articles management
router.get('/articles', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Assuming getAdminArticles is a method in adminAPI
    const articles = await adminAPI.getAdminArticles(page, limit);
    
    res.render('pages/admin/articles', {
      title: 'Manage Articles',
      articles: articles.data,
      pagination: {
        page: articles.page,
        limit: articles.limit,
        totalPages: articles.totalPages,
        totalItems: articles.totalItems
      },
      user: req.session.user
    });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).render('pages/error', {
      title: 'Error',
      message: err.response?.data?.message || 'Failed to load articles data',
      status: err.response?.status || 500
    });
  }
});

// Similar routes for other admin sections (activities, testimonials, etc.)
// would be added here, following the same pattern.

module.exports = router;