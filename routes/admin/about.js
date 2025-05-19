// routes/admin/about.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const { aboutAPI } = require('../../services/api');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/about');
        // Pastikan direktori ada
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'about-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // Limit: 2MB
    },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports image files - ' + filetypes));
    }
}).single('image');

// Route: Daftar semua profil about
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        console.log('Fetching about profiles with search:', search);
        
        const response = await aboutAPI.getAllProfiles(page, limit, search);
        
        // Akses data dengan struktur yang benar
        const profiles = response.profiles || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || profiles.length
        };
        
        res.render('pages/admin/about/index', {
            title: 'Manajemen About',
            profiles: profiles,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load about profiles data');
        res.redirect('/admin/dashboard');
    }
});

// Route: Form tambah profil about baru
router.get('/create', (req, res) => {
    res.render('pages/admin/about/form', {
        title: 'Tambah Profil About Baru',
        user: req.session.user,
        profile: null,
        isEdit: false
    });
});

// Route: Proses tambah profil about - FIXED
router.post('/', (req, res) => {
    upload(req, res, async function(err) {
        try {
            if (err) {
                console.error('Upload Error:', err);
                req.flash('error_msg', err.message);
                return res.redirect('/admin/about/create');
            }
            
            console.log('Received form data:', req.body);
            
            // Buat object data dengan format yang benar
            const formData = new FormData();
            
            // Tambahkan field data dengan format yang benar
            formData.append('title', req.body.title || '');
            formData.append('description', req.body.description || '');
            
            // Pastikan display_order adalah angka valid
            const displayOrder = parseInt(req.body.display_order);
            formData.append('display_order', isNaN(displayOrder) ? 1 : displayOrder);
            
            // Konversi is_active ke boolean
            const isActive = req.body.is_active === 'on' || req.body.is_active === 'true' || req.body.is_active === true;
            formData.append('is_active', "true");
            
            // Tambahkan file gambar jika ada
            if (req.file) {
                // Buat path relatif untuk disimpan di database
                const relativePath = `/uploads/about/${req.file.filename}`;
                
                // Baca file gambar dari filesystem
                const fileBuffer = fs.readFileSync(req.file.path);
                
                // Buat File object dari buffer
                const fileBlob = new Blob([fileBuffer], { type: req.file.mimetype });
                formData.append('image', fileBlob, req.file.filename);
                
                // Simpan juga path relatif
                formData.append('image_path', relativePath);
            }
            
            console.log('Sending data to API:', {
                title: req.body.title,
                description: req.body.description,
                display_order: isNaN(displayOrder) ? 1 : displayOrder,
                is_active: isActive,
                file: req.file ? req.file.filename : 'No file'
            });
            
            const response = await aboutAPI.createProfile(formData);
            
            req.flash('success_msg', 'Profil about berhasil ditambahkan');
            res.redirect('/admin/about');
        } catch (err) {
            console.error('API Error:', err);
            
            if (err.response) {
                console.error('API Error Response:', err.response.status, err.response.data);
            }
            
            if (err.response && err.response.status === 401) {
                req.session.destroy();
                global.token = null;
                req.flash('error_msg', 'Your session has expired. Please log in again.');
                return res.redirect('/auth/login');
            }
            
            req.flash('error_msg', err.response?.data?.message || 'Failed to add about profile');
            res.redirect('/admin/about/create');
        }
    });
});

// Route: Detail profil about
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await aboutAPI.getProfileById(id);
        
        // Akses profile dari struktur response yang benar
        const profile = response.profile || {};
        
        res.render('pages/admin/about/detail', {
            title: 'Detail Profil About',
            profile: profile,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load profile details');
        res.redirect('/admin/about');
    }
});

// Route: Form edit profil about
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await aboutAPI.getProfileById(id);
        
        // Akses profile dari struktur response yang benar
        const profile = response.profile || {};
        
        res.render('pages/admin/about/form', {
            title: 'Edit Profil About',
            profile: profile,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load profile data');
        res.redirect('/admin/about');
    }
});

// Route: Proses update profil about - FIXED
router.post('/:id', (req, res) => {
    upload(req, res, async function(err) {
        try {
            if (err) {
                console.error('Upload Error:', err);
                req.flash('error_msg', err.message);
                return res.redirect(`/admin/about/edit/${req.params.id}`);
            }
            
            const id = req.params.id;
            console.log(`Updating about profile ID ${id}`);
            console.log('Received form data:', req.body);
            
            // Buat object data dengan format yang benar
            const formData = new FormData();
            
            // Tambahkan field data dengan format yang benar
            formData.append('title', req.body.title || '');
            formData.append('description', req.body.description || '');
            
            // Pastikan display_order adalah angka valid
            const displayOrder = parseInt(req.body.display_order);
            formData.append('display_order', isNaN(displayOrder) ? 1 : displayOrder);
            
            // Konversi is_active ke boolean
            const isActive = req.body.is_active === 'on' || req.body.is_active === 'true' || req.body.is_active === true;
            formData.append('is_active', "true");
            
            // Tambahkan file gambar jika ada
            if (req.file) {
                // Buat path relatif untuk disimpan di database
                const relativePath = `/uploads/about/${req.file.filename}`;
                
                // Baca file gambar dari filesystem
                const fileBuffer = fs.readFileSync(req.file.path);
                
                // Buat File object dari buffer
                const fileBlob = new Blob([fileBuffer], { type: req.file.mimetype });
                formData.append('image', fileBlob, req.file.filename);
                
                // Simpan juga path relatif
                formData.append('image_path', relativePath);
            }
            
            console.log('Sending data to API:', {
                title: req.body.title,
                description: req.body.description,
                display_order: isNaN(displayOrder) ? 1 : displayOrder,
                is_active: isActive,
                file: req.file ? req.file.filename : 'No file'
            });
            
            await aboutAPI.updateProfile(id, formData);
            
            req.flash('success_msg', 'Data profil about berhasil diperbarui');
            res.redirect('/admin/about');
        } catch (err) {
            console.error('API Error:', err);
            
            if (err.response) {
                console.error('API Error Response:', err.response.status, err.response.data);
            }
            
            if (err.response && err.response.status === 401) {
                req.session.destroy();
                global.token = null;
                req.flash('error_msg', 'Your session has expired. Please log in again.');
                return res.redirect('/auth/login');
            }
            
            req.flash('error_msg', err.response?.data?.message || 'Failed to update about profile');
            res.redirect(`/admin/about/edit/${req.params.id}`);
        }
    });
});

// Route: Proses hapus profil about
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Dapatkan data profil dulu untuk mengetahui path file gambar
        const profileData = await aboutAPI.getProfileById(id);
        const imagePath = profileData.profile?.image_path;
        
        // Hapus profil dari database
        await aboutAPI.deleteProfile(id);
        
        // Hapus file gambar jika ada
        if (imagePath) {
            const fullPath = path.join(__dirname, '../../public', imagePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }
        
        req.flash('success_msg', 'Profil about berhasil dihapus');
        res.redirect('/admin/about');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete about profile');
        res.redirect('/admin/about');
    }
});

module.exports = router;