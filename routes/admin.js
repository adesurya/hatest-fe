// routes/admin.js - Admin dashboard routes with API integration

const express = require('express');
const router = express.Router();
const { adminAPI } = require('../services/api');
const doctorsRouter = require('./admin/doctors');
const dokterMudaRouter = require('./admin/dokter-muda');
const medicalFacultiesRouter = require('./admin/medical-faculties');
const kurikulumMedisRouter = require('./admin/kurikulum-medis');
const webinarsRouter = require('./admin/webinars');
const slidersRouter = require('./admin/sliders');
const agendaRouter = require('./admin/agenda');
const aboutRouter = require('./admin/about');
const articlesRouter = require('./admin/articles');
const articleCategoriesRouter = require('./admin/article-categories');
const organizationStructureRouter = require('./admin/organization-structure');
const benefitsRouter = require('./admin/benefits');
const testimonialsRouter = require('./admin/testimonials');
const visionMissionRouter = require('./admin/vision-mission');
const contactsRouter = require('./admin/contacts');
const organizationHistoryRouter = require('./admin/organization-history');
const examsRouter = require('./admin/exams');
const examCategoriesRouter = require('./admin/exam-categories');
const transactionsRouter = require('./admin/transactions');
const userManagementRouter = require('./admin/users');

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
    // Jika tidak bisa mengakses API, kita gunakan data statis/default
    let dashboardStats = {
      totalUsers: 25345,
      userGrowth: 5.2,
      activeActivities: 18,
      activitiesGrowth: 12.5,
      totalArticles: 125,
      articlesGrowth: 8.3,
      newMessages: 42,
      messagesGrowth: 3.7,
      pendingVerification: 24,
      monthlyDues: 15750000,
      duesProgress: 65,
      upcomingActivities: 5,
      todayVisitors: 1256,
      visitorsProgress: 78,
      unreadNotifications: 3,
      notifications: [
        {
          title: 'New User Registration',
          message: 'A new user has registered and needs verification',
          date: new Date(),
          isRead: false,
          type: 'info',
          link: '/admin/users/verification'
        },
        {
          title: 'System Update Complete',
          message: 'The system update has been successfully completed',
          date: new Date(Date.now() - 3600000), // 1 hour ago
          isRead: true,
          type: 'success',
          link: '/admin/settings'
        },
        {
          title: 'New Contact Message',
          message: 'You have received a new contact form message',
          date: new Date(Date.now() - 10800000), // 3 hours ago
          isRead: true,
          type: 'info',
          link: '/admin/messages'
        }
      ],
      recentActivities: [],
      recentUsers: []
    };

    try {
      // Coba dapatkan data dari API
      const apiDashboardStats = await adminAPI.getDashboardStats();
      // Gabungkan dengan data default jika berhasil
      dashboardStats = { ...dashboardStats, ...apiDashboardStats };
    } catch (apiErr) {
      console.error('API Error (using default stats):', apiErr);
      // Gunakan data default jika API error
    }
    
    res.render('pages/admin/dashboard', {
      title: 'Admin Dashboard',
      stats: dashboardStats,
      user: req.session.user
    });
  } catch (err) {
    console.error('Dashboard rendering error:', err);
    
    // Check if it's an authentication error
    if (err.response && err.response.status === 401) {
      req.session.destroy();
      global.token = null;
      req.flash('error_msg', 'Your session has expired. Please log in again.');
      return res.redirect('/auth/login');
    }
    
    res.status(500).render('pages/error', {
      title: 'Error',
      message: err.message || 'Failed to load dashboard',
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

router.use('/doctors', doctorsRouter);
router.use('/dokter-muda', dokterMudaRouter);
router.use('/medical-faculties', medicalFacultiesRouter);
router.use('/kurikulum-medis', kurikulumMedisRouter);
router.use('/webinars', webinarsRouter);
router.use('/sliders', slidersRouter);
router.use('/agenda', agendaRouter);
router.use('/about', aboutRouter);
router.use('/articles', articlesRouter);
router.use('/articles/categories', articleCategoriesRouter);
router.use('/organization-structure', organizationStructureRouter);
router.use('/benefits', benefitsRouter);
router.use('/testimonials', testimonialsRouter);
router.use('/vision-mission', visionMissionRouter);
router.use('/contacts', contactsRouter);
router.use('/organization-history', organizationHistoryRouter);
router.use('/exams', examsRouter);
router.use('/exams/categories', examCategoriesRouter);
router.use('/transactions', transactionsRouter);
router.use('/users', userManagementRouter);

// Doctor Map route
router.get('/map', async (req, res) => {
  try {
    // Render the map view with current path for active menu
    res.render('pages/admin/map', {
      title: 'Map Dokter',
      user: req.session.user,
      path: '/admin/map' // Pass path for active menu
    });
  } catch (err) {
    console.error('Map rendering error:', err);
    
    // Check if it's an authentication error
    if (err.response && err.response.status === 401) {
      req.session.destroy();
      global.token = null;
      req.flash('error_msg', 'Your session has expired. Please log in again.');
      return res.redirect('/auth/login');
    }
    
    res.status(500).render('pages/error', {
      title: 'Error',
      message: err.message || 'Failed to load map',
      status: err.response?.status || 500
    });
  }
});


// Add more admin routes as needed for other features

module.exports = router;