// routes/admin/testimonials.js
const express = require('express');
const router = express.Router();
const { testimonialsAPI } = require('../../services/api');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios'); 

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Konfigurasi upload untuk logo testimonial
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = path.join(__dirname, '../../public/uploads/testimonials');
        
        // Buat direktori jika belum ada
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        // Buat nama file unik dengan timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'testimonial-' + uniqueSuffix + ext);
    }
});

// Filter untuk memeriksa tipe file
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedFileTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Format file tidak didukung. Gunakan JPG, JPEG, PNG, GIF, atau SVG.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Route: Daftar semua testimonial
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        console.log('Fetching testimonials with search:', search);
        
        const response = await testimonialsAPI.getAllTestimonials(page, limit, search);
        
        // Akses data dengan struktur yang benar
        const testimonials = response.testimonials || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || testimonials.length
        };
        
        res.render('pages/admin/testimonials/index', {
            title: 'Manajemen Testimoni',
            testimonials: testimonials,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load testimonials data');
        res.redirect('/admin/dashboard');
    }
});

// Route: Form tambah testimonial baru
router.get('/create', (req, res) => {
    res.render('pages/admin/testimonials/form', {
        title: 'Tambah Testimoni Baru',
        user: req.session.user,
        testimonial: null,
        isEdit: false
    });
});

// Route: Proses tambah testimonial
router.post('/', upload.single('logo'), async (req, res) => {
    try {
        console.log('Received form data:', req.body);
        
        // Buat objek data untuk dikirim ke API
        const testimonialData = {
            organization_name: req.body.organization_name,
            representative_name: req.body.representative_name,
            representative_position: req.body.representative_position,
            content: req.body.content,
            rating: req.body.rating,
            is_active: "true"
        };
        
        // Jika ada file logo
        if (req.file) {
            const logoPath = `/uploads/testimonials/${path.basename(req.file.path)}`;
            testimonialData.logo_path = logoPath;
        }
        
        // Kirim data ke API menggunakan format multipart/form-data
        const form = new FormData();
        
        // Tambahkan semua data ke form
        Object.keys(testimonialData).forEach(key => {
            form.append(key, testimonialData[key]);
        });
        
        // Jika ada file, tambahkan ke form dengan cara yang benar
        if (req.file) {
            // Buat file stream dan tambahkan ke form
            const fileStream = fs.createReadStream(req.file.path);
            form.append('logo', fileStream, {
                filename: path.basename(req.file.path),
                contentType: req.file.mimetype
            });
        }
        
        // Kirim request ke API
        const response = await axios.post(`${API_BASE_URL}/testimonials`, form, {
            headers: {
                'Authorization': `Bearer ${global.token}`,
                ...form.getHeaders()
            }
        });
        
        req.flash('success_msg', 'Testimoni berhasil ditambahkan');
        res.redirect('/admin/testimonials');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to add testimonial');
        res.redirect('/admin/testimonials/create');
    }
});

// Route: Detail testimonial
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await testimonialsAPI.getTestimonialById(id);
        
        // Akses testimonial dari struktur response yang benar
        const testimonial = response.testimonial || {};
        
        res.render('pages/admin/testimonials/detail', {
            title: 'Detail Testimoni',
            testimonial: testimonial,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load testimonial details');
        res.redirect('/admin/testimonials');
    }
});

// Route: Form edit testimonial
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await testimonialsAPI.getTestimonialById(id);
        
        // Akses testimonial dari struktur response yang benar
        const testimonial = response.testimonial || {};
        
        res.render('pages/admin/testimonials/form', {
            title: 'Edit Testimoni',
            testimonial: testimonial,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load testimonial data');
        res.redirect('/admin/testimonials');
    }
});

// Route: Proses update testimonial
router.post('/:id', upload.single('logo'), async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Updating testimonial ID ${id}`);
        
        // Buat objek data untuk dikirim ke API
        const testimonialData = {
            organization_name: req.body.organization_name,
            representative_name: req.body.representative_name,
            representative_position: req.body.representative_position,
            content: req.body.content,
            rating: req.body.rating,
            is_active: "true"
        };
        
        // Jika ada file logo baru
        if (req.file) {
            const logoPath = `/uploads/testimonials/${path.basename(req.file.path)}`;
            testimonialData.logo_path = logoPath;
        }
        
        // Kirim data ke API menggunakan format multipart/form-data
        const form = new FormData();
        
        // Tambahkan semua data ke form
        Object.keys(testimonialData).forEach(key => {
            form.append(key, testimonialData[key]);
        });
        
        // Jika ada file, tambahkan ke form dengan cara yang benar
        if (req.file) {
            // Buat file stream dan tambahkan ke form
            const fileStream = fs.createReadStream(req.file.path);
            form.append('logo', fileStream, {
                filename: path.basename(req.file.path),
                contentType: req.file.mimetype
            });
        }
        
        // Kirim request ke API
        const response = await axios.put(`${API_BASE_URL}/testimonials/${id}`, form, {
            headers: {
                'Authorization': `Bearer ${global.token}`,
                ...form.getHeaders()
            }
        });
        
        req.flash('success_msg', 'Data testimoni berhasil diperbarui');
        res.redirect('/admin/testimonials');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to update testimonial');
        res.redirect(`/admin/testimonials/edit/${req.params.id}`);
    }
});

// Route: Proses hapus testimonial
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await testimonialsAPI.deleteTestimonial(id);
        
        req.flash('success_msg', 'Testimoni berhasil dihapus');
        res.redirect('/admin/testimonials');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete testimonial');
        res.redirect('/admin/testimonials');
    }
});

module.exports = router;