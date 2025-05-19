// routes/admin/users.js - User management routes with corrected API handling
const express = require('express');
const router = express.Router();
const { adminAPI } = require('../../services/api');

// Get all users with pagination, search
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        console.log('Fetching users with search:', search);
        
        const response = await adminAPI.getUsers(page, limit, search);
        console.log(response);
        // Access data with the correct structure from the API response
        const users = response.users || [];
        const pagination = response.pagination || {
            total: users.length,
            totalPages: 1,
            currentPage: page,
            limit: limit
        };
        
        res.render('pages/admin/users/index', {
            title: 'Manajemen User',
            users: users,
            pagination: pagination,
            user: req.session.user,
            search: search
        });
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load users data');
        res.redirect('/admin/dashboard');
    }
});

// Get user by ID (detail page)
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await adminAPI.getUserById(id);
        
        // Access user from the correct response structure
        const userData = response.user || {};
        
        res.render('pages/admin/users/detail', {
            title: 'Detail User',
            userData: userData,
            user: req.session.user
        });
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load user details');
        res.redirect('/admin/users');
    }
});

module.exports = router;