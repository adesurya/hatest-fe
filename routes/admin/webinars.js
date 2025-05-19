// routes/admin/webinars.js
const express = require('express');
const router = express.Router();
const { webinarAPI } = require('../../services/api');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads/events');
        
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Separate folder for images and documents
        if (file.fieldname === 'image') {
            const imagesDir = path.join(uploadDir, 'images');
            if (!fs.existsSync(imagesDir)) {
                fs.mkdirSync(imagesDir, { recursive: true });
            }
            cb(null, imagesDir);
        } else {
            const documentsDir = path.join(uploadDir, 'documents');
            if (!fs.existsSync(documentsDir)) {
                fs.mkdirSync(documentsDir, { recursive: true });
            }
            cb(null, documentsDir);
        }
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, uniqueSuffix + extension);
    }
});

// Filter to validate file types
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'image') {
        // Allow image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    } else if (file.fieldname === 'supporting_document') {
        // Allow document files
        const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and Word documents are allowed!'), false);
        }
    } else {
        cb(null, true);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
});

// Route: Daftar semua webinar
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        console.log('Fetching webinars with search:', search);
        
        const response = await webinarAPI.getAllWebinars(page, limit, search);
        
        // Akses data dengan struktur yang benar
        const webinars = response.events || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || webinars.length
        };
        
        res.render('pages/admin/webinars/index', {
            title: 'Manajemen Webinar',
            webinars: webinars,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load webinar data');
        res.redirect('/admin/dashboard');
    }
});

// Route: Form tambah webinar baru
router.get('/create', (req, res) => {
    res.render('pages/admin/webinars/form', {
        title: 'Tambah Webinar Baru',
        user: req.session.user,
        webinar: null,
        isEdit: false
    });
});

// Route: Proses tambah webinar
router.post('/', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'supporting_document', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('Received form data:', req.body);
        
        // Create FormData for API call
        const formData = new FormData();
        
        // Add text fields
        Object.keys(req.body).forEach(key => {
            formData.append(key, req.body[key]);
        });
        
        // Add files if they exist
        if (req.files) {
            if (req.files.image && req.files.image.length > 0) {
                const imageFile = req.files.image[0];
                // Save file path relative to public folder for database
                const relativePath = '/uploads/events/images/' + imageFile.filename;
                formData.append('image', imageFile.buffer, {
                    filename: imageFile.originalname,
                    filepath: relativePath
                });
            }
            
            if (req.files.supporting_document && req.files.supporting_document.length > 0) {
                const docFile = req.files.supporting_document[0];
                // Save file path relative to public folder for database
                const relativePath = '/uploads/events/documents/' + docFile.filename;
                formData.append('supporting_document', docFile.buffer, {
                    filename: docFile.originalname,
                    filepath: relativePath
                });
            }
        }
        
        const response = await webinarAPI.createWebinar(formData);
        
        req.flash('success_msg', 'Webinar berhasil ditambahkan');
        res.redirect('/admin/webinars');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to add webinar');
        res.redirect('/admin/webinars/create');
    }
});

// Route: Detail webinar
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await webinarAPI.getWebinarById(id);
        
        // Akses webinar dari struktur response yang benar
        const webinar = response.event || {};
        
        res.render('pages/admin/webinars/detail', {
            title: 'Detail Webinar',
            webinar: webinar,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load webinar details');
        res.redirect('/admin/webinars');
    }
});

// Route: Form edit webinar
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await webinarAPI.getWebinarById(id);
        
        // Akses webinar dari struktur response yang benar
        const webinar = response.event || {};
        
        res.render('pages/admin/webinars/form', {
            title: 'Edit Webinar',
            webinar: webinar,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load webinar data');
        res.redirect('/admin/webinars');
    }
});

// Route: Proses update webinar
router.post('/:id', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'supporting_document', maxCount: 1 }
]), async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Updating webinar ID ${id}`);
        
        // Create FormData for API call
        const formData = new FormData();
        
        // Add text fields
        Object.keys(req.body).forEach(key => {
            formData.append(key, req.body[key]);
        });
        
        // Add files if they exist
        if (req.files) {
            if (req.files.image && req.files.image.length > 0) {
                const imageFile = req.files.image[0];
                // Save file path relative to public folder for database
                const relativePath = '/uploads/events/images/' + imageFile.filename;
                formData.append('image', imageFile.buffer, {
                    filename: imageFile.originalname,
                    filepath: relativePath
                });
            }
            
            if (req.files.supporting_document && req.files.supporting_document.length > 0) {
                const docFile = req.files.supporting_document[0];
                // Save file path relative to public folder for database
                const relativePath = '/uploads/events/documents/' + docFile.filename;
                formData.append('supporting_document', docFile.buffer, {
                    filename: docFile.originalname,
                    filepath: relativePath
                });
            }
        }
        
        await webinarAPI.updateWebinar(id, formData);
        
        req.flash('success_msg', 'Data webinar berhasil diperbarui');
        res.redirect('/admin/webinars');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to update webinar');
        res.redirect(`/admin/webinars/edit/${req.params.id}`);
    }
});

// Route: Proses hapus webinar
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await webinarAPI.deleteWebinar(id);
        
        req.flash('success_msg', 'Webinar berhasil dihapus');
        res.redirect('/admin/webinars');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete webinar');
        res.redirect('/admin/webinars');
    }
});

// Route: Daftar peserta webinar
router.get('/:id/registrations', async (req, res) => {
    try {
        const id = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const [webinarResponse, registrationsResponse] = await Promise.all([
            webinarAPI.getWebinarById(id),
            webinarAPI.getWebinarRegistrations(id, page, limit)
        ]);
        
        const webinar = webinarResponse.event || {};
        const registrations = registrationsResponse.registrations || [];
        const pagination = registrationsResponse.pagination || {
            total: registrations.length,
            totalPages: 1,
            currentPage: 1,
            limit: limit
        };
        
        res.render('pages/admin/webinars/registrations', {
            title: 'Peserta Webinar',
            webinar: webinar,
            registrations: registrations,
            pagination: pagination,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load registrations data');
        res.redirect('/admin/webinars');
    }
});

// Route: Leaderboard poin
router.get('/points/leaderboard', async (req, res) => {
    try {
        const response = await webinarAPI.getPointsLeaderboard();
        
        res.render('pages/admin/webinars/leaderboard', {
            title: 'Leaderboard Poin Webinar',
            leaderboard: response.leaderboard || [],
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load leaderboard data');
        res.redirect('/admin/webinars');
    }
});

// Route: Detail poin pengguna
router.get('/points/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const response = await webinarAPI.getUserPoints(userId);
        
        res.render('pages/admin/webinars/user-points', {
            title: 'Detail Poin Pengguna',
            userId: userId,
            totalPoints: response.total_points || 0,
            lastEarnedDate: response.last_earned_date,
            pointsRecords: response.points_records || [],
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load user points data');
        res.redirect('/admin/webinars/points/leaderboard');
    }
});

// Route: Tambah poin bonus
router.post('/points/add', async (req, res) => {
    try {
        const { user_id, event_id, points, notes } = req.body;
        
        await webinarAPI.addBonusPoints({
            user_id: parseInt(user_id),
            event_id: parseInt(event_id),
            points: parseInt(points),
            notes: notes
        });
        
        req.flash('success_msg', 'Poin bonus berhasil ditambahkan');
        res.redirect(`/admin/webinars/points/user/${user_id}`);
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to add bonus points');
        res.redirect(`/admin/webinars/points/user/${req.body.user_id}`);
    }
});

// Route: Hapus poin
router.post('/points/delete/:pointId', async (req, res) => {
    try {
        const pointId = req.params.pointId;
        const userId = req.body.user_id;
        
        await webinarAPI.deletePointsRecord(pointId);
        
        req.flash('success_msg', 'Catatan poin berhasil dihapus');
        res.redirect(`/admin/webinars/points/user/${userId}`);
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete points record');
        res.redirect(`/admin/webinars/points/user/${req.body.user_id}`);
    }
});

module.exports = router;