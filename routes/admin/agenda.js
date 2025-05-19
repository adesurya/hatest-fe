// routes/admin/agenda.js - Perbaikan kode
const express = require('express');
const router = express.Router();
const { agendaAPI } = require('../../services/api');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/agenda');
        // Buat direktori jika belum ada
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, uniqueSuffix + extension);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Batasi ukuran file hingga 5MB
    fileFilter: function (req, file, cb) {
        // Hanya izinkan gambar
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar yang diizinkan!'), false);
        }
    }
});

// Route: Daftar semua kegiatan
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        console.log('Fetching agendas with search:', search);
        
        const response = await agendaAPI.getAllAgenda(page, limit, search);
        
        // Akses data dengan struktur yang benar
        const agendas = response.agendas || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || agendas.length
        };
        
        res.render('pages/admin/agenda/index', {
            title: 'Manajemen Kegiatan',
            agendas: agendas,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load agenda data');
        res.redirect('/admin/dashboard');
    }
});

// Route: Form tambah kegiatan baru
router.get('/create', (req, res) => {
    res.render('pages/admin/agenda/form', {
        title: 'Tambah Kegiatan Baru',
        user: req.session.user,
        agenda: null,
        isEdit: false
    });
});

// Route: Proses tambah kegiatan 
// PERBAIKAN: Tidak lagi membuat FormData di server, langsung kirim multipart form data dari multer
router.post('/', upload.single('image'), async (req, res) => {
    try {
        console.log('Received form data:', req.body);
        
        // Persiapkan data
        const formData = new FormData();
        
        // Konversi nilai is_published menjadi Boolean atau angka sesuai kebutuhan API
        const isPublished = req.body.is_published === 'true' ? 1 : 0;
        
        // Data untuk dikirim ke API
        const agendaData = {
            title: req.body.title,
            location: req.body.location,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            description: req.body.description,
            is_published: "true"
        };
        
        // Jika ada file gambar yang diupload
        if (req.file) {
            // Tambahkan path gambar untuk API
            // Pastikan path sesuai dengan ekspektasi API
            const imagePath = `/uploads/agenda/${req.file.filename}`;
            
            // Buat form data sebenarnya dengan file
            const actualFormData = new FormData();
            Object.keys(agendaData).forEach(key => {
                actualFormData.append(key, agendaData[key]);
            });
            
            // Append file ke form data
            const fileStream = fs.createReadStream(req.file.path);
            actualFormData.append('image', fileStream);
            
            // Kirim request dengan file
            const response = await agendaAPI.createAgenda(actualFormData);
            
            req.flash('success_msg', 'Kegiatan berhasil ditambahkan');
            return res.redirect('/admin/agenda');
        } else {
            // Jika tidak ada gambar, kirim data tanpa file
            const response = await agendaAPI.createAgendaWithoutImage(agendaData);
            
            req.flash('success_msg', 'Kegiatan berhasil ditambahkan');
            return res.redirect('/admin/agenda');
        }
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to add agenda');
        res.redirect('/admin/agenda/create');
    }
});

// Route: Detail kegiatan
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await agendaAPI.getAgendaById(id);
        
        // Akses agenda dari struktur response yang benar
        const agenda = response.agenda || {};
        
        res.render('pages/admin/agenda/detail', {
            title: 'Detail Kegiatan',
            agenda: agenda,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load agenda details');
        res.redirect('/admin/agenda');
    }
});

// Route: Form edit kegiatan
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await agendaAPI.getAgendaById(id);
        
        // Akses agenda dari struktur response yang benar
        const agenda = response.agenda || {};
        
        res.render('pages/admin/agenda/form', {
            title: 'Edit Kegiatan',
            agenda: agenda,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load agenda data');
        res.redirect('/admin/agenda');
    }
});

// Route: Proses update kegiatan
// PERBAIKAN: Tidak lagi membuat FormData di server, langsung kirim multipart form data dari multer
router.post('/:id', upload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Updating agenda ID ${id}`);
        
        // Konversi nilai is_published menjadi Boolean atau angka sesuai kebutuhan API
        const isPublished = req.body.is_published === 'true' ? 1 : 0;
        
        // Data untuk dikirim ke API
        const agendaData = {
            title: req.body.title,
            location: req.body.location,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            description: req.body.description,
            is_published: "true"
        };
        
        // Jika ada file gambar yang diupload
        if (req.file) {
            // Tambahkan path gambar untuk API
            // Pastikan path sesuai dengan ekspektasi API
            const imagePath = `/uploads/agenda/${req.file.filename}`;
            
            // Buat form data sebenarnya dengan file
            const actualFormData = new FormData();
            Object.keys(agendaData).forEach(key => {
                actualFormData.append(key, agendaData[key]);
            });
            
            // Append file ke form data
            const fileStream = fs.createReadStream(req.file.path);
            actualFormData.append('image', fileStream);
            
            // Kirim request dengan file
            const response = await agendaAPI.updateAgenda(id, actualFormData);
        } else {
            // Jika tidak ada gambar, kirim data tanpa file
            const response = await agendaAPI.updateAgendaWithoutImage(id, agendaData);
        }
        
        req.flash('success_msg', 'Data kegiatan berhasil diperbarui');
        res.redirect('/admin/agenda');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to update agenda');
        res.redirect(`/admin/agenda/edit/${req.params.id}`);
    }
});

// Route: Proses hapus kegiatan
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await agendaAPI.deleteAgenda(id);
        
        req.flash('success_msg', 'Kegiatan berhasil dihapus');
        res.redirect('/admin/agenda');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete agenda');
        res.redirect('/admin/agenda');
    }
});

module.exports = router;