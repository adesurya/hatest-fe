// routes/admin/medical-faculties.js
const express = require('express');
const router = express.Router();
const { medicalFacultiesAPI } = require('../../services/api');

// Route: Daftar semua fakultas medis
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        console.log('Fetching medical faculties with search:', search);
        
        const response = await medicalFacultiesAPI.getAllFaculties(page, limit, search);
        
        // Akses data dengan struktur yang benar
        const faculties = response.faculties || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || faculties.length
        };
        
        res.render('pages/admin/medical-faculties/index', {
            title: 'Manajemen Fakultas Medis',
            faculties: faculties,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load medical faculties data');
        res.redirect('/admin/dashboard');
    }
});

// Route: Form tambah fakultas medis baru
router.get('/create', (req, res) => {
    res.render('pages/admin/medical-faculties/form', {
        title: 'Tambah Fakultas Medis Baru',
        user: req.session.user,
        faculty: null,
        isEdit: false
    });
});

// Route: Proses tambah fakultas medis
router.post('/', async (req, res) => {
    try {
        console.log('Received form data:', req.body);
        
        // Konversi angka numerik
        const facultyData = {
            ...req.body,
            active_students: parseInt(req.body.active_students),
            established_year: parseInt(req.body.established_year)
        };
        
        const response = await medicalFacultiesAPI.createFaculty(facultyData);
        
        req.flash('success_msg', 'Fakultas medis berhasil ditambahkan');
        res.redirect('/admin/medical-faculties');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to add medical faculty');
        res.redirect('/admin/medical-faculties/create');
    }
});

// Route: Detail fakultas medis
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await medicalFacultiesAPI.getFacultyById(id);
        
        // Akses fakultas dari struktur response yang benar
        const faculty = response.faculty || {};
        
        res.render('pages/admin/medical-faculties/detail', {
            title: 'Detail Fakultas Medis',
            faculty: faculty,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load faculty details');
        res.redirect('/admin/medical-faculties');
    }
});

// Route: Form edit fakultas medis
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await medicalFacultiesAPI.getFacultyById(id);
        
        // Akses fakultas dari struktur response yang benar
        const faculty = response.faculty || {};
        
        res.render('pages/admin/medical-faculties/form', {
            title: 'Edit Fakultas Medis',
            faculty: faculty,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load faculty data');
        res.redirect('/admin/medical-faculties');
    }
});

// Route: Proses update fakultas medis
router.post('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Updating medical faculty ID ${id}`);
        
        // Konversi angka numerik
        const facultyData = {
            ...req.body,
            active_students: parseInt(req.body.active_students),
            established_year: parseInt(req.body.established_year)
        };
        
        await medicalFacultiesAPI.updateFaculty(id, facultyData);
        
        req.flash('success_msg', 'Data fakultas medis berhasil diperbarui');
        res.redirect('/admin/medical-faculties');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to update medical faculty');
        res.redirect(`/admin/medical-faculties/edit/${req.params.id}`);
    }
});

// Route: Proses hapus fakultas medis
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await medicalFacultiesAPI.deleteFaculty(id);
        
        req.flash('success_msg', 'Fakultas medis berhasil dihapus');
        res.redirect('/admin/medical-faculties');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete medical faculty');
        res.redirect('/admin/medical-faculties');
    }
});

module.exports = router;