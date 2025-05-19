// routes/admin/exams.js
const express = require('express');
const router = express.Router();
const { examsAPI, examCategoriesAPI } = require('../../services/api');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/exams');
        // Buat direktori jika belum ada
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Buat nama file unik dengan timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'exam-doc-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Batas 5MB
    fileFilter: function (req, file, cb) {
        // Hanya terima file PDF dan dokumen office
        const allowedFileTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedFileTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Tipe file tidak didukung. Hanya PDF dan dokumen office yang diizinkan.'));
        }
    }
});

// Admin middleware dan token check diwariskan dari router induk

// Daftar semua ujian
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const category = req.query.category || '';
        
        // Ambil data kategori untuk filter
        const categoriesResponse = await examCategoriesAPI.getAllCategories();
        const categories = categoriesResponse.categories || [];
        
        // Ambil data ujian
        const examsResponse = await examsAPI.getAllExams(page, limit, search, category);
        const exams = examsResponse.exams || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: examsResponse.pagination?.totalPages || 1,
            totalItems: examsResponse.pagination?.total || exams.length
        };
        
        res.render('pages/admin/exams/index', {
            title: 'Manajemen Ujian',
            exams: exams,
            categories: categories,
            pagination: pagination,
            user: req.session.user,
            search: search,
            selectedCategory: category
        });
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memuat data ujian');
        res.redirect('/admin/dashboard');
    }
});

// Form tambah ujian baru
router.get('/create', async (req, res) => {
    try {
        // Ambil data kategori untuk dropdown
        const categoriesResponse = await examCategoriesAPI.getAllCategories();
        const categories = categoriesResponse.categories || [];
        
        res.render('pages/admin/exams/form', {
            title: 'Tambah Ujian Baru',
            user: req.session.user,
            exam: null,
            categories: categories,
            isEdit: false
        });
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memuat form ujian');
        res.redirect('/admin/exams');
    }
});

// Detail ujian
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const examResponse = await examsAPI.getExamById(id);
        
        // Akses data ujian dari respons API
        const exam = examResponse.exam || {};
        
        res.render('pages/admin/exams/detail', {
            title: 'Detail Ujian',
            exam: exam,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memuat detail ujian');
        res.redirect('/admin/exams');
    }
});

// Form edit ujian
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Ambil data kategori untuk dropdown
        const categoriesResponse = await examCategoriesAPI.getAllCategories();
        const categories = categoriesResponse.categories || [];
        
        // Ambil data ujian untuk diisi ke form
        const examResponse = await examsAPI.getExamById(id);
        const exam = examResponse.exam || {};
        
        res.render('pages/admin/exams/form', {
            title: 'Edit Ujian',
            user: req.session.user,
            exam: exam,
            categories: categories,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memuat form edit ujian');
        res.redirect('/admin/exams');
    }
});

// Proses tambah ujian
router.post('/', upload.single('supporting_document'), async (req, res) => {
    try {
        const formData = new FormData();
        
        // Tambahkan semua field dari form
        Object.keys(req.body).forEach(key => {
            formData.append(key, req.body[key]);
        });
        
        // Tambahkan file dokumen pendukung jika ada
        if (req.file) {
            const fileStream = fs.createReadStream(req.file.path);
            formData.append('supporting_document', fileStream, req.file.filename);
        }
        
        // Kirim data ke API
        const response = await examsAPI.createExam(formData);
        
        req.flash('success_msg', 'Ujian berhasil ditambahkan');
        res.redirect('/admin/exams');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        // Hapus file upload jika ada error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal menambahkan ujian');
        res.redirect('/admin/exams/create');
    }
});

// Proses update ujian
router.post('/:id', upload.single('supporting_document'), async (req, res) => {
    try {
        const id = req.params.id;
        
        if (req.file) {
            // Jika ada file baru, gunakan FormData
            const formData = new FormData();
            
            // Tambahkan semua field dari form
            Object.keys(req.body).forEach(key => {
                formData.append(key, req.body[key]);
            });
            
            // Tambahkan file dokumen pendukung
            const fileStream = fs.createReadStream(req.file.path);
            formData.append('supporting_document', fileStream, req.file.filename);
            
            // Update dengan file baru
            await examsAPI.updateExam(id, formData);
        } else {
            // Jika tidak ada file baru, gunakan JSON biasa
            const examData = {
                ...req.body
            };
            
            // Update tanpa file baru
            await examsAPI.updateExamWithoutDocument(id, examData);
        }
        
        req.flash('success_msg', 'Data ujian berhasil diperbarui');
        res.redirect('/admin/exams');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        // Hapus file upload jika ada error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memperbarui ujian');
        res.redirect(`/admin/exams/edit/${req.params.id}`);
    }
});

// Proses hapus ujian
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await examsAPI.deleteExam(id);
        
        req.flash('success_msg', 'Ujian berhasil dihapus');
        res.redirect('/admin/exams');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal menghapus ujian');
        res.redirect('/admin/exams');
    }
});

module.exports = router;