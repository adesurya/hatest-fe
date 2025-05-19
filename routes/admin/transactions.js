// routes/admin/transactions.js
const express = require('express');
const router = express.Router();
const { transactionsAPI } = require('../../services/api');

// Route: List all transactions with search and filter
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || '';
        
        console.log('Fetching transactions with search:', search, 'and status:', status);
        
        const response = await transactionsAPI.getAllTransactions(page, limit, search, status);
        
        // Access data with the correct structure
        const transactions = response.transactions || [];
        const pagination = {
            page: page,
            limit: limit,
            totalPages: response.pagination?.totalPages || 1,
            totalItems: response.pagination?.total || transactions.length
        };
        
        // Calculate total amount from successful transactions
        let totalSuccessAmount = 0;
        if (transactions && transactions.length > 0) {
            const successfulTransactions = transactions.filter(tx => tx.status === 'success');
            totalSuccessAmount = successfulTransactions.reduce((acc, tx) => acc + parseFloat(tx.amount), 0);
        }
        
        res.render('pages/admin/transactions/index', {
            title: 'Manajemen Transaksi',
            transactions: transactions,
            pagination: pagination,
            user: req.session.user,
            search: search,
            status: status,
            totalSuccessAmount: totalSuccessAmount
        });
    } catch (err) {
        console.error('API Error:', err);
        
        if (err.response && err.response.status === 401) {
            req.session.destroy();
            global.token = null;
            req.flash('error_msg', 'Your session has expired. Please log in again.');
            return res.redirect('/auth/login');
        }
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load transactions data');
        res.redirect('/admin/dashboard');
    }
});

// Route: Transaction details
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const response = await transactionsAPI.getTransactionById(id);
        
        // Access transaction from the correct response structure
        const transaction = response.transaction || {};
        
        res.render('pages/admin/transactions/detail', {
            title: 'Detail Transaksi',
            transaction: transaction,
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
        
        req.flash('error_msg', err.response?.data?.message || 'Failed to load transaction details');
        res.redirect('/admin/transactions');
    }
});

module.exports = router;