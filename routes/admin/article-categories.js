// routes/admin/article-categories.js - FIXED
const express = require('express');
const router = express.Router();
const { articleCategoriesAPI } = require('../../services/api');

// Daftar semua kategori artikel
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        console.log('Fetching article categories with search:', search);
        
        const response = await articleCategoriesAPI.getAllCategories(page, limit, search);
        
        // Akses data dengan struktur yang benar
        const categories = response.categories || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || categories.length
        };
        
        res.render('pages/admin/articles/categories/index', {
            title: 'Manajemen Kategori Artikel',
            categories: categories,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load article categories data');
        res.redirect('/admin/dashboard');
    }
});

// Tampilkan form tambah kategori
router.get('/create', (req, res) => {
    res.render('pages/admin/articles/categories/form', {
        title: 'Tambah Kategori Artikel',
        user: req.session.user,
        category: null,
        isEdit: false
    });
});

// Proses tambah kategori
router.post('/', async (req, res) => {
    try {
        // Format data sebagai JSON seperti yang diharapkan API
        const categoryData = {
            name: req.body.name,
            description: req.body.description || '' // Make sure description is never undefined
        };
        
        // is_active dikonversi dari checkbox ke boolean
        // if (req.body.is_active === 'on') {
        //     categoryData.is_active = true;
        // } else {
        //     categoryData.is_active = false;
        // }
        
        console.log('Sending category data to API:', categoryData);
        await articleCategoriesAPI.createCategory(categoryData);
        
        req.flash('success_msg', 'Kategori artikel berhasil ditambahkan');
        res.redirect('/admin/articles/categories');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to add article category');
        res.redirect('/admin/articles/categories/create');
    }
});

// Tampilkan form edit kategori
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await articleCategoriesAPI.getCategoryById(id);
        
        // Akses kategori dari struktur response yang benar
        const category = response.category || {};
        
        res.render('pages/admin/articles/categories/form', {
            title: 'Edit Kategori Artikel',
            category: category,
            user: req.session.user,
            isEdit: true
        });
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load category data');
        res.redirect('/admin/articles/categories');
    }
});

// Proses update kategori
router.post('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Format data sebagai JSON seperti yang diharapkan API
        const categoryData = {
            name: req.body.name,
            description: req.body.description || '' // Make sure description is never undefined
        };
        
        // is_active dikonversi dari checkbox ke boolean
        if (req.body.is_active === 'on') {
            categoryData.is_active = true;
        } else {
            categoryData.is_active = false;
        }
        
        console.log(`Updating category ID ${id} with data:`, categoryData);
        await articleCategoriesAPI.updateCategory(id, categoryData);
        
        req.flash('success_msg', 'Kategori artikel berhasil diperbarui');
        res.redirect('/admin/articles/categories');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to update article category');
        res.redirect(`/admin/articles/categories/edit/${req.params.id}`);
    }
});

// Proses hapus kategori
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await articleCategoriesAPI.deleteCategory(id);
        
        req.flash('success_msg', 'Kategori artikel berhasil dihapus');
        res.redirect('/admin/articles/categories');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete article category');
        res.redirect('/admin/articles/categories');
    }
});

module.exports = router;