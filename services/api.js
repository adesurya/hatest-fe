// services/api.js - API Integration Service with updated authentication

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Base URL for API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for file uploads
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
    // Detailed error logging for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access
      console.log('Unauthorized access. Token may be invalid or expired.');
      global.token = null;
    }
    return Promise.reject(error);
  }
);

// Auth API calls
const authAPI = {
  login: async (credentials) => {
    try {
      // Make direct request to the actual backend API
      const response = await axios.post('http://localhost:3000/api/auth/login', credentials, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Store token globally for future API calls
      if (response.data && response.data.token) {
        global.token = response.data.token;
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error details:', error.response?.data || error.message);
      
      // Enhanced error handling
      if (error.response) {
        throw {
          response: error.response,
          message: error.response.data.message || 'Authentication failed'
        };
      } else if (error.request) {
        throw {
          request: error.request,
          message: 'No response from server. Please try again later.'
        };
      } else {
        throw {
          message: error.message || 'An error occurred during authentication'
        };
      }
    }
  },
  
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw {
          response: error.response,
          message: error.response.data.message || 'Registration failed'
        };
      }
      throw error;
    }
  },
  
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw {
          response: error.response,
          message: error.response.data.message || 'Failed to send reset link'
        };
      }
      throw error;
    }
  },
  
  resetPassword: async (token, password) => {
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw {
          response: error.response,
          message: error.response.data.message || 'Failed to reset password'
        };
      }
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      global.token = null;
      return response.data;
    } catch (error) {
      // Clear token regardless of error
      global.token = null;
      throw error;
    }
  }
};

// User API calls
const userAPI = {
  getUserProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updateUserProfile: async (formData) => {
    try {
      // For multipart/form-data we need to set the right header
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const response = await api.put('/users/profile', formData, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/users/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getUserDashboard: async () => {
    try {
      const response = await api.get('/users/dashboard');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getUserActivities: async () => {
    try {
      const response = await api.get('/users/activities');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getUserMembership: async () => {
    try {
      const response = await api.get('/users/membership');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getUserCertificates: async () => {
    try {
      const response = await api.get('/users/certificates');
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
      // Check if we need to handle file uploads
      if (userData.profile_photo instanceof File || userData.id_card_photo instanceof File) {
        const formData = new FormData();
        
        // Add all fields to formData
        Object.keys(userData).forEach(key => {
          if (userData[key] instanceof File) {
            formData.append(key, userData[key]);
          } else {
            formData.append(key, userData[key]);
          }
        });
        
        const response = await api.post('/admin/users', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } else {
        // Regular JSON request
        const response = await api.post('/admin/users', userData);
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  },
  
  updateUser: async (id, userData) => {
    try {
      // Check if we need to handle file uploads
      if (userData.profile_photo instanceof File || userData.id_card_photo instanceof File) {
        const formData = new FormData();
        
        // Add all fields to formData
        Object.keys(userData).forEach(key => {
          if (userData[key] instanceof File) {
            formData.append(key, userData[key]);
          } else {
            formData.append(key, userData[key]);
          }
        });
        
        const response = await api.put(`/admin/users/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } else {
        // Regular JSON request
        const response = await api.put(`/admin/users/${id}`, userData);
        return response.data;
      }
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
  getSliders: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/admin/sliders?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getSliderById: async (id) => {
    try {
      const response = await api.get(`/admin/sliders/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  createSlider: async (sliderData) => {
    try {
      // Check if we need to handle file uploads
      if (sliderData.image instanceof File) {
        const formData = new FormData();
        
        // Add all fields to formData
        Object.keys(sliderData).forEach(key => {
          if (sliderData[key] instanceof File) {
            formData.append(key, sliderData[key]);
          } else {
            formData.append(key, sliderData[key]);
          }
        });
        
        const response = await api.post('/admin/sliders', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } else {
        // Regular JSON request
        const response = await api.post('/admin/sliders', sliderData);
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  },
  
  updateSlider: async (id, sliderData) => {
    try {
      // Check if we need to handle file uploads
      if (sliderData.image instanceof File) {
        const formData = new FormData();
        
        // Add all fields to formData
        Object.keys(sliderData).forEach(key => {
          if (sliderData[key] instanceof File) {
            formData.append(key, sliderData[key]);
          } else {
            formData.append(key, sliderData[key]);
          }
        });
        
        const response = await api.put(`/admin/sliders/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } else {
        // Regular JSON request
        const response = await api.put(`/admin/sliders/${id}`, sliderData);
        return response.data;
      }
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
  },
  
  // Articles management
  getArticles: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/admin/articles?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getArticleById: async (id) => {
    try {
      const response = await api.get(`/admin/articles/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  createArticle: async (articleData) => {
    try {
      // Check if we need to handle file uploads
      if (articleData.image instanceof File) {
        const formData = new FormData();
        
        // Add all fields to formData
        Object.keys(articleData).forEach(key => {
          if (articleData[key] instanceof File) {
            formData.append(key, articleData[key]);
          } else {
            formData.append(key, articleData[key]);
          }
        });
        
        const response = await api.post('/admin/articles', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } else {
        // Regular JSON request
        const response = await api.post('/admin/articles', articleData);
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  },
  
  updateArticle: async (id, articleData) => {
    try {
      // Check if we need to handle file uploads
      if (articleData.image instanceof File) {
        const formData = new FormData();
        
        // Add all fields to formData
        Object.keys(articleData).forEach(key => {
          if (articleData[key] instanceof File) {
            formData.append(key, articleData[key]);
          } else {
            formData.append(key, articleData[key]);
          }
        });
        
        const response = await api.put(`/admin/articles/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } else {
        // Regular JSON request
        const response = await api.put(`/admin/articles/${id}`, articleData);
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  },
  
  deleteArticle: async (id) => {
    try {
      const response = await api.delete(`/admin/articles/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Activities management
  getActivities: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/admin/activities?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getActivityById: async (id) => {
    try {
      const response = await api.get(`/admin/activities/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  createActivity: async (activityData) => {
    try {
      // Check if we need to handle file uploads
      if (activityData.image instanceof File) {
        const formData = new FormData();
        
        // Add all fields to formData
        Object.keys(activityData).forEach(key => {
          if (activityData[key] instanceof File) {
            formData.append(key, activityData[key]);
          } else {
            formData.append(key, activityData[key]);
          }
        });
        
        const response = await api.post('/admin/activities', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } else {
        // Regular JSON request
        const response = await api.post('/admin/activities', activityData);
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  },
  
  updateActivity: async (id, activityData) => {
    try {
      // Check if we need to handle file uploads
      if (activityData.image instanceof File) {
        const formData = new FormData();
        
        // Add all fields to formData
        Object.keys(activityData).forEach(key => {
          if (activityData[key] instanceof File) {
            formData.append(key, activityData[key]);
          } else {
            formData.append(key, activityData[key]);
          }
        });
        
        const response = await api.put(`/admin/activities/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } else {
        // Regular JSON request
        const response = await api.put(`/admin/activities/${id}`, activityData);
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  },
  
  deleteActivity: async (id) => {
    try {
      const response = await api.delete(`/admin/activities/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = {
  authAPI,
  userAPI,
  adminAPI
};