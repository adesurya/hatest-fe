// routes/admin/organization-structure.js (Final version)
const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

// API Base URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/org-structure');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        // Accept only images
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Hanya file gambar yang diizinkan!'), false);
        }
        cb(null, true);
    }
});

// API Calls functions for Organization Structure
const organizationStructureAPI = {
    // Get all organization structures with pagination
    getAllStructures: async (page = 1, limit = 10, search = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/organization/structure${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/organization/structure${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.structures?.length || 0} structures from API`);
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Get active organization structures
    getActiveStructures: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/organization/structure/active`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.structures?.length || 0} active structures from API`);
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Get organization structure by ID
    getStructureById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/organization/structure/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Delete organization structure
    deleteStructure: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/organization/structure/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

// Route: Daftar semua struktur organisasi
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        console.log('Fetching organization structures with search:', search);
        
        const response = await organizationStructureAPI.getAllStructures(page, limit, search);
        
        // Akses data dengan struktur yang benar
        const structures = response.structures || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || structures.length
        };
        
        res.render('pages/admin/organization-structure/index', {
            title: 'Manajemen Struktur Organisasi',
            structures: structures,
            pagination: pagination,
            user: req.session.user,
            search: search
        });
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memuat data struktur organisasi');
        res.redirect('/admin/dashboard');
    }
});

// Route: Form tambah struktur organisasi baru
router.get('/create', (req, res) => {
    res.render('pages/admin/organization-structure/form', {
        title: 'Tambah Struktur Organisasi Baru',
        user: req.session.user,
        structure: null,
        isEdit: false
    });
});

// Route: Proses tambah struktur organisasi
router.post('/', upload.single('image'), async (req, res) => {
    try {
        console.log('Received form data:', req.body);
        
        // Kirim data langsung ke API menggunakan FormData
        const formData = new FormData();
        
        // Tambahkan data dari form
        formData.append('title', req.body.title);
        formData.append('description', req.body.description);
        formData.append('position', req.body.position);
        formData.append('is_active', req.body.is_active === 'on' ? 'true' : 'false');
        
        // Tambahkan file gambar jika ada
        if (req.file) {
            const fileStream = fs.createReadStream(req.file.path);
            formData.append('image', fileStream, req.file.originalname);
        }

        // Kirim request ke API backend
        const response = await axios.post(`${API_BASE_URL}/organization/structure`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${global.token}`
            }
        });
        
        req.flash('success_msg', 'Struktur organisasi berhasil ditambahkan');
        res.redirect('/admin/organization-structure');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal menambahkan struktur organisasi');
        res.redirect('/admin/organization-structure/create');
    }
});

// Route: Detail struktur organisasi
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await organizationStructureAPI.getStructureById(id);
        
        // Akses struktur dari response
        const structure = response.structure || {};
        
        res.render('pages/admin/organization-structure/detail', {
            title: 'Detail Struktur Organisasi',
            structure: structure,
            user: req.session.user
        });
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memuat detail struktur organisasi');
        res.redirect('/admin/organization-structure');
    }
});

// Route: Form edit struktur organisasi
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await organizationStructureAPI.getStructureById(id);
        
        // Akses struktur dari response
        const structure = response.structure || {};
        
        res.render('pages/admin/organization-structure/form', {
            title: 'Edit Struktur Organisasi',
            structure: structure,
            user: req.session.user,
            isEdit: true
        });
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memuat data struktur organisasi');
        res.redirect('/admin/organization-structure');
    }
});

// Route: Proses update struktur organisasi
router.post('/:id', upload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Updating organization structure ID ${id}`);
        
        // Kirim data langsung ke API menggunakan FormData
        const formData = new FormData();
        
        // Tambahkan data dari form
        formData.append('title', req.body.title);
        formData.append('description', req.body.description);
        formData.append('position', req.body.position);
        formData.append('is_active', req.body.is_active === 'on' ? 'true' : 'false');
        
        // Tambahkan file gambar jika ada
        if (req.file) {
            const fileStream = fs.createReadStream(req.file.path);
            formData.append('image', fileStream, req.file.originalname);
        }

        // Kirim request ke API backend
        const response = await axios.put(`${API_BASE_URL}/organization/structure/${id}`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${global.token}`
            }
        });
        
        req.flash('success_msg', 'Data struktur organisasi berhasil diperbarui');
        res.redirect('/admin/organization-structure');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memperbarui struktur organisasi');
        res.redirect(`/admin/organization-structure/edit/${req.params.id}`);
    }
});

// Route: Toggle status aktif/tidak aktif
router.post('/toggle-status/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const isActive = req.body.is_active === '1';
        
        const formData = new FormData();
        formData.append('is_active', isActive ? 'true' : 'false');
        
        await axios.patch(`${API_BASE_URL}/organization/structure/${id}/status`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${global.token}`
            }
        });
        
        req.flash('success_msg', `Struktur organisasi berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
        res.redirect('/admin/organization-structure');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal mengubah status struktur organisasi');
        res.redirect('/admin/organization-structure');
    }
});

// Route: Proses hapus struktur organisasi
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await organizationStructureAPI.deleteStructure(id);
        
        req.flash('success_msg', 'Struktur organisasi berhasil dihapus');
        res.redirect('/admin/organization-structure');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal menghapus struktur organisasi');
        res.redirect('/admin/organization-structure');
    }
});

module.exports = router;