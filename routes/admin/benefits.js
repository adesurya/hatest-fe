// routes/admin/benefits.js
const express = require('express');
const router = express.Router();
const { benefitsAPI } = require('../../services/api');

// Route: List all benefits
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        console.log('Fetching benefits with search:', search);
        
        const response = await benefitsAPI.getAllBenefits(page, limit, search);
        
        // Access data with correct structure
        const benefits = response.benefits || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || benefits.length
        };
        
        res.render('pages/admin/benefits/index', {
            title: 'Manajemen Manfaat Organisasi',
            benefits: benefits,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load benefits data');
        res.redirect('/admin/dashboard');
    }
});

// Route: Form to add new benefit
router.get('/create', (req, res) => {
    res.render('pages/admin/benefits/form', {
        title: 'Tambah Manfaat Organisasi Baru',
        user: req.session.user,
        benefit: null,
        isEdit: false
    });
});

// Route: Process adding benefit
router.post('/', async (req, res) => {
    try {
        console.log('Received form data:', req.body);
        
        const benefitData = {
            ...req.body,
            is_active: req.body.is_active === 'on' ? 1 : 0,
            sort_order: parseInt(req.body.sort_order) || 0
        };
        
        const response = await benefitsAPI.createBenefit(benefitData);
        
        req.flash('success_msg', 'Manfaat organisasi berhasil ditambahkan');
        res.redirect('/admin/benefits');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to add benefit');
        res.redirect('/admin/benefits/create');
    }
});

// Route: Benefit detail
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await benefitsAPI.getBenefitById(id);
        
        // Access benefit from correct response structure
        const benefit = response.benefit || {};
        
        res.render('pages/admin/benefits/detail', {
            title: 'Detail Manfaat Organisasi',
            benefit: benefit,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load benefit details');
        res.redirect('/admin/benefits');
    }
});

// Route: Form to edit benefit
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await benefitsAPI.getBenefitById(id);
        
        // Access benefit from correct response structure
        const benefit = response.benefit || {};
        
        res.render('pages/admin/benefits/form', {
            title: 'Edit Manfaat Organisasi',
            benefit: benefit,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load benefit data');
        res.redirect('/admin/benefits');
    }
});

// Route: Process updating benefit
router.post('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Updating benefit ID ${id}`);
        
        const benefitData = {
            ...req.body,
            is_active: req.body.is_active === 'on' ? 1 : 0,
            sort_order: parseInt(req.body.sort_order) || 0
        };
        
        await benefitsAPI.updateBenefit(id, benefitData);
        
        req.flash('success_msg', 'Data manfaat organisasi berhasil diperbarui');
        res.redirect('/admin/benefits');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to update benefit');
        res.redirect(`/admin/benefits/edit/${req.params.id}`);
    }
});

// Route: Process deleting benefit
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await benefitsAPI.deleteBenefit(id);
        
        req.flash('success_msg', 'Manfaat organisasi berhasil dihapus');
        res.redirect('/admin/benefits');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete benefit');
        res.redirect('/admin/benefits');
    }
});

module.exports = router;