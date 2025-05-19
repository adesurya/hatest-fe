// routes/admin/organization-history.js
const express = require('express');
const router = express.Router();
const { organizationHistoryAPI } = require('../../services/api');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/history');
        // Buat direktori jika tidak ada
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'history-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Batas ukuran file (5MB)
    fileFilter: function(req, file, cb) {
        // Hanya izinkan jenis file gambar
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar yang diizinkan!'), false);
        }
    }
});

// Route: Daftar semua sejarah organisasi
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        console.log('Fetching organization history with search:', search);
        
        const response = await organizationHistoryAPI.getAllHistory(page, limit, search);
        
        // Akses data dengan struktur yang benar
        const histories = response.histories || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || histories.length
        };
        
        res.render('pages/admin/organization-history/index', {
            title: 'Manajemen Sejarah Organisasi',
            histories: histories,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load organization history data');
        res.redirect('/admin/dashboard');
    }
});

// Route: Form tambah sejarah organisasi baru
router.get('/create', (req, res) => {
    res.render('pages/admin/organization-history/form', {
        title: 'Tambah Sejarah Organisasi Baru',
        user: req.session.user,
        history: null,
        isEdit: false
    });
});

// Route: Proses tambah sejarah organisasi
router.post('/', upload.single('image'), async (req, res) => {
    try {
        console.log('Received form data:', req.body);
        
        const formData = new FormData();
        formData.append('title', req.body.title);
        formData.append('content', req.body.content);
        formData.append('year', req.body.year);
        formData.append('is_active', req.body.is_active === 'on' ? true : false);
        
        // Tambahkan file gambar jika ada
        if (req.file) {
            // Buat path relatif untuk disimpan di database
            const relativePath = `/uploads/history/${req.file.filename}`;
            
            // Baca file yang telah disimpan
            const imageFile = fs.readFileSync(req.file.path);
            
            // Append file ke formData
            formData.append('image', new Blob([imageFile]), req.file.filename);
            
            // Tambahkan path gambar ke formData
            formData.append('image_path', relativePath);
        }
        
        const response = await organizationHistoryAPI.createHistory(formData);
        
        req.flash('success_msg', 'Sejarah organisasi berhasil ditambahkan');
        res.redirect('/admin/organization-history');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to add organization history');
        res.redirect('/admin/organization-history/create');
    }
});

// Route: Detail sejarah organisasi
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await organizationHistoryAPI.getHistoryById(id);
        
        // Akses sejarah dari struktur response yang benar
        const history = response.history || {};
        
        res.render('pages/admin/organization-history/detail', {
            title: 'Detail Sejarah Organisasi',
            history: history,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load history details');
        res.redirect('/admin/organization-history');
    }
});

// Route: Form edit sejarah organisasi
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await organizationHistoryAPI.getHistoryById(id);
        
        // Akses sejarah dari struktur response yang benar
        const history = response.history || {};
        
        res.render('pages/admin/organization-history/form', {
            title: 'Edit Sejarah Organisasi',
            history: history,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load history data');
        res.redirect('/admin/organization-history');
    }
});

// Route: Proses update sejarah organisasi
router.post('/:id', upload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Updating organization history ID ${id}`);
        
        const formData = new FormData();
        formData.append('title', req.body.title);
        formData.append('content', req.body.content);
        formData.append('year', req.body.year);
        formData.append('is_active', req.body.is_active === 'on' ? true : false);
        
        // Check if there's a new image file
        if (req.file) {
            // Buat path relatif untuk disimpan di database
            const relativePath = `/uploads/history/${req.file.filename}`;
            
            // Baca file yang telah disimpan
            const imageFile = fs.readFileSync(req.file.path);
            
            // Append file ke formData
            formData.append('image', new Blob([imageFile]), req.file.filename);
            
            // Tambahkan path gambar ke formData
            formData.append('image_path', relativePath);
            
            await organizationHistoryAPI.updateHistory(id, formData);
        } else {
            // If no new image is uploaded, use the regular PUT request without multipart/form-data
            const historyData = {
                title: req.body.title,
                content: req.body.content,
                year: req.body.year,
                is_active: req.body.is_active === 'on' ? true : false
            };
            
            await organizationHistoryAPI.updateHistoryWithoutImage(id, historyData);
        }
        
        req.flash('success_msg', 'Data sejarah organisasi berhasil diperbarui');
        res.redirect('/admin/organization-history');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to update organization history');
        res.redirect(`/admin/organization-history/edit/${req.params.id}`);
    }
});

// Route: Proses hapus sejarah organisasi
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await organizationHistoryAPI.deleteHistory(id);
        
        req.flash('success_msg', 'Sejarah organisasi berhasil dihapus');
        res.redirect('/admin/organization-history');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete organization history');
        res.redirect('/admin/organization-history');
    }
});

module.exports = router;