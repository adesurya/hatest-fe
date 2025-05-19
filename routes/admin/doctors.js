// routes/admin/doctors.js - Perbaikan untuk error dan validasi NIK

const express = require('express');
const router = express.Router();
const { doctorsAPI } = require('../../services/api');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Environment variables
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

// Fungsi untuk validasi dan format latitude/longitude - TEMPATKAN DI SINI, BUKAN DI DALAM ROUTE
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

// Fungsi untuk validasi NIK - TEMPATKAN DI SINI, BUKAN DI DALAM ROUTE
function validateNIK(nik) {
    const nikString = String(nik);
    if (!/^\d+$/.test(nikString)) {
        return false;
    }
    return nikString.length === 16;
}


// Fungsi untuk mengkonversi path file lokal ke URL
function convertLocalPathToUrl(filePath) {
    if (filePath && filePath.startsWith('public/')) {
        return filePath.replace('public/', '/');
    }
    return filePath;
}

function generateConsistentFilename(originalname, type) {
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  const fileExt = path.extname(originalname);
  return `${type}-${timestamp}-${randomSuffix}${fileExt}`;
}


function generatePublicFileUrl(fileType, fileName) {
    if (fileType === 'profile_photo') {
        return `/uploads/doctors/profiles/${fileName}`;
    } else if (fileType === 'supporting_document') {
        return `/uploads/doctors/documents/${fileName}`;
    }
    return `/uploads/${fileName}`;
}


// Setup multer dengan konfigurasi penyimpanan di path yang benar
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath;
        
        if (file.fieldname === 'profile_photo') {
            uploadPath = 'public/uploads/doctors/profiles/';
        } else if (file.fieldname === 'supporting_document') {
            uploadPath = 'public/uploads/doctors/documents/';
        } else {
            uploadPath = 'public/uploads/';
        }
        
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Buat nama file yang tidak terlalu panjang tapi tetap unik
        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 10000);
        const fileExt = path.extname(file.originalname);
        
        // Jika dalam mode edit, tambahkan ID dokter
        const doctorId = req.params.id ? `${req.params.id}-` : '';
        
        // Nama file akan jadi: fieldname-doctorId-timestamp-randomSuffix.ext
        cb(null, `${file.fieldname}-${doctorId}${timestamp}-${randomSuffix}${fileExt}`);
    }
});

// Validasi file
const fileFilter = function (req, file, cb) {
    if (file.fieldname === 'profile_photo') {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Hanya file gambar yang diizinkan untuk foto profil!'), false);
        }
    } else if (file.fieldname === 'supporting_document') {
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

// Daftar semua dokter
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const filter = req.query.filter || '';
        
        console.log('Fetching doctors with filter:', filter);
        
        const response = await doctorsAPI.getDoctors(page, limit, search, filter);
        
        // Akses data dengan struktur yang benar
        const doctors = response.doctors || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || doctors.length
        };
        
        res.render('pages/admin/doctors/index', {
            title: 'Manajemen Dokter',
            doctors: doctors,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load doctors data');
        res.redirect('/admin/dashboard');
    }
});

// Form tambah dokter baru
router.get('/create', (req, res) => {
    res.render('pages/admin/doctors/form', {
        title: 'Tambah Dokter Baru',
        user: req.session.user,
        doctor: null,
        isEdit: false
    });
});

// Proses tambah dokter dengan validasi NIK dan path upload yang benar
router.post('/', (req, res) => {
    upload.fields([
        { name: 'profile_photo', maxCount: 1 },
        { name: 'supporting_document', maxCount: 1 }
    ])(req, res, async function(err) {
        if (err) {
            console.error('Upload error:', err);
            req.flash('error_msg', `File upload error: ${err.message}`);
            return res.redirect('/admin/doctors/create');
        }
        
        try {
            console.log('Received form data:', req.body);
            
            // Validasi NIK
            if (req.body.nik_number && !validateNIK(req.body.nik_number)) {
                req.flash('error_msg', 'NIK harus terdiri dari 16 digit angka');
                return res.redirect('/admin/doctors/create');
            }
            
            // Buat FormData
            const formData = new FormData();
            
            // Tambahkan semua field teks
            for (const key in req.body) {
                if (req.body[key] === '') continue;
                
                if (key === 'remove_profile') {
                    formData.append(key, req.body[key] === '1' ? '1' : '0');
                } 
                else if (['latitude', 'longitude'].includes(key)) {
                    const formattedValue = formatCoordinate(req.body[key]);
                    if (formattedValue !== null) {
                        formData.append(key, formattedValue);
                        console.log(`Appending ${key} with formatted value:`, formattedValue);
                    }
                } 
                else if (key === 'graduation_year') {
                    const yearValue = parseInt(req.body[key]);
                    if (!isNaN(yearValue)) {
                        formData.append(key, yearValue.toString());
                    }
                }
                else if (key === 'nik_number') {
                    formData.append(key, req.body[key]);
                }
                else {
                    formData.append(key, req.body[key]);
                }
            }
            
            // Tambahkan file jika ada
            if (req.files) {
                // Profile photo
                if (req.files.profile_photo && req.files.profile_photo[0]) {
                    const photoFile = req.files.profile_photo[0];
                    const photoPath = photoFile.path;
                    const photoFileName = path.basename(photoPath);
                    
                    // Generate URL publik untuk file
                    const publicPhotoUrl = generatePublicFileUrl('profile_photo', photoFileName);
                    const fullPublicPhotoUrl = `${BASE_URL}${publicPhotoUrl}`;
                    
                    // Log semua info
                    console.log('Profile photo information:');
                    console.log('- Original name:', photoFile.originalname);
                    console.log('- Local path:', photoPath);
                    console.log('- Filename only:', photoFileName);
                    console.log('- Public URL:', publicPhotoUrl);
                    console.log('- Full public URL:', fullPublicPhotoUrl);
                    
                    // Stream file untuk upload
                    const photoStream = fs.createReadStream(photoPath);
                    formData.append('profile_photo', photoStream, {
                        filename: photoFile.originalname,
                        contentType: photoFile.mimetype,
                        knownLength: photoFile.size
                    });
                    
                    // PENTING: Tambahkan field untuk path file di database
                    formData.append('profile_photo_path', publicPhotoUrl);
                }
                
                // Supporting document
                if (req.files.supporting_document && req.files.supporting_document[0]) {
                    const docFile = req.files.supporting_document[0];
                    const docPath = docFile.path;
                    const docFileName = path.basename(docPath);
                    
                    // Generate URL publik untuk file
                    const publicDocUrl = generatePublicFileUrl('supporting_document', docFileName);
                    const fullPublicDocUrl = `${BASE_URL}${publicDocUrl}`;
                    
                    // Log semua info
                    console.log('Document information:');
                    console.log('- Original name:', docFile.originalname);
                    console.log('- Local path:', docPath);
                    console.log('- Filename only:', docFileName);
                    console.log('- Public URL:', publicDocUrl);
                    console.log('- Full public URL:', fullPublicDocUrl);
                    
                    // Stream file untuk upload
                    const docStream = fs.createReadStream(docPath);
                    formData.append('supporting_document', docStream, {
                        filename: docFile.originalname,
                        contentType: docFile.mimetype,
                        knownLength: docFile.size
                    });
                    
                    // PENTING: Tambahkan field untuk path file di database
                    formData.append('supporting_document_path', publicDocUrl);
                }
            }
            
            // Kirim request
            console.log('Sending request to:', `${API_BASE_URL}/doctors`);
            const response = await axios.post(`${API_BASE_URL}/doctors`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${global.token}`
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            console.log('API response status:', response.status);
            console.log('API response data:', response.data);
            
            req.flash('success_msg', 'Dokter berhasil ditambahkan');
            res.redirect('/admin/doctors');
        } catch (err) {
            console.error('API Error:', err);
            
            // Log detail error untuk debugging
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
                            (err.response?.data?.errors ? err.response.data.errors.join(', ') : 'Failed to add doctor');
            
            req.flash('error_msg', errorMsg);
            res.redirect('/admin/doctors/create');
        }
    });
});

// Detail dokter
router.get('/:id', async (req, res) => {
    try {
        const doctorId = req.params.id;
        const response = await doctorsAPI.getDoctorById(doctorId);
        
        // Akses doctor dari struktur response yang benar
        const doctor = response.doctor || {};
        
        res.render('pages/admin/doctors/detail', {
            title: 'Detail Dokter',
            doctor: doctor,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load doctor details');
        res.redirect('/admin/doctors');
    }
});

// Form edit dokter
router.get('/edit/:id', async (req, res) => {
    try {
        const doctorId = req.params.id;
        const response = await doctorsAPI.getDoctorById(doctorId);
        
        // Akses doctor dari struktur response yang benar
        const doctor = response.doctor || {};
        
        res.render('pages/admin/doctors/form', {
            title: 'Edit Dokter',
            doctor: doctor,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load doctor data');
        res.redirect('/admin/doctors');
    }
});

// Proses update dokter dengan validasi NIK dan path upload yang benar
router.post('/:id', (req, res) => {
    upload.fields([
        { name: 'profile_photo', maxCount: 1 },
        { name: 'supporting_document', maxCount: 1 }
    ])(req, res, async function(err) {
        if (err) {
            console.error('Upload error:', err);
            req.flash('error_msg', `File upload error: ${err.message}`);
            return res.redirect(`/admin/doctors/edit/${req.params.id}`);
        }
        
        try {
            const doctorId = req.params.id;
            console.log(`Updating doctor ID ${doctorId}`);
            console.log('Form data:', req.body);
            
            // Validasi NIK
            if (req.body.nik_number && !validateNIK(req.body.nik_number)) {
                req.flash('error_msg', 'NIK harus terdiri dari 16 digit angka');
                return res.redirect(`/admin/doctors/edit/${req.params.id}`);
            }
            
            // Buat FormData
            const formData = new FormData();
            
            // Tambahkan semua field teks
            for (const key in req.body) {
                if (req.body[key] === '') continue;
                
                if (key === 'remove_profile') {
                    formData.append(key, req.body[key] === '1' ? '1' : '0');
                } 
                else if (['latitude', 'longitude'].includes(key)) {
                    const formattedValue = formatCoordinate(req.body[key]);
                    if (formattedValue !== null) {
                        formData.append(key, formattedValue);
                        console.log(`Appending ${key} with formatted value:`, formattedValue);
                    }
                } 
                else if (key === 'graduation_year') {
                    const yearValue = parseInt(req.body[key]);
                    if (!isNaN(yearValue)) {
                        formData.append(key, yearValue.toString());
                    }
                }
                else if (key === 'nik_number') {
                    formData.append(key, req.body[key]);
                }
                else {
                    formData.append(key, req.body[key]);
                }
            }
            
            // Tambahkan file jika ada
            if (req.files) {
                // Profile photo
                if (req.files.profile_photo && req.files.profile_photo[0]) {
                    const photoFile = req.files.profile_photo[0];
                    const photoPath = photoFile.path;
                    const photoFileName = path.basename(photoPath);
                    
                    // Generate URL publik untuk file
                    const publicPhotoUrl = generatePublicFileUrl('profile_photo', photoFileName);
                    const fullPublicPhotoUrl = `${BASE_URL}${publicPhotoUrl}`;
                    
                    // Log semua info
                    console.log('Profile photo information:');
                    console.log('- Original name:', photoFile.originalname);
                    console.log('- Local path:', photoPath);
                    console.log('- Filename only:', photoFileName);
                    console.log('- Public URL:', publicPhotoUrl);
                    console.log('- Full public URL:', fullPublicPhotoUrl);
                    
                    // Stream file untuk upload
                    const photoStream = fs.createReadStream(photoPath);
                    formData.append('profile_photo', photoStream, {
                        filename: photoFile.originalname,
                        contentType: photoFile.mimetype,
                        knownLength: photoFile.size
                    });
                    
                    // PENTING: Tambahkan field untuk path file di database
                    formData.append('profile_photo_path', publicPhotoUrl);
                }
                
                // Supporting document
                if (req.files.supporting_document && req.files.supporting_document[0]) {
                    const docFile = req.files.supporting_document[0];
                    const docPath = docFile.path;
                    const docFileName = path.basename(docPath);
                    
                    // Generate URL publik untuk file
                    const publicDocUrl = generatePublicFileUrl('supporting_document', docFileName);
                    const fullPublicDocUrl = `${BASE_URL}${publicDocUrl}`;
                    
                    // Log semua info
                    console.log('Document information:');
                    console.log('- Original name:', docFile.originalname);
                    console.log('- Local path:', docPath);
                    console.log('- Filename only:', docFileName);
                    console.log('- Public URL:', publicDocUrl);
                    console.log('- Full public URL:', fullPublicDocUrl);
                    
                    // Stream file untuk upload
                    const docStream = fs.createReadStream(docPath);
                    formData.append('supporting_document', docStream, {
                        filename: docFile.originalname,
                        contentType: docFile.mimetype,
                        knownLength: docFile.size
                    });
                    
                    // PENTING: Tambahkan field untuk path file di database
                    formData.append('supporting_document_path', publicDocUrl);
                }
            }
            
            // Kirim request
            console.log('Sending request to:', `${API_BASE_URL}/doctors/${doctorId}`);
            const response = await axios.put(`${API_BASE_URL}/doctors/${doctorId}`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${global.token}`
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            console.log('API response status:', response.status);
            console.log('API response data:', response.data);
            
            req.flash('success_msg', 'Data dokter berhasil diperbarui');
            res.redirect('/admin/doctors');
        } catch (err) {
            console.error('API Error:', err);
            
            // Log detail error untuk debugging
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
                            (err.response?.data?.errors ? err.response.data.errors.join(', ') : 'Failed to update doctor');
            
            req.flash('error_msg', errorMsg);
            res.redirect(`/admin/doctors/edit/${req.params.id}`);
        }
    });
});

// Proses hapus dokter
router.post('/delete/:id', async (req, res) => {
    try {
        const doctorId = req.params.id;
        
        await doctorsAPI.deleteDoctor(doctorId);
        
        req.flash('success_msg', 'Dokter berhasil dihapus');
        res.redirect('/admin/doctors');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete doctor');
        res.redirect('/admin/doctors');
    }
});

// Proses verifikasi dokter
router.post('/verify/:id', async (req, res) => {
    try {
        const doctorId = req.params.id;
        const { verification_status, verification_notes } = req.body;
        
        await doctorsAPI.verifyDoctor(doctorId, {
            verification_status,
            notes: "Dokumen telah diverifikasi dan valid" // API menggunakan 'notes' bukan 'verification_notes'
        });
        
        req.flash('success_msg', 'Status verifikasi dokter berhasil diperbarui');
        res.redirect(`/admin/doctors/${doctorId}`);
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to update verification status');
        res.redirect(`/admin/doctors/${req.params.id}`);
    }
});

// Proses verifikasi dokter dengan metode PATCH
router.post('/verify-patch/:id', async (req, res) => {
    try {
        const doctorId = req.params.id;
        const { verification_status, verification_notes } = req.body;
        
        // Sesuaikan format data untuk endpoint PATCH
        const verificationData = {
            verification_status: verification_status,
            notes: "Dokumen telah diverifikasi dan valid" // API menggunakan 'notes' bukan 'verification_notes'
        };
        
        console.log('Sending verification data:', verificationData);
        
        // Gunakan metode verifyDoctorPatch
        const response = await doctorsAPI.verifyDoctorPatch(doctorId, verificationData);
        
        console.log('API response:', response);
        
        req.flash('success_msg', response.message || 'Status verifikasi dokter berhasil diperbarui');
        res.redirect(`/admin/doctors/${doctorId}`);
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to update verification status');
        res.redirect(`/admin/doctors/${req.params.id}`);
    }
});

module.exports = router;