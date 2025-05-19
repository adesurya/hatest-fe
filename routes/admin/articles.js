// routes/admin/articles.js
const express = require('express');
const router = express.Router();
const { articlesAPI } = require('../../services/api');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const dir = path.join(__dirname, '../../public/uploads/articles');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Hanya file gambar yang diperbolehkan!'));
        }
    }
});

const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        req.flash('error_msg', 'Upload error: ' + err.message);
        return res.redirect(req.originalUrl);
    } else if (err) {
        console.error('Unknown error:', err);
        req.flash('error_msg', 'Error: ' + err.message);
        return res.redirect(req.originalUrl);
    }
    next();
};

// Route: Listar todas as notícias
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        console.log('Fetching articles with search:', search);
        
        const response = await articlesAPI.getAllArticles(page, limit, search);
        
        // Acesso aos dados com a estrutura correta
        const articles = response.articles || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || articles.length
        };
        
        res.render('pages/admin/articles/index', {
            title: 'Manajemen Berita',
            articles: articles,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load articles data');
        res.redirect('/admin/dashboard');
    }
});

// Route: Formulário para adicionar nova notícia
router.get('/create', async (req, res) => {
    try {
        // Obter categorias para o formulário
        const categoriesResponse = await articlesAPI.getAllCategories();
        const categories = categoriesResponse.categories || [];
        
        res.render('pages/admin/articles/form', {
            title: 'Tambah Berita Baru',
            user: req.session.user,
            article: null,
            categories: categories,
            isEdit: false
        });
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load categories');
        res.redirect('/admin/articles');
    }
});

router.post('/', upload.single('featured_image'), async (req, res) => {
    try {
        console.log('Received form data:', req.body);
        console.log('Received file:', req.file);
        
        // Membuat objek data artikel dari body request
        const articleData = {
            title: req.body.title,
            content: req.body.content,
            excerpt: req.body.excerpt,
            category_id: req.body.category_id,
            status: "published"
        };
        
        let response;
        
        // Jika ada file gambar, kirim ke API dengan fileInfo
        if (req.file) {
            // Kirim data artikel dan informasi file ke API
            response = await articlesAPI.createArticle(articleData, req.file);
        } else {
            // Jika tidak ada file, kirim hanya data artikel
            response = await articlesAPI.createArticle(articleData);
        }
        
        console.log('API response:', response);
        
        req.flash('success_msg', 'Berita berhasil ditambahkan');
        res.redirect('/admin/articles');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to add article');
        res.redirect('/admin/articles/create');
    }
});

// Route: Berita Artikel
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await articlesAPI.getArticleById(id);
        
        // Acessar o artigo da estrutura de resposta correta
        const article = response.article || {};
        
        res.render('pages/admin/articles/detail', {
            title: 'Berita Artikel',
            article: article,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load article details');
        res.redirect('/admin/articles');
    }
});

// Route: Formulário para editar notícia
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [articleResponse, categoriesResponse] = await Promise.all([
            articlesAPI.getArticleById(id),
            articlesAPI.getAllCategories()
        ]);
        
        // Acessar o artigo e categorias das estruturas de resposta corretas
        const article = articleResponse.article || {};
        const categories = categoriesResponse.categories || [];
        
        res.render('pages/admin/articles/form', {
            title: 'Edit Berita',
            article: article,
            categories: categories,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load article data');
        res.redirect('/admin/articles');
    }
});

// Route: Processar atualização de notícia
router.post('/:id', upload.single('featured_image'), async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Updating article ID ${id}`);
        console.log('Received form data:', req.body);
        console.log('Received file:', req.file);
        
        // Membuat objek data artikel dari body request
        const articleData = {
            title: req.body.title,
            content: req.body.content,
            excerpt: req.body.excerpt,
            category_id: req.body.category_id,
            status: "published"
        };
        
        let response;
        
        // Jika ada file gambar, kirim ke API dengan fileInfo
        if (req.file) {
            // Kirim data artikel dan informasi file ke API
            response = await articlesAPI.updateArticle(id, articleData, req.file);
        } else {
            // Jika tidak ada file, kirim hanya data artikel
            response = await articlesAPI.updateArticle(id, articleData);
        }
        
        req.flash('success_msg', 'Berita berhasil diperbarui');
        res.redirect('/admin/articles');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to update article');
        res.redirect(`/admin/articles/edit/${req.params.id}`);
    }
});

// Route: Processar exclusão de notícia
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await articlesAPI.deleteArticle(id);
        
        req.flash('success_msg', 'Berita berhasil dihapus');
        res.redirect('/admin/articles');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete article');
        res.redirect('/admin/articles');
    }
});

// Rota para categoria de notícias
router.get('/categories', async (req, res) => {
    try {
        const categoriesResponse = await articlesAPI.getAllCategories();
        const categories = categoriesResponse.categories || [];
        
        res.render('pages/admin/articles/categories', {
            title: 'Manajemen Kategori Berita',
            categories: categories,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load categories');
        res.redirect('/admin/articles');
    }
});

// Criar nova categoria
router.post('/categories', async (req, res) => {
    try {
        const categoryData = {
            name: req.body.name,
            description: req.body.description
        };
        
        await articlesAPI.createCategory(categoryData);
        
        req.flash('success_msg', 'Kategori berita berhasil ditambahkan');
        res.redirect('/admin/articles/categories');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to create category');
        res.redirect('/admin/articles/categories');
    }
});

// Atualizar categoria
router.post('/categories/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const categoryData = {
            name: req.body.name,
            description: req.body.description
        };
        
        await articlesAPI.updateCategory(id, categoryData);
        
        req.flash('success_msg', 'Kategori berita berhasil diperbarui');
        res.redirect('/admin/articles/categories');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to update category');
        res.redirect('/admin/articles/categories');
    }
});

// Excluir categoria
router.post('/categories/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await articlesAPI.deleteCategory(id);
        
        req.flash('success_msg', 'Kategori berita berhasil dihapus');
        res.redirect('/admin/articles/categories');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete category');
        res.redirect('/admin/articles/categories');
    }
});

module.exports = router;