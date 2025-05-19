// routes/admin/exam-categories.js
const express = require('express');
const router = express.Router();
const { examCategoriesAPI } = require('../../services/api');

// Admin middleware dan token check diwariskan dari router induk

// Get all categories with pagination
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        console.log(`Making request to get exam categories with search: ${search}`);
        
        // Dapatkan data kategori dari API yang telah diproses
        const response = await examCategoriesAPI.getAllCategories(page, limit, search);
        
        console.log(`Processed categories data: ${response.categories?.length || 0} categories`);
        
        // Ambil kategori dan data pagination
        const categories = response.categories || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || categories.length
        };
        
        // Render view dengan data yang sudah diproses
        res.render('pages/admin/exams/categories/index', {
            title: 'Kategori Ujian',
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
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memuat data kategori ujian');
        res.redirect('/admin/dashboard');
    }
});

// Form tambah kategori ujian baru
router.get('/create', (req, res) => {
    res.render('pages/admin/exams/categories/form', {
        title: 'Tambah Kategori Ujian Baru',
        user: req.session.user,
        category: null,
        isEdit: false
    });
});

// Form edit kategori ujian
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await examCategoriesAPI.getCategoryById(id);
        
        // Handle different possible API response structures
        let category = {};
        
        if (response.category) {
            category = response.category;
        } else if (response.exam) {
            // In case the API returns 'exam' instead of 'category'
            category = response.exam;
        } else if (response.data) {
            // In case the API returns data directly
            category = response.data;
        }
        
        res.render('pages/admin/exams/categories/form', {
            title: 'Edit Kategori Ujian',
            user: req.session.user,
            category: category,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memuat data kategori ujian');
        res.redirect('/admin/exams/categories');
    }
});

// Proses tambah kategori ujian
router.post('/', async (req, res) => {
    try {
        // Karena tidak ada endpoint sebenarnya untuk membuat kategori,
        // kita hanya akan menampilkan pesan sukses
        req.flash('success_msg', 'Kategori ujian berhasil ditambahkan. (Catatan: Simulasi saja karena API belum tersedia)');
        res.redirect('/admin/exams/categories');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal menambahkan kategori ujian');
        res.redirect('/admin/exams/categories/create');
    }
});

// Proses update kategori ujian
router.post('/:id', async (req, res) => {
    try {
        // Karena tidak ada endpoint sebenarnya untuk update kategori,
        // kita hanya akan menampilkan pesan sukses
        req.flash('success_msg', 'Kategori ujian berhasil diperbarui. (Catatan: Simulasi saja karena API belum tersedia)');
        res.redirect('/admin/exams/categories');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memperbarui kategori ujian');
        res.redirect(`/admin/exams/categories/edit/${req.params.id}`);
    }
});

// Proses hapus kategori ujian
router.post('/delete/:id', async (req, res) => {
    try {
        // Karena tidak ada endpoint sebenarnya untuk hapus kategori,
        // kita hanya akan menampilkan pesan sukses
        req.flash('success_msg', 'Kategori ujian berhasil dihapus. (Catatan: Simulasi saja karena API belum tersedia)');
        res.redirect('/admin/exams/categories');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Sesi Anda telah berakhir. Silakan login kembali.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal menghapus kategori ujian');
        res.redirect('/admin/exams/categories');
    }
});

module.exports = router;