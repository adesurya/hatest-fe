// Modified app.js to handle API login with redirection
// This is a simplified version - you would need to integrate it with your full app.js

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

// Session configuration
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1 hour
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

// Route setup
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/user', userRouter);

// API login endpoint that redirects like the web form
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Using the authAPI service
    const { authAPI } = require('./services/api');
    const response = await authAPI.login({ email, password });
    
    // Store user in session, just like the web login
    req.session.user = response.user;
    global.token = response.token;
    
    // Redirect based on user role - this is the key part
    const redirectPath = response.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
    
    // Decide how to respond based on the Accept header
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/json')) {
      // If client expects JSON, send JSON with redirect info
      return res.status(200).json({
        success: true,
        token: response.token,
        user: response.user,
        redirect: redirectPath
      });
    } else {
      // Otherwise redirect directly
      return res.redirect(redirectPath);
    }
  } catch (err) {
    console.error('Login Error:', err);
    
    // Decide how to respond based on the Accept header
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/json')) {
      // If client expects JSON, send JSON error
      return res.status(401).json({ 
        success: false, 
        message: err.message || 'Invalid email or password' 
      });
    } else {
      // For non-JSON clients, flash an error and redirect to login
      req.flash('error_msg', err.message || 'Invalid email or password');
      return res.redirect('/auth/login');
    }
  }
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