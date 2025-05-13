// routes/index.js - Main routes for public pages

const express = require('express');
const router = express.Router();
const { contentAPI } = require('../services/api');

// Middleware to handle API errors
const handleApiError = (err, req, res, defaultMessage = 'An error occurred') => {
  console.error('API Error:', err);
  req.flash('error_msg', err.response?.data?.message || defaultMessage);
  return res.status(500).render('pages/error', {
    title: 'Error',
    message: err.response?.data?.message || defaultMessage,
    status: err.response?.status || 500
  });
};

// Home page
router.get('/', async (req, res) => {
  try {
    const [homepageData, sliders, activities] = await Promise.all([
      contentAPI.getHomepageContent(),
      contentAPI.getSliders(),
      contentAPI.getActivities(1, 6) // Get latest 6 activities
    ]);
    
    res.render('pages/home', {
      title: 'Home',
      homepage: homepageData,
      sliders: sliders,
      activities: activities
    });
  } catch (err) {
    handleApiError(err, req, res, 'Failed to load homepage content');
  }
});

// About page
router.get('/about', async (req, res) => {
  try {
    const aboutData = await contentAPI.getAbout();
    
    res.render('pages/about', {
      title: 'About Us',
      about: aboutData
    });
  } catch (err) {
    handleApiError(err, req, res, 'Failed to load about page content');
  }
});

// Articles page
router.get('/articles', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const articles = await contentAPI.getArticles(page, limit);
    
    res.render('pages/article', {
      title: 'Articles',
      articles: articles.data,
      pagination: {
        page: articles.page,
        limit: articles.limit,
        totalPages: articles.totalPages,
        totalItems: articles.totalItems
      }
    });
  } catch (err) {
    handleApiError(err, req, res, 'Failed to load articles');
  }
});

// Single article page
router.get('/articles/:id', async (req, res) => {
  try {
    const articleId = req.params.id;
    const article = await contentAPI.getArticleById(articleId);
    
    res.render('pages/article-detail', {
      title: article.title,
      article: article
    });
  } catch (err) {
    handleApiError(err, req, res, 'Failed to load article');
  }
});

// Organization structure page
router.get('/structure', async (req, res) => {
  try {
    const structure = await contentAPI.getStructure();
    
    res.render('pages/structure', {
      title: 'Organization Structure',
      structure: structure
    });
  } catch (err) {
    handleApiError(err, req, res, 'Failed to load organization structure');
  }
});

// Benefits page
router.get('/benefits', async (req, res) => {
  try {
    const benefits = await contentAPI.getBenefits();
    
    res.render('pages/benefits', {
      title: 'Benefits of Joining',
      benefits: benefits
    });
  } catch (err) {
    handleApiError(err, req, res, 'Failed to load benefits information');
  }
});

// Testimonials page
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await contentAPI.getTestimonials();
    
    res.render('pages/testimonials', {
      title: 'Testimonials',
      testimonials: testimonials
    });
  } catch (err) {
    handleApiError(err, req, res, 'Failed to load testimonials');
  }
});

// Vision and mission page
router.get('/vision-mission', async (req, res) => {
  try {
    const visionMission = await contentAPI.getVisionMission();
    
    res.render('pages/vision-mission', {
      title: 'Vision & Mission',
      visionMission: visionMission
    });
  } catch (err) {
    handleApiError(err, req, res, 'Failed to load vision and mission content');
  }
});

// Contact page
router.get('/contact', async (req, res) => {
  try {
    const contactInfo = await contentAPI.getContactInfo();
    
    res.render('pages/contact', {
      title: 'Contact Us',
      contactInfo: contactInfo
    });
  } catch (err) {
    handleApiError(err, req, res, 'Failed to load contact information');
  }
});

// Process contact form submission
router.post('/contact', async (req, res) => {
  try {
    const messageData = {
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
      message: req.body.message
    };
    
    await contentAPI.sendContactMessage(messageData);
    
    req.flash('success_msg', 'Your message has been sent successfully');
    res.redirect('/contact');
  } catch (err) {
    req.flash('error_msg', err.response?.data?.message || 'Failed to send your message');
    res.redirect('/contact');
  }
});

// History page
router.get('/history', async (req, res) => {
  try {
    const history = await contentAPI.getHistory();
    
    res.render('pages/history', {
      title: 'Organization History',
      history: history
    });
  } catch (err) {
    handleApiError(err, req, res, 'Failed to load organization history');
  }
});

// Activities/Events page
router.get('/activities', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const activities = await contentAPI.getActivities(page, limit);
    
    res.render('pages/activities', {
      title: 'Activities & Events',
      activities: activities.data,
      pagination: {
        page: activities.page,
        limit: activities.limit,
        totalPages: activities.totalPages,
        totalItems: activities.totalItems
      }
    });
  } catch (err) {
    handleApiError(err, req, res, 'Failed to load activities');
  }
});

module.exports = router;