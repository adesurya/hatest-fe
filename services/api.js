// services/api.js - API Integration Service

const axios = require('axios');

// Base URL for API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = global.token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access
      console.log('Unauthorized access. Redirecting to login...');
      // Clear token logic would go here
    }
    return Promise.reject(error);
  }
);

// Auth API calls
const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  resetPassword: async (token, password) => {
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Content API calls
const contentAPI = {
  // Homepage content
  getHomepageContent: async () => {
    try {
      const response = await api.get('/content/homepage');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Sliders
  getSliders: async () => {
    try {
      const response = await api.get('/content/sliders');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Activity agenda
  getActivities: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/content/activities?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Articles
  getArticles: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/content/articles?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getArticleById: async (id) => {
    try {
      const response = await api.get(`/content/articles/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Organization structure
  getStructure: async () => {
    try {
      const response = await api.get('/content/structure');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Benefits
  getBenefits: async () => {
    try {
      const response = await api.get('/content/benefits');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Testimonials
  getTestimonials: async () => {
    try {
      const response = await api.get('/content/testimonials');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Vision & Mission
  getVisionMission: async () => {
    try {
      const response = await api.get('/content/vision-mission');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // About
  getAbout: async () => {
    try {
      const response = await api.get('/content/about');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // History
  getHistory: async () => {
    try {
      const response = await api.get('/content/history');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Contact info
  getContactInfo: async () => {
    try {
      const response = await api.get('/content/contact');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Send contact message
  sendContactMessage: async (messageData) => {
    try {
      const response = await api.post('/content/contact', messageData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Admin API calls
const adminAPI = {
  // Dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Users management
  getUsers: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/admin/users?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getUserById: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  createUser: async (userData) => {
    try {
      const response = await api.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/admin/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Content management (sliders, articles, etc.)
  // Example for sliders
  getAdminSliders: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/admin/sliders?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  createSlider: async (sliderData) => {
    try {
      const response = await api.post('/admin/sliders', sliderData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updateSlider: async (id, sliderData) => {
    try {
      const response = await api.put(`/admin/sliders/${id}`, sliderData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  deleteSlider: async (id) => {
    try {
      const response = await api.delete(`/admin/sliders/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  // Similar methods would be defined for other content types
  // (articles, testimonials, etc.)
};

// User API calls
const userAPI = {
  getUserProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updateUserProfile: async (profileData) => {
    try {
      const response = await api.put('/user/profile', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/user/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getUserDashboard: async () => {
    try {
      const response = await api.get('/user/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = {
  authAPI,
  contentAPI,
  adminAPI,
  userAPI
};