// routes/admin/vision-mission.js
const express = require('express');
const router = express.Router();
const { visionMissionAPI } = require('../../services/api');

// Route: List all vision mission items
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || '';
        
        console.log('Fetching vision and mission items with search:', search);
        
        const response = await visionMissionAPI.getAllItems();
        
        // Process data for display
        const visionItems = response.data?.vision || [];
        const missionItems = response.data?.mission || [];
        
        // Combine all items for display
        const allItems = [
            ...visionItems.map(item => ({...item, type_label: 'Visi'})),
            ...missionItems.map(item => ({...item, type_label: 'Misi'}))
        ];

        res.render('pages/admin/vision-mission/index', {
            title: 'Manajemen Visi dan Misi',
            items: allItems,
            user: req.session.user,
            search: search,
            visionCount: visionItems.length,
            missionCount: missionItems.length
        });
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load vision and mission data');
        res.redirect('/admin/dashboard');
    }
});

// Route: Form to add new item
router.get('/create', (req, res) => {
    res.render('pages/admin/vision-mission/form', {
        title: 'Tambah Visi/Misi Baru',
        user: req.session.user,
        item: null,
        isEdit: false
    });
});

// Route: Process add new item
router.post('/', async (req, res) => {
    try {
        console.log('Received form data:', req.body);
        
        const itemData = {
            type: req.body.type,
            content: req.body.content,
            order_number: parseInt(req.body.order_number),
            is_active: req.body.is_active === 'true' || req.body.is_active === true || req.body.is_active === 1 ? true : false
        };
        
        const response = await visionMissionAPI.createItem(itemData);
        
        req.flash('success_msg', `${req.body.type === 'vision' ? 'Visi' : 'Misi'} berhasil ditambahkan`);
        res.redirect('/admin/vision-mission');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to add item');
        res.redirect('/admin/vision-mission/create');
    }
});

// Route: Detail item
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await visionMissionAPI.getItemById(id);
        
        const item = response.data || {};
        
        res.render('pages/admin/vision-mission/detail', {
            title: 'Detail Visi/Misi',
            item: item,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load item details');
        res.redirect('/admin/vision-mission');
    }
});

// Route: Form to edit item
router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await visionMissionAPI.getItemById(id);
        
        const item = response.data || {};
        
        res.render('pages/admin/vision-mission/form', {
            title: 'Edit Visi/Misi',
            item: item,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load item data');
        res.redirect('/admin/vision-mission');
    }
});

// Route: Process update item
router.post('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`Updating vision/mission item ID ${id}`);
        
        const itemData = {
            content: req.body.content,
            is_active: req.body.is_active === 'true' || req.body.is_active === true || req.body.is_active === 1 ? true : false
        };
        
        // Add order_number if provided
        if (req.body.order_number) {
            itemData.order_number = parseInt(req.body.order_number);
        }
        
        await visionMissionAPI.updateItem(id, itemData);
        
        req.flash('success_msg', 'Data berhasil diperbarui');
        res.redirect('/admin/vision-mission');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to update item');
        res.redirect(`/admin/vision-mission/edit/${req.params.id}`);
    }
});

// Route: Process delete item
router.post('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        await visionMissionAPI.deleteItem(id);
        
        req.flash('success_msg', 'Item berhasil dihapus');
        res.redirect('/admin/vision-mission');
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to delete item');
        res.redirect('/admin/vision-mission');
    }
});

module.exports = router;