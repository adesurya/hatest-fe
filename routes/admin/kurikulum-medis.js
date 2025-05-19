// Corrección completa para routes/admin/kurikulum-medis.js

const express = require('express');
const router = express.Router();
const { kurikulumAPI } = require('../../services/api');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// API Base URL - debe coincidir con el de tu servicio API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Configuración para upload de archivos
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Guardamos temporalmente en public/uploads/kurikulum
        const uploadDir = path.join(__dirname, '../../public/uploads/kurikulum');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function(req, file, cb) {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Format file tidak diizinkan. Hanya PDF, DOC, dan DOCX yang diperbolehkan.'));
        }
    }
});

// Route: Daftar semua kurikulum medis
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        console.log('Fetching kurikulum medis with search:', search);
        
        const response = await kurikulumAPI.getAllKurikulum(page, limit, search);
        
        // Access data with correct structure
        const kurikulums = response.kurikulums || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || kurikulums.length
        };
        
        // Calculate total cost for statistics
        let totalBiaya = 0;
        if (kurikulums && kurikulums.length > 0) {
            kurikulums.forEach(kurikulum => {
                if (kurikulum.biaya_semester) {
                    const biaya = parseFloat(kurikulum.biaya_semester);
                    if (!isNaN(biaya)) {
                        totalBiaya += biaya;
                    }
                }
            });
        }
        
        res.render('pages/admin/kurikulum-medis/index', {
            title: 'Manajemen Kurikulum Medis',
            kurikulums: kurikulums,
            pagination: pagination,
            user: req.session.user,
            search: search,
            totalBiaya: totalBiaya,
            currentYear: new Date().getFullYear()
        });
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load kurikulum medis data');
        res.redirect('/admin/dashboard');
    }
});

// Route: Form tambah kurikulum medis
router.get('/create', (req, res) => {
    res.render('pages/admin/kurikulum-medis/form', {
        title: 'Tambah Kurikulum Medis Baru',
        user: req.session.user,
        kurikulum: null,
        isEdit: false,
        currentYear: new Date().getFullYear()
    });
});

// MÉTODO CORREGIDO: Crear Kurikulum usando FormData directamente con el API
router.post('/', upload.single('file_kurikulum'), async (req, res) => {
    try {
        console.log('Received form data:', req.body);
        console.log('Received file:', req.file);
        
        // Crear FormData para enviar directamente al API (igual que en CURL)
        const formData = new FormData();
        
        // Agregar todos los campos del form
        formData.append('nama_fakultas', req.body.nama_fakultas);
        formData.append('tahun_kurikulum', req.body.tahun_kurikulum);
        formData.append('deskripsi_kurikulum', req.body.deskripsi_kurikulum);
        formData.append('biaya_semester', req.body.biaya_semester.replace(/\./g, '').replace(/,/g, ''));
        
        if (req.body.catatan) {
            formData.append('catatan', req.body.catatan);
        }
        
        // Si hay archivo, adjuntarlo como archivo binario
        if (req.file) {
            const filePath = req.file.path;
            console.log('File path:', filePath);
            
            // Verificar que el archivo exista
            if (fs.existsSync(filePath)) {
                // Leer el archivo y adjuntarlo como archivo binario (igual que @file en CURL)
                const fileContent = fs.readFileSync(filePath);
                
                // Agregar el archivo con el mismo nombre de campo que en CURL
                formData.append('file_kurikulum', fileContent, {
                    filename: req.file.originalname,
                    contentType: req.file.mimetype
                });
                
                console.log('File added to form data');
            } else {
                console.error('File not found at path:', filePath);
            }
        }
        
        // Realizar la petición directa al API con el token
        const response = await axios.post(`${API_BASE_URL}/kurikulum`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${global.token}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        console.log('API response:', response.data);
        
        if (response.data && response.data.success) {
            req.flash('success_msg', 'Kurikulum medis berhasil ditambahkan');
            return res.redirect('/admin/kurikulum-medis');
        } else {
            req.flash('error_msg', response.data?.message || 'Failed to add kurikulum medis');
            return res.redirect('/admin/kurikulum-medis/create');
        }
    } catch (err) {
        console.error('Error creating kurikulum:', err);
        
        if (err.response) {
            console.error('Error response:', err.response.data);
        }
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to add kurikulum medis');
        return res.redirect('/admin/kurikulum-medis/create');
    }
});

// Route: Detail kurikulum medis
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await kurikulumAPI.getKurikulumById(id);
        
        // Access kurikulum from correct response structure
        const kurikulum = response.kurikulum || {};
        
        res.render('pages/admin/kurikulum-medis/detail', {
            title: 'Detail Kurikulum Medis',
            kurikulum: kurikulum,
            user: req.session.user,
            currentYear: new Date().getFullYear()
        });
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load kurikulum details');
        res.redirect('/admin/kurikulum-medis');
    }
});

// Route: Form edit kurikulum medis
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await kurikulumAPI.getKurikulumById(id);
        
        // Access kurikulum from correct response structure
        const kurikulum = response.kurikulum || {};
        
        res.render('pages/admin/kurikulum-medis/form', {
            title: 'Edit Kurikulum Medis',
            kurikulum: kurikulum,
            user: req.session.user,
            isEdit: true,
            currentYear: new Date().getFullYear()
        });
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load kurikulum data');
        res.redirect('/admin/kurikulum-medis');
    }
});

// MÉTODO CORREGIDO: Actualizar Kurikulum usando FormData y axios
router.post('/:id', upload.single('file_kurikulum'), async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Updating kurikulum medis ID ${id}`);
        console.log('Update form data:', req.body);
        console.log('Update file:', req.file);
        
        // Crear FormData para enviar directamente al API
        const formData = new FormData();
        
        // Agregar todos los campos del form
        formData.append('nama_fakultas', req.body.nama_fakultas);
        formData.append('tahun_kurikulum', req.body.tahun_kurikulum);
        formData.append('deskripsi_kurikulum', req.body.deskripsi_kurikulum);
        formData.append('biaya_semester', req.body.biaya_semester.replace(/\./g, '').replace(/,/g, ''));
        
        if (req.body.catatan) {
            formData.append('catatan', req.body.catatan);
        }
        
        // Si hay un nuevo archivo, adjuntarlo como archivo binario
        if (req.file) {
            const filePath = req.file.path;
            console.log('New file path:', filePath);
            
            // Verificar que el archivo exista
            if (fs.existsSync(filePath)) {
                // Leer el archivo y adjuntarlo como archivo binario
                const fileContent = fs.readFileSync(filePath);
                
                // Agregar el archivo con el mismo nombre de campo que en CURL
                formData.append('file_kurikulum', fileContent, {
                    filename: req.file.originalname,
                    contentType: req.file.mimetype
                });
                
                console.log('File added to form data for update');
            } else {
                console.error('File not found at path:', filePath);
            }
        }
        
        // Realizar la petición PUT directa al API con el token
        const response = await axios.put(`${API_BASE_URL}/kurikulum/${id}`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${global.token}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        console.log('Update API response:', response.data);
        
        if (response.data && response.data.success) {
            req.flash('success_msg', 'Data kurikulum medis berhasil diperbarui');
            return res.redirect('/admin/kurikulum-medis');
        } else {
            req.flash('error_msg', response.data?.message || 'Failed to update kurikulum medis');
            return res.redirect(`/admin/kurikulum-medis/edit/${id}`);
        }
    } catch (err) {
        console.error('Error updating kurikulum:', err);
        
        if (err.response) {
            console.error('Error response:', err.response.data);
        }
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to update kurikulum medis');
        return res.redirect(`/admin/kurikulum-medis/edit/${req.params.id}`);
    }
});

// Route: Proses hapus kurikulum medis
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await kurikulumAPI.deleteKurikulum(id);
        
        req.flash('success_msg', 'Kurikulum medis berhasil dihapus');
        res.redirect('/admin/kurikulum-medis');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete kurikulum medis');
        res.redirect('/admin/kurikulum-medis');
    }
});

module.exports = router;