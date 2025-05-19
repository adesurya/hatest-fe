// Updated app.js with direct API login endpoint

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');

// Import routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const userRouter = require('./routes/user');
const adminStats = require('./middleware/admin-stats');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(adminStats);

// Session configuration
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 } // 8 hours
}));

// Flash messages
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.user || null;
  next();
});

// Include the API login endpoint directly in app.js
// This makes sure it's available at the right path
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Import auth API here to avoid circular dependencies
    const { authAPI } = require('./services/api');
    const response = await authAPI.login({ email, password });
    
    // Store user in session with proper role information
    req.session.user = {
      id: response.user.id,
      name: response.user.full_name,
      email: response.user.email,
      is_admin: response.user.is_admin,
      role: response.user.is_admin === 1 ? 'admin' : 'user' // Explicitly set role for views
    };
    
    global.token = response.token;
    
    // Return JSON with user info and redirect URL
    return res.status(200).json({
      success: true,
      token: response.token,
      user: response.user,
      redirect: response.user.is_admin === 1 ? '/admin/dashboard' : '/user/dashboard'
    });
  } catch (err) {
    console.error('Login Error:', err);
    
    return res.status(401).json({ 
      success: false, 
      message: err.message || 'Invalid email or password' 
    });
  }
});

app.get('/api/doctors', async (req, res) => {
  try {
    // Get query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Fetch more doctors for the map
    const search = req.query.search || '';
    
    // Import doctors API here to avoid circular dependencies
    const { doctorsAPI } = require('./services/api');
    
    // Fetch doctors with locations
    const response = await doctorsAPI.getDoctors(page, limit, search);
    
    // Return JSON with doctors data
    return res.status(200).json({
      success: true,
      doctors: response.doctors || [],
      pagination: response.pagination || {
        total: response.doctors ? response.doctors.length : 0,
        totalPages: 1,
        currentPage: 1,
        limit: limit
      }
    });
  } catch (err) {
    console.error('Doctors API Error:', err);
    
    return res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to fetch doctors data' 
    });
  }
});



// Web routes
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/user', userRouter);


// Tambahkan route khusus untuk dokumen dan gambar di berbagai lokasi
// Ini memungkinkan frontend untuk mengakses file dari berbagai path
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use('/uploads/profiles', express.static(path.join(__dirname, 'public/uploads/profiles')));
app.use('/uploads/documents', express.static(path.join(__dirname, 'public/uploads/documents')));

// Route khusus untuk file yang mungkin terletak di tempat lain di sistem
app.get('/files/*', (req, res) => {
    // Ambil path dari URL
    const requestedFile = req.params[0];
    
    // Coba cari file di berbagai lokasi
    const possibleLocations = [
        path.join(__dirname, 'public/uploads', requestedFile),
        path.join(__dirname, 'public/uploads/dokter-muda/profiles', requestedFile),
        path.join(__dirname, 'public/uploads/dokter-muda/documents', requestedFile),
        path.join(__dirname, 'public', requestedFile)
    ];
    
    // Cek tiap lokasi dan kirimkan file jika ditemukan
    for (const location of possibleLocations) {
        if (fs.existsSync(location)) {
            return res.sendFile(location);
        }
    }
    
    // Jika tidak ditemukan, kirim 404
    res.status(404).send('File tidak ditemukan');
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404).render('pages/error', {
    title: '404 Not Found',
    message: 'The page you are looking for does not exist.',
    status: 404
  });
});

// Error handler
app.use((err, req, res, next) => {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('pages/error', {
    title: 'Error',
    message: err.message,
    status: err.status || 500
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;