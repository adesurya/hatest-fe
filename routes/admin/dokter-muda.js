// routes/admin/dokter-muda.js
const express = require('express');
const router = express.Router();
const { dokterMudaAPI } = require('../../services/api');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Environment variables
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

// Validasi NIK dan koordinat
function validateNIK(nik) {
    const nikString = String(nik);
    if (!/^\d+$/.test(nikString)) {
        return false;
    }
    return nikString.length === 16;
}

function formatCoordinate(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
        return null;
    }
    return num.toFixed(6);
}


// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath;
        
        // Sesuaikan dengan path yang digunakan backend
        if (file.fieldname === 'foto_profil') {
            uploadPath = 'public/uploads/profiles/';
        } else if (file.fieldname === 'dokumen_pendukung') {
            uploadPath = 'public/uploads/documents/';
        } else {
            uploadPath = 'public/uploads/';
        }
        
        // Buat direktori jika belum ada
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Gunakan format penamaan yang sama dengan backend
        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        
        // Format nama file sesuai dengan backend
        let fileName;
        if (file.fieldname === 'foto_profil') {
            fileName = `profile_${timestamp}-${randomSuffix}${fileExt}`;
        } else if (file.fieldname === 'dokumen_pendukung') {
            fileName = `document_${timestamp}-${randomSuffix}${fileExt}`;
        } else {
            fileName = `file_${timestamp}-${randomSuffix}${fileExt}`;
        }
        
        cb(null, fileName);
    }
});

// Fungsi ini digunakan baik di endpoint POST maupun PUT
async function handleFileUpload(formData, req) {
    // Tambahkan file jika ada
    if (req.files) {
        // Foto profil
        if (req.files.foto_profil && req.files.foto_profil[0]) {
            const photoFile = req.files.foto_profil[0];
            const photoPath = photoFile.path;
            const photoFileName = path.basename(photoPath);
            
            // Generate URL publik sesuai dengan format backend
            const publicPhotoUrl = generatePublicFileUrl('foto_profil', photoFileName);
            
            console.log('File foto profil disimpan di:', photoPath);
            console.log('Nama file foto profil:', photoFileName);
            console.log('URL publik foto profil:', publicPhotoUrl);
            
            // Stream file untuk upload
            const photoStream = fs.createReadStream(photoPath);
            formData.append('foto_profil', photoStream, {
                filename: photoFile.originalname,
                contentType: photoFile.mimetype,
                knownLength: photoFile.size
            });
            
            // PENTING: Kirim URL publik lengkap yang sama dengan format backend
            formData.append('foto_profil_path', String(publicPhotoUrl));
        }
        
        // Dokumen pendukung
        if (req.files.dokumen_pendukung && req.files.dokumen_pendukung[0]) {
            const docFile = req.files.dokumen_pendukung[0];
            const docPath = docFile.path;
            const docFileName = path.basename(docPath);
            
            // Generate URL publik sesuai dengan format backend
            const publicDocUrl = generatePublicFileUrl('dokumen_pendukung', docFileName);
            
            console.log('File dokumen disimpan di:', docPath);
            console.log('Nama file dokumen:', docFileName);
            console.log('URL publik dokumen:', publicDocUrl);
            
            // Stream file untuk upload
            const docStream = fs.createReadStream(docPath);
            formData.append('dokumen_pendukung', docStream, {
                filename: docFile.originalname,
                contentType: docFile.mimetype,
                knownLength: docFile.size
            });
            
            // PENTING: Kirim URL publik lengkap yang sama dengan format backend
            formData.append('dokumen_pendukung_path', String(publicDocUrl));
        }
    }
    return formData;
}
// Validasi file
const fileFilter = function (req, file, cb) {
    if (file.fieldname === 'foto_profil') {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Hanya file gambar yang diizinkan untuk foto profil!'), false);
        }
    } else if (file.fieldname === 'dokumen_pendukung') {
        if (!file.originalname.match(/\.(pdf|doc|docx)$/i)) {
            return cb(new Error('Hanya file PDF dan Word yang diizinkan untuk dokumen pendukung!'), false);
        }
    }
    cb(null, true);
};

// Konfigurasi multer
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});


/**
 * Fungsi untuk menghasilkan URL publik yang konsisten dengan backend
 * @param {string} fileType - Jenis file (foto_profil atau dokumen_pendukung)
 * @param {string} fileName - Nama file yang disimpan
 * @returns {string} - URL publik untuk akses file
 */
function generatePublicFileUrl(fileType, fileName) {
    // Sesuaikan dengan path yang digunakan backend
    if (fileType === 'foto_profil') {
        return `/uploads/profiles/${fileName}`;
    } else if (fileType === 'dokumen_pendukung') {
        return `/uploads/documents/${fileName}`;
    }
    
    // Default fallback
    return `/uploads/${fileName}`;
}

/**
 * Fungsi untuk mengadaptasi path file dari backend agar bisa ditampilkan dengan benar
 * @param {string} backendPath - Path file seperti yang disimpan di database backend
 * @returns {string} - Path yang sudah disesuaikan untuk akses di frontend
 */
function adaptFilePath(backendPath) {
    // Jika tidak ada path, kembalikan default
    if (!backendPath) return '';
    
    // Dapatkan nama file dari path
    const fileName = backendPath.split('/').pop();
    
    // Cek apakah ini foto profil atau dokumen pendukung
    if (fileName.startsWith('foto_profil-') || fileName.includes('profil')) {
        return `/uploads/dokter-muda/profiles/${fileName}`;
    } else if (fileName.startsWith('dokumen_pendukung-') || fileName.includes('dokumen') || fileName.includes('document')) {
        return `/uploads/dokter-muda/documents/${fileName}`;
    }
    
    // Jika path sudah lengkap (dimulai dengan '/'), gunakan apa adanya
    if (backendPath.startsWith('/')) {
        return backendPath;
    }
    
    // Default: coba cari di folder uploads
    return `/uploads/${fileName}`;
}


// Route: Daftar semua dokter muda
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const filter = req.query.filter || '';
        
        console.log('Fetching dokter muda with filter:', filter);
        
        const response = await dokterMudaAPI.getAllDokterMuda(page, limit, search, filter);
        
        // Akses data dengan struktur yang benar
        const dokterMuda = response.profiles || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || dokterMuda.length
        };
        
        res.render('pages/admin/dokter-muda/index', {
            title: 'Manajemen Dokter Muda',
            dokterMuda: dokterMuda,
            pagination: pagination,
            user: req.session.user,
            search: search,
            filter: filter
        });
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load dokter muda data');
        res.redirect('/admin/dashboard');
    }
});

// Route: Form tambah dokter muda baru
router.get('/create', (req, res) => {
    res.render('pages/admin/dokter-muda/form', {
        title: 'Tambah Dokter Muda Baru',
        user: req.session.user,
        dokterMuda: null,
        isEdit: false
    });
});

// Route: Proses tambah dokter muda
router.post('/', (req, res) => {
    upload.fields([
        { name: 'foto_profil', maxCount: 1 },
        { name: 'dokumen_pendukung', maxCount: 1 }
    ])(req, res, async function(err) {
        if (err) {
            console.error('Upload error:', err);
            req.flash('error_msg', `File upload error: ${err.message}`);
            return res.redirect('/admin/dokter-muda/create');
        }
        
        try {
            console.log('Received form data:', req.body);
            
            // Validasi NIK
            if (req.body.nomor_nik && !validateNIK(req.body.nomor_nik)) {
                req.flash('error_msg', 'NIK harus terdiri dari 16 digit angka');
                return res.redirect('/admin/dokter-muda/create');
            }
            
            // Buat FormData untuk request ke API
            const formData = new FormData();
            
            // Tambahkan semua field form ke FormData
            for (const key in req.body) {
                if (req.body[key] === '') continue;
                
                // Penanganan khusus untuk field tertentu
                if (key === 'remove_profile') {
                    formData.append(key, req.body[key] === '1' ? '1' : '0');
                } 
                else if (['koordinat_latitude', 'koordinat_longitude'].includes(key)) {
                    const formattedValue = formatCoordinate(req.body[key]);
                    if (formattedValue !== null) {
                        formData.append(key, String(formattedValue));
                    }
                } 
                else if (key === 'tahun_lulus') {
                    const yearValue = parseInt(req.body[key]);
                    if (!isNaN(yearValue)) {
                        formData.append(key, String(yearValue));
                    }
                }
                else {
                    formData.append(key, String(req.body[key]));
                }
            }
            
            // Proses upload file jika ada
            if (req.files) {
                // Foto profil
                if (req.files.foto_profil && req.files.foto_profil[0]) {
                    const photoFile = req.files.foto_profil[0];
                    console.log('Adding profile photo:', photoFile.path);
                    
                    // Gunakan fs.createReadStream untuk file upload
                    const photoStream = fs.createReadStream(photoFile.path);
                    formData.append('foto_profil', photoStream, {
                        filename: photoFile.originalname,
                        contentType: photoFile.mimetype
                    });
                    
                    // Generate dan kirim path untuk foto profil
                    const photoFileName = path.basename(photoFile.path);
                    const publicPhotoUrl = `/uploads/profiles/${photoFileName}`;
                    formData.append('foto_profil_path', publicPhotoUrl);
                }
                
                // Dokumen pendukung
                if (req.files.dokumen_pendukung && req.files.dokumen_pendukung[0]) {
                    const docFile = req.files.dokumen_pendukung[0];
                    console.log('Adding document:', docFile.path);
                    
                    // Gunakan fs.createReadStream untuk file upload
                    const docStream = fs.createReadStream(docFile.path);
                    formData.append('dokumen_pendukung', docStream, {
                        filename: docFile.originalname,
                        contentType: docFile.mimetype
                    });
                    
                    // Generate dan kirim path untuk dokumen
                    const docFileName = path.basename(docFile.path);
                    const publicDocUrl = `/uploads/documents/${docFileName}`;
                    formData.append('dokumen_pendukung_path', publicDocUrl);
                }
            }
            
            console.log('Sending form to API with headers:', {
                ...formData.getHeaders(),
                'Authorization': 'Bearer [TOKEN]' // token disembunyikan untuk keamanan
            });
            
            // Kirim request ke API dengan FormData
            const response = await axios.post(`${API_BASE_URL}/dokter-muda`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${global.token}`
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 60000
            });
            
            console.log('API response:', response.data);
            
            req.flash('success_msg', 'Dokter muda berhasil ditambahkan');
            res.redirect('/admin/dokter-muda');
            
        } catch (err) {
            console.error('API Error:', err.message);
            
            if (err.response) {
                console.error('Error Status:', err.response.status);
                console.error('Error Data:', JSON.stringify(err.response.data, null, 2));
                
                // Check if token is expired
                if (err.response.status === 401) {
                    req.session.destroy();
                    global.token = null;
                    req.flash('error_msg', 'Your session has expired. Please log in again.');
                    return res.redirect('/auth/login');
                }
                
                // Tampilkan pesan error spesifik dari API jika ada
                if (err.response.data && err.response.data.message) {
                    req.flash('error_msg', err.response.data.message);
                } else {
                    req.flash('error_msg', 'Failed to add dokter muda. Please try again.');
                }
            } else {
                req.flash('error_msg', 'Connection error. Please try again later.');
            }
            
            res.redirect('/admin/dokter-muda/create');
        }
    });
});

// Route: Detail dokter muda
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await dokterMudaAPI.getDokterMudaById(id);
        
        // Akses dokter muda dari struktur response yang benar
        const dokterMuda = response.profile || {};
        
        res.render('pages/admin/dokter-muda/detail', {
            title: 'Detail Dokter Muda',
            dokterMuda: dokterMuda,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load dokter muda details');
        res.redirect('/admin/dokter-muda');
    }
});

// Route: Form edit dokter muda
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await dokterMudaAPI.getDokterMudaById(id);
        
        // Akses dokter muda dari struktur response yang benar
        const dokterMuda = response.profile || {};
        
        res.render('pages/admin/dokter-muda/form', {
            title: 'Edit Dokter Muda',
            dokterMuda: dokterMuda,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load dokter muda data');
        res.redirect('/admin/dokter-muda');
    }
});

// Route: Proses update dokter muda
router.post('/:id', (req, res) => {
    upload.fields([
        { name: 'foto_profil', maxCount: 1 },
        { name: 'dokumen_pendukung', maxCount: 1 }
    ])(req, res, async function(err) {
        if (err) {
            console.error('Upload error:', err);
            req.flash('error_msg', `File upload error: ${err.message}`);
            return res.redirect(`/admin/dokter-muda/edit/${req.params.id}`);
        }
        
        try {
            const id = req.params.id;
            console.log(`Updating dokter muda ID ${id}`);
            
            // Validasi NIK
            if (req.body.nomor_nik && !validateNIK(req.body.nomor_nik)) {
                req.flash('error_msg', 'NIK harus terdiri dari 16 digit angka');
                return res.redirect(`/admin/dokter-muda/edit/${id}`);
            }
            
            // Buat FormData
            const formData = new FormData();
            
            // Tambahkan semua field teks (sama seperti POST)
            for (const key in req.body) {
                // (kode sama dengan bagian POST)
                if (req.body[key] === '') continue;
                
                if (key === 'remove_profile') {
                    formData.append(key, req.body[key] === '1' ? '1' : '0');
                } 
                else if (['koordinat_latitude', 'koordinat_longitude'].includes(key)) {
                    const formattedValue = formatCoordinate(req.body[key]);
                    if (formattedValue !== null) {
                        formData.append(key, String(formattedValue));
                    }
                } 
                else if (key === 'tahun_lulus') {
                    const yearValue = parseInt(req.body[key]);
                    if (!isNaN(yearValue)) {
                        formData.append(key, String(yearValue));
                    }
                }
                else {
                    formData.append(key, String(req.body[key]));
                }
            }
            
            // Tambahkan file jika ada (sama seperti POST)
            if (req.files) {
                // Foto profil (sama seperti POST)
                if (req.files.foto_profil && req.files.foto_profil[0]) {
                    const photoFile = req.files.foto_profil[0];
                    const photoPath = photoFile.path;
                    const photoFileName = path.basename(photoPath);
                    
                    // Generate URL standar untuk file
                    const publicPhotoUrl = generatePublicFileUrl('foto_profil', photoFileName);
                    
                    console.log('Foto profil disimpan di:', photoPath);
                    console.log('Nama file foto profil:', photoFileName);
                    console.log('URL publik foto profil:', publicPhotoUrl);
                    
                    // Stream file untuk upload
                    const photoStream = fs.createReadStream(photoPath);
                    formData.append('foto_profil', photoStream, {
                        filename: photoFileName,
                        contentType: photoFile.mimetype,
                        knownLength: photoFile.size
                    });
                    
                    // PENTING: Kirim URL publik lengkap, bukan hanya nama file
                    formData.append('foto_profil_path', String(publicPhotoUrl));
                }
                
                // Dokumen pendukung (sama seperti POST)
                if (req.files.dokumen_pendukung && req.files.dokumen_pendukung[0]) {
                    const docFile = req.files.dokumen_pendukung[0];
                    const docPath = docFile.path;
                    const docFileName = path.basename(docPath);
                    
                    // Generate URL standar untuk file
                    const publicDocUrl = generatePublicFileUrl('dokumen_pendukung', docFileName);
                    
                    console.log('Dokumen pendukung disimpan di:', docPath);
                    console.log('Nama file dokumen:', docFileName);
                    console.log('URL publik dokumen:', publicDocUrl);
                    
                    // Stream file untuk upload
                    const docStream = fs.createReadStream(docPath);
                    formData.append('dokumen_pendukung', docStream, {
                        filename: docFileName,
                        contentType: docFile.mimetype,
                        knownLength: docFile.size
                    });
                    
                    // PENTING: Kirim URL publik lengkap, bukan hanya nama file
                    formData.append('dokumen_pendukung_path', String(publicDocUrl));
                }
            }
            
            // Kirim request
            const response = await axios.put(`${API_BASE_URL}/dokter-muda/${id}`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${global.token}`
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            console.log('API response status:', response.data.success);
            
            req.flash('success_msg', 'Data dokter muda berhasil diperbarui');
            res.redirect('/admin/dokter-muda');
        } catch (err) {
            // Penanganan error (sama seperti POST)
            console.error('API Error:', err);
            
            if (err.response) {
                console.error('Error status:', err.response.status);
                console.error('Error data:', err.response.data);
            }
            
            if (err.response && err.response.status === 401) {
                req.session.destroy();
                global.token = null;
                req.flash('error_msg', 'Your session has expired. Please log in again.');
                return res.redirect('/auth/login');
            }
            
            const errorMsg = err.response?.data?.message || 
                            (err.response?.data?.errors ? err.response.data.errors.join(', ') : 'Failed to update dokter muda');
            
            req.flash('error_msg', errorMsg);
            res.redirect(`/admin/dokter-muda/edit/${req.params.id}`);
        }
    });
});

// Route: Proses verifikasi dokter muda
router.post('/verify/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { status_verifikasi, verification_notes } = req.body;
        
        await dokterMudaAPI.updateVerificationStatus(id, {
            status_verifikasi
        });
        
        req.flash('success_msg', 'Status verifikasi dokter muda berhasil diperbarui');
        res.redirect(`/admin/dokter-muda/${id}`);
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to update verification status');
        res.redirect(`/admin/dokter-muda/${req.params.id}`);
    }
});

// Route: Proses hapus dokter muda
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await dokterMudaAPI.deleteDokterMuda(id);
        
        req.flash('success_msg', 'Dokter muda berhasil dihapus');
        res.redirect('/admin/dokter-muda');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete dokter muda');
        res.redirect('/admin/dokter-muda');
    }
});



module.exports = router;