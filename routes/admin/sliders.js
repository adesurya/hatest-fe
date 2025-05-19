// routes/admin/sliders.js
const express = require('express');
const router = express.Router();
const { slidersAPI } = require('../../services/api');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/sliders');
        // Ensure the directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'slider-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
        }
        cb(null, true);
    }
});

// Route: List all sliders
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        console.log('Fetching sliders with search:', search);
        
        const response = await slidersAPI.getAllSliders(page, limit, search);
        
        // Access data with the correct structure
        const sliders = response.sliders || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || sliders.length
        };
        
        res.render('pages/admin/sliders/index', {
            title: 'Manajemen Slider',
            sliders: sliders,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load sliders data');
        res.redirect('/admin/dashboard');
    }
});

// Route: Form to add a new slider
router.get('/create', (req, res) => {
    res.render('pages/admin/sliders/form', {
        title: 'Tambah Slider Baru',
        user: req.session.user,
        slider: null,
        isEdit: false
    });
});

// Route: Process adding a new slider
router.post('/', upload.single('image'), async (req, res) => {
    try {
        console.log('Received form data:', req.body);
        
        // Create FormData for API request
        const formData = new FormData();
        
        // Add text fields
        formData.append('title', req.body.title);
        formData.append('description', req.body.description);
        formData.append('is_active', "true");
        formData.append('order_number', req.body.order_number);
        
        // Add image if provided
        if (req.file) {
            // Use relative path for the image that matches the backend structure
            const imagePath = `/uploads/sliders/${req.file.filename}`;
            formData.append('image_path', imagePath);
            
            // Read the file and append it to formData
            const fileData = fs.readFileSync(req.file.path);
            formData.append('image', new Blob([fileData]), req.file.filename);
        }
        
        const response = await slidersAPI.createSlider(formData);
        
        req.flash('success_msg', 'Slider berhasil ditambahkan');
        res.redirect('/admin/sliders');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to add slider');
        res.redirect('/admin/sliders/create');
    }
});

// Route: View slider details
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await slidersAPI.getSliderById(id);
        
        // Access slider from structure
        const slider = response.slider || {};
        
        res.render('pages/admin/sliders/detail', {
            title: 'Detail Slider',
            slider: slider,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load slider details');
        res.redirect('/admin/sliders');
    }
});

// Route: Form to edit a slider
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await slidersAPI.getSliderById(id);
        
        // Access slider from structure
        const slider = response.slider || {};
        
        res.render('pages/admin/sliders/form', {
            title: 'Edit Slider',
            slider: slider,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load slider data');
        res.redirect('/admin/sliders');
    }
});

// Route: Process updating a slider
router.post('/:id', upload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Updating slider ID ${id}`);
        
        // Create FormData for API request
        const formData = new FormData();
        
        // Add text fields
        formData.append('title', req.body.title);
        formData.append('description', req.body.description);
        formData.append('is_active', "true");
        formData.append('order_number', req.body.order_number);
        
        // Add image if provided
        if (req.file) {
            // Use relative path for the image that matches the backend structure
            const imagePath = `/uploads/sliders/${req.file.filename}`;
            formData.append('image_path', imagePath);
            
            // Read the file and append it to formData
            const fileData = fs.readFileSync(req.file.path);
            formData.append('image', new Blob([fileData]), req.file.filename);
        } else if (req.body.existing_image) {
            // Keep existing image
            formData.append('image_path', req.body.existing_image);
        }
        
        await slidersAPI.updateSlider(id, formData);
        
        req.flash('success_msg', 'Slider berhasil diperbarui');
        res.redirect('/admin/sliders');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to update slider');
        res.redirect(`/admin/sliders/edit/${req.params.id}`);
    }
});

// Route: Process deleting a slider
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await slidersAPI.deleteSlider(id);
        
        req.flash('success_msg', 'Slider berhasil dihapus');
        res.redirect('/admin/sliders');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete slider');
        res.redirect('/admin/sliders');
    }
});

module.exports = router;