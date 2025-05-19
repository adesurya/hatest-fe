// routes/admin/contacts.js
const express = require('express');
const router = express.Router();
const { contactsAPI } = require('../../services/api');

// Route: Daftar semua kontak
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        console.log('Fetching contacts with search:', search);
        
        const response = await contactsAPI.getAllContacts(page, limit, search);
        
        // Akses data dengan struktur yang benar
        const contacts = response.contacts || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || contacts.length
        };
        
        res.render('pages/admin/contacts/index', {
            title: 'Manajemen Kontak',
            contacts: contacts,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memuat data kontak');
        res.redirect('/admin/dashboard');
    }
});

// Route: Form tambah kontak baru
router.get('/create', (req, res) => {
    res.render('pages/admin/contacts/form', {
        title: 'Tambah Kontak Baru',
        user: req.session.user,
        contact: null,
        isEdit: false
    });
});

// Route: Proses tambah kontak
router.post('/', async (req, res) => {
    try {
        console.log('Received form data:', req.body);
        
        const contactData = {
            title: req.body.title,
            address: req.body.address,
            phone: req.body.phone,
            email: req.body.email,
            website: req.body.website,
            open_hours: req.body.open_hours
        };
        
        const response = await contactsAPI.createContact(contactData);
        
        req.flash('success_msg', 'Kontak berhasil ditambahkan');
        res.redirect('/admin/contacts');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal menambahkan kontak');
        res.redirect('/admin/contacts/create');
    }
});

// Route: Detail kontak
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await contactsAPI.getContactById(id);
        
        // Akses kontak dari struktur response yang benar
        const contact = response.contact || {};
        
        res.render('pages/admin/contacts/detail', {
            title: 'Detail Kontak',
            contact: contact,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memuat detail kontak');
        res.redirect('/admin/contacts');
    }
});

// Route: Form edit kontak
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await contactsAPI.getContactById(id);
        
        // Akses kontak dari struktur response yang benar
        const contact = response.contact || {};
        
        res.render('pages/admin/contacts/form', {
            title: 'Edit Kontak',
            contact: contact,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memuat data kontak');
        res.redirect('/admin/contacts');
    }
});

// Route: Proses update kontak
router.post('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Updating contact ID ${id}`);
        
        const contactData = {
            title: req.body.title,
            address: req.body.address,
            phone: req.body.phone,
            email: req.body.email,
            website: req.body.website,
            open_hours: req.body.open_hours
        };
        
        await contactsAPI.updateContact(id, contactData);
        
        req.flash('success_msg', 'Data kontak berhasil diperbarui');
        res.redirect('/admin/contacts');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal memperbarui kontak');
        res.redirect(`/admin/contacts/edit/${req.params.id}`);
    }
});

// Route: Proses hapus kontak
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await contactsAPI.deleteContact(id);
        
        req.flash('success_msg', 'Kontak berhasil dihapus');
        res.redirect('/admin/contacts');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Gagal menghapus kontak');
        res.redirect('/admin/contacts');
    }
});

module.exports = router;