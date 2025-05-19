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
      // Coba dapatkan data dari API
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      // Handle error lebih baik
      console.error('getDashboardStats error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Jika API endpoint tidak ada atau error, kita bisa kembalikan objek kosong
      // sehingga kode akan menggunakan data default
      return {};
    }
  },

  
  // Users management
  getUsers: async (page = 1, limit = 10, search = '') => {
    try {
        let queryParams = `?page=${page}&limit=${limit}`;
        
        if (search) {
        queryParams += `&search=${encodeURIComponent(search)}`;
        }
        
        const response = await api.get(`/users${queryParams}`);
        return response.data;
    } catch (error) {
        throw error;
    }
    },

    getUserById: async (id) => {
    try {
        const response = await api.get(`/users/${id}`);
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

//New API Integration
const doctorsAPI = {
    // Get all doctors with pagination
    getDoctors: async (page = 1, limit = 10, search = '', filter = '') => {
            try {
                let queryParams = `?page=${page}&limit=${limit}`;
                
                if (search) {
                    queryParams += `&search=${encodeURIComponent(search)}`;
                }
                
                // Perbaikan untuk filter verification_status
                if (filter) {
                    queryParams += `&verification_status=${encodeURIComponent(filter)}`;
                    console.log(`Adding filter parameter: verification_status=${encodeURIComponent(filter)}`);
                }
                
                console.log(`Making request to: ${API_BASE_URL}/doctors${queryParams}`);
                
                const response = await axios.get(`${API_BASE_URL}/doctors${queryParams}`, {
                    headers: {
                        'Authorization': `Bearer ${global.token}`
                    }
                });
                
                // Log untuk debugging
                console.log(`Received ${response.data.doctors?.length || 0} doctors from API`);
                if (filter) {
                    console.log(`Filtered by verification_status: ${filter}`);
                    
                    // Debug: cek verification_status dari setiap dokter yang dikembalikan
                    if (response.data.doctors && response.data.doctors.length > 0) {
                        const statuses = response.data.doctors.map(d => d.verification_status);
                        console.log('Verification statuses of returned doctors:', statuses);
                    }
                }
                
                return response.data;
            } catch (error) {
                handleApiError(error);
                throw error;
            }
        },
    
    // Get doctor by ID
    getDoctorById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/doctors/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            // Pastikan mengembalikan data dalam format yang diharapkan
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete doctor
    deleteDoctor: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/doctors/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Verify doctor
    verifyDoctor: async (id, data) => {
       try {
            const response = await axios.patch(`${API_BASE_URL}/doctors/${id}/verification`, data, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

// Dokter Muda API calls
const dokterMudaAPI = {
    // Get all dokter muda with pagination
    getAllDokterMuda: async (page = 1, limit = 10, search = '', filter = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            // Filter berdasarkan status verifikasi
            if (filter) {
                queryParams += `&status_verifikasi=${encodeURIComponent(filter)}`;
                console.log(`Adding filter parameter: status_verifikasi=${encodeURIComponent(filter)}`);
            }
            
            console.log(`Making request to: ${API_BASE_URL}/dokter-muda${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/dokter-muda${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.profiles?.length || 0} dokter muda from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get dokter muda by ID
    getDokterMudaById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/dokter-muda/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new dokter muda
    createDokterMuda: async (formData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/dokter-muda`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update dokter muda
    updateDokterMuda: async (id, formData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/dokter-muda/${id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update verification status
    updateVerificationStatus: async (id, statusData) => {
        try {
            const response = await axios.patch(`${API_BASE_URL}/dokter-muda/${id}/status`, statusData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete dokter muda
    deleteDokterMuda: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/dokter-muda/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

// Medical Faculties API calls
const medicalFacultiesAPI = {
    // Get all medical faculties with pagination
    getAllFaculties: async (page = 1, limit = 10, search = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/medical-faculties${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/medical-faculties${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.faculties?.length || 0} faculties from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get faculty by ID
    getFacultyById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/medical-faculties/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new faculty
    createFaculty: async (facultyData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/medical-faculties`, facultyData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update faculty
    updateFaculty: async (id, facultyData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/medical-faculties/${id}`, facultyData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete faculty
    deleteFaculty: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/medical-faculties/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

// Kurikulum Medis API calls
const kurikulumAPI = {
    // Get all kurikulum with pagination
    getAllKurikulum: async (page = 1, limit = 10, search = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/kurikulum${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/kurikulum${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.kurikulums?.length || 0} kurikulums from API`);
            
            // Debug: Inspeccionar la estructura de los datos de kurikulum
            if (response.data.kurikulums && response.data.kurikulums.length > 0) {
                const kurikulum = response.data.kurikulums[0];
                console.log('First kurikulum data structure:', {
                    id: kurikulum.id,
                    nama_fakultas: kurikulum.nama_fakultas,
                    tahun_kurikulum: kurikulum.tahun_kurikulum,
                    file_kurikulum: kurikulum.file_kurikulum,
                    // Mostrar otros campos relevantes
                });
            }
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get kurikulum by ID
    getKurikulumById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/kurikulum/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            // Debug: Inspeccionar la estructura del kurikulum por ID
            if (response.data && response.data.kurikulum) {
                console.log('Kurikulum by ID data structure:', {
                    id: response.data.kurikulum.id,
                    nama_fakultas: response.data.kurikulum.nama_fakultas,
                    file_kurikulum: response.data.kurikulum.file_kurikulum,
                    // Otros campos
                });
            }
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new kurikulum - CORREGIDO
    createKurikulum: async (kurikulumData) => {
        try {
            console.log('Creating kurikulum with data:', kurikulumData);
            
            // Si tenemos un archivo, usamos FormData
            const hasFile = kurikulumData.file_kurikulum !== undefined;
            let response;
            
            if (hasFile) {
                // Convertir a FormData para envío multipart
                const formData = new FormData();
                
                // Agregar todos los campos al FormData
                Object.keys(kurikulumData).forEach(key => {
                    if (key === 'file_kurikulum' && kurikulumData[key].startsWith('/')) {
                        // Si el campo file_kurikulum es una ruta y no un archivo real,
                        // necesitamos manejarlo de manera especial
                        // Dependiendo de tu API, podrías necesitar omitirlo o manejarlo de otra forma
                        console.log('File path detected in formData:', kurikulumData[key]);
                        
                        // Agregar la ruta del archivo
                        formData.append(key, kurikulumData[key]);
                    } else {
                        formData.append(key, kurikulumData[key]);
                    }
                });
                
                // Realizar la solicitud con FormData
                response = await axios.post(`${API_BASE_URL}/kurikulum`, formData, {
                    headers: {
                        'Authorization': `Bearer ${global.token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                // Solicitud JSON normal si no hay archivo
                response = await axios.post(`${API_BASE_URL}/kurikulum`, kurikulumData, {
                    headers: {
                        'Authorization': `Bearer ${global.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            
            console.log('Create kurikulum response:', response.data);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update kurikulum - CORREGIDO
    updateKurikulum: async (id, kurikulumData) => {
        try {
            console.log('Updating kurikulum ID', id, 'with data:', kurikulumData);
            
            // Determinar si debemos usar FormData basado en si tenemos un archivo o no
            const hasFile = kurikulumData.file_kurikulum !== undefined;
            let response;
            
            if (hasFile) {
                // Si hay un archivo, usar FormData
                console.log('Using FormData for update with file');
                const formData = new FormData();
                
                // Agregar todos los campos al FormData
                Object.keys(kurikulumData).forEach(key => {
                    formData.append(key, kurikulumData[key]);
                    console.log(`Adding to FormData: ${key} = ${kurikulumData[key]}`);
                });
                
                // Enviamos como multipart/form-data
                response = await axios({
                    method: 'put',
                    url: `${API_BASE_URL}/kurikulum/${id}`,
                    data: formData,
                    headers: {
                        'Authorization': `Bearer ${global.token}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                });
            } else {
                // Si no hay archivo, usar JSON normal
                console.log('Using JSON for update without file');
                response = await axios({
                    method: 'put',
                    url: `${API_BASE_URL}/kurikulum/${id}`,
                    data: kurikulumData,
                    headers: {
                        'Authorization': `Bearer ${global.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            
            console.log('Update kurikulum response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error updating kurikulum:', error);
            // Información más detallada sobre el error
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
            }
            
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete kurikulum
    deleteKurikulum: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/kurikulum/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

// Webinar API calls
const webinarAPI = {
    // Get all webinars with pagination
    getAllWebinars: async (page = 1, limit = 10, search = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/events${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/events${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.events?.length || 0} webinars from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get webinar by ID
    getWebinarById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/events/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new webinar
    createWebinar: async (formData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/events`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update webinar
    updateWebinar: async (id, formData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/events/${id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete webinar
    deleteWebinar: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/events/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get webinar registrations
    getWebinarRegistrations: async (id, page = 1, limit = 10) => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            const response = await axios.get(`${API_BASE_URL}/events/${id}/registrations${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get user points
    getUserPoints: async (userId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/events/points/user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Add bonus points
    addBonusPoints: async (pointsData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/events/points`, pointsData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete points record
    deletePointsRecord: async (pointId) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/events/points/${pointId}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get points leaderboard
    getPointsLeaderboard: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/events/points/leaderboard`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

const slidersAPI = {
    // Get all sliders with pagination
    getAllSliders: async (page = 1, limit = 10, search = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/sliders${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/sliders${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.sliders?.length || 0} sliders from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get active sliders
    getActiveSliders: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/sliders/active`);
            console.log(`Received ${response.data.sliders?.length || 0} active sliders from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get slider by ID
    getSliderById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/sliders/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new slider
    createSlider: async (formData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/sliders`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update slider
    updateSlider: async (id, formData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/sliders/${id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete slider
    deleteSlider: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/sliders/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

const agendaAPI = {
    // Get all agenda with pagination
    getAllAgenda: async (page = 1, limit = 10, search = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/agenda${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/agenda${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.agendas?.length || 0} agendas from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get agenda by ID
    getAgendaById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/agenda/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new agenda
    createAgenda: async (formData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/agenda`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update agenda
    updateAgenda: async (id, formData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/agenda/${id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete agenda
    deleteAgenda: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/agenda/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },

    // Create new agenda without image
    createAgendaWithoutImage: async (agendaData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/agenda`, agendaData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },

    // Update agenda without image
    updateAgendaWithoutImage: async (id, agendaData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/agenda/${id}`, agendaData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};


// About API calls - FIXED
const aboutAPI = {
    // Get all about profiles with pagination
    getAllProfiles: async (page = 1, limit = 10, search = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/about-profiles${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/about-profiles${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.profiles?.length || 0} profiles from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get profile by ID
    getProfileById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/about-profiles/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new profile - FIXED
    createProfile: async (formData) => {
        try {
            // Log formData entries untuk debugging
            console.log('FormData entries:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }
            
            const config = {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };
            
            const response = await axios.post(`${API_BASE_URL}/about-profiles`, formData, config);
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update profile - FIXED
    updateProfile: async (id, formData) => {
        try {
            // Log formData entries untuk debugging
            console.log('FormData entries for update:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }
            
            const config = {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };
            
            const response = await axios.put(`${API_BASE_URL}/about-profiles/${id}`, formData, config);
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete profile
    deleteProfile: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/about-profiles/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

// Articles API calls
const articlesAPI = {
    // Get all articles with pagination
    getAllArticles: async (page = 1, limit = 10, search = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/articles${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/articles${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.articles?.length || 0} articles from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get article by ID
    getArticleById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/articles/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get article by slug
    getArticleBySlug: async (slug) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/articles/slug/${slug}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new article
    createArticle: async (articleData, fileInfo = null) => {
        try {
            console.log('Creating article with data:', articleData);
            
            // Jika ada fileInfo, ini berarti kita punya file fisik
            if (fileInfo) {
                console.log('File info provided:', fileInfo);
                
                // Buat FormData baru
                const formData = new FormData();
                
                // Tambahkan semua field teks
                Object.keys(articleData).forEach(key => {
                    formData.append(key, articleData[key]);
                });
                
                // Tambahkan file yang dibaca dari disk
                const fileStream = fs.createReadStream(fileInfo.path);
                formData.append('featured_image', fileStream, fileInfo.filename);
                
                // Kirim request dengan FormData dan headers yang benar
                const response = await axios.post(`${API_BASE_URL}/articles`, formData, {
                    headers: {
                        ...formData.getHeaders(), // Ini penting! untuk mendapatkan boundary yang benar
                        'Authorization': `Bearer ${global.token}`
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                });
                
                console.log('Create article response:', response.data);
                return response.data;
            } else {
                // Jika tidak ada file, kirim sebagai JSON biasa
                const response = await axios.post(`${API_BASE_URL}/articles`, articleData, {
                    headers: {
                        'Authorization': `Bearer ${global.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Create article response:', response.data);
                return response.data;
            }
        } catch (error) {
            console.error('Error creating article:', error);
            
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
            }
            
            handleApiError(error);
            throw error;
        }
    },
    
    // Update article
    updateArticle: async (id, articleData, fileInfo = null) => {
        try {
            console.log(`Updating article ID ${id} with data:`, articleData);
            
            // Jika ada fileInfo, ini berarti kita punya file fisik
            if (fileInfo) {
                console.log('File info provided:', fileInfo);
                
                // Buat FormData baru
                const formData = new FormData();
                
                // Tambahkan semua field teks
                Object.keys(articleData).forEach(key => {
                    formData.append(key, articleData[key]);
                });
                
                // Tambahkan file yang dibaca dari disk
                const fileStream = fs.createReadStream(fileInfo.path);
                formData.append('featured_image', fileStream, fileInfo.filename);
                
                // Kirim request dengan FormData dan headers yang benar
                const response = await axios.put(`${API_BASE_URL}/articles/${id}`, formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${global.token}`
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                });
                
                console.log('Update article response:', response.data);
                return response.data;
            } else {
                // Jika tidak ada file, kirim sebagai JSON biasa
                const response = await axios.put(`${API_BASE_URL}/articles/${id}`, articleData, {
                    headers: {
                        'Authorization': `Bearer ${global.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Update article response:', response.data);
                return response.data;
            }
        } catch (error) {
            console.error('Error updating article:', error);
            
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
            }
            
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete article
    deleteArticle: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/articles/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get all article categories
    getAllCategories: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/articles/categories`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get category by ID
    getCategoryById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/articles/categories/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new category
    createCategory: async (categoryData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/articles/categories`, categoryData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update category
    updateCategory: async (id, categoryData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/articles/categories/${id}`, categoryData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete category
    deleteCategory: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/articles/categories/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

const articleCategoriesAPI = {
    // Get all article categories with pagination
    getAllCategories: async (page = 1, limit = 10, search = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/articles/categories${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/articles/categories${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.categories?.length || 0} article categories from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get category by ID
    getCategoryById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/articles/categories/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new category
    createCategory: async (categoryData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/articles/categories`, categoryData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update category
    updateCategory: async (id, categoryData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/articles/categories/${id}`, categoryData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete category
    deleteCategory: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/articles/categories/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

const organizationStructureAPI = {
    // Get all organization structures with pagination
    getAllStructures: async (page = 1, limit = 10, search = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/organization/structure${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/organization/structure${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.structures?.length || 0} structures from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get active organization structures
    getActiveStructures: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/organization/structure/active`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.structures?.length || 0} active structures from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },

    
    // Get organization structure by ID
    getStructureById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/organization/structure/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new organization structure
    createStructure: async (formData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/organization/structure`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update organization structure
    updateStructure: async (id, formData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/organization/structure/${id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete organization structure
    deleteStructure: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/organization/structure/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

// Organization Benefits API calls
const benefitsAPI = {
    // Get all benefits with pagination
    getAllBenefits: async (page = 1, limit = 10, search = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/benefits${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/benefits${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.benefits?.length || 0} benefits from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get benefit by ID
    getBenefitById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/benefits/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new benefit
    createBenefit: async (benefitData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/benefits`, benefitData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update benefit
    updateBenefit: async (id, benefitData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/benefits/${id}`, benefitData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete benefit
    deleteBenefit: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/benefits/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

// Testimonial API calls
const testimonialsAPI = {
    // Get all testimonials with pagination
    getAllTestimonials: async (page = 1, limit = 10, search = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/testimonials${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/testimonials${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.testimonials?.length || 0} testimonials from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get testimonial by ID
    getTestimonialById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/testimonials/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new testimonial
    createTestimonial: async (formData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/testimonials`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update testimonial
    updateTestimonial: async (id, formData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/testimonials/${id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete testimonial
    deleteTestimonial: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/testimonials/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

// Vision Mission API calls
const visionMissionAPI = {
    // Get all vision mission items
    getAllItems: async (page = 1, limit = 10, search = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/vision-mission${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/vision-mission${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get item by ID
    getItemById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/vision-mission/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new item
    createItem: async (itemData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/vision-mission`, itemData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update item
    updateItem: async (id, itemData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/vision-mission/${id}`, itemData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete item
    deleteItem: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/vision-mission/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

// Kontak API calls
const contactsAPI = {
    // Get all contacts with pagination
    getAllContacts: async (page = 1, limit = 10, search = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/contacts${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/contacts${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.contacts?.length || 0} contacts from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get contact by ID
    getContactById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/contacts/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new contact
    createContact: async (contactData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/contacts`, contactData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update contact
    updateContact: async (id, contactData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/contacts/${id}`, contactData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete contact
    deleteContact: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/contacts/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

// Organization History API calls
const organizationHistoryAPI = {
    // Get all organization history entries with pagination
    getAllHistory: async (page = 1, limit = 10, search = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/organization-history${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/organization-history${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.histories?.length || 0} organization history entries from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get organization history entry by ID
    getHistoryById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/organization-history/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new organization history entry
    createHistory: async (formData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/organization-history`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update organization history entry
    updateHistory: async (id, formData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/organization-history/${id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete organization history entry
    deleteHistory: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/organization-history/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update organization history without image
    updateHistoryWithoutImage: async (id, historyData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/organization-history/${id}`, historyData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
     }
};

const examsAPI = {
    // Get all exams with pagination
    getAllExams: async (page = 1, limit = 10, search = '', category = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            if (category) {
                queryParams += `&category_id=${encodeURIComponent(category)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/exams${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/exams${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.exams?.length || 0} exams from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get exam by ID
    getExamById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/exams/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new exam
    createExam: async (formData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/exams`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update exam
    updateExam: async (id, formData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/exams/${id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'multipart/form-data'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete exam
    deleteExam: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/exams/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update exam without document
    updateExamWithoutDocument: async (id, examData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/exams/${id}`, examData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

// Exam Categories API calls
const examCategoriesAPI = {
// Endpoint untuk kategori ujian sebenarnya mengembalikan daftar ujian, 
// jadi kita perlu mengekstrak informasi kategori dari data ujian
getAllCategories: async (page = 1, limit = 10, search = '') => {
    try {
        let queryParams = `?page=${page}&limit=${limit}`;
        
        if (search) {
            queryParams += `&search=${encodeURIComponent(search)}`;
        }
        
        console.log(`Making request to: ${API_BASE_URL}/exams/categories${queryParams}`);
        
        const response = await axios.get(`${API_BASE_URL}/exams/categories${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${global.token}`
            }
        });
        
        console.log(`Received API response from categories endpoint`);
        
        // Karena endpoint mengembalikan daftar ujian, kita perlu mengekstrak kategori unik
        const exams = response.data.exams || [];
        
        // Buat map kategori unik berdasarkan category_id
        const uniqueCategories = new Map();
        
        exams.forEach(exam => {
            if (exam.category_id && !uniqueCategories.has(exam.category_id)) {
                uniqueCategories.set(exam.category_id, {
                    id: exam.category_id,
                    name: exam.category_name || `Kategori ${exam.category_id}`,
                    description: `Kategori untuk ${exam.name}`,
                    created_at: exam.created_at,
                    updated_at: exam.updated_at,
                    exam_count: 0
                });
            }
            
            // Hitung jumlah ujian per kategori
            if (exam.category_id && uniqueCategories.has(exam.category_id)) {
                const category = uniqueCategories.get(exam.category_id);
                category.exam_count++;
            }
        });
        
        // Convert map to array
        const categories = Array.from(uniqueCategories.values());
        
        return {
            categories: categories,
            pagination: response.data.pagination
        };
    } catch (error) {
        console.error('Error in getAllCategories:', error.message);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
        handleApiError(error);
        throw error;
    }
},
    
    // Get category by ID - actually gets exam details with that category ID
    getCategoryById: async (id) => {
        try {
            // Since we don't have a real category endpoint, we'll get exam data and extract category
            const response = await axios.get(`${API_BASE_URL}/exams?category_id=${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            // Extract first exam with matching category ID
            const exams = response.data.exams || [];
            
            if (exams.length > 0) {
                const exam = exams[0];
                
                // Create a category object from the exam
                const category = {
                    id: exam.category_id,
                    name: exam.category_name || `Kategori ${exam.category_id}`,
                    description: `Kategori untuk ujian-ujian ${exam.category_name}`,
                    created_at: exam.created_at,
                    updated_at: exam.updated_at,
                    exam_count: exams.length
                };
                
                return {
                    category: category
                };
            }
            
            // If no exams with that category ID, return empty
            return {
                category: {
                    id: id,
                    name: '',
                    description: ''
                }
            };
        } catch (error) {
            console.error('Error in getCategoryById:', error.message);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            handleApiError(error);
            throw error;
        }
    },
    
    // Create new category
    createCategory: async (categoryData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/exams/categories`, categoryData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Update category
    updateCategory: async (id, categoryData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/exams/categories/${id}`, categoryData, {
                headers: {
                    'Authorization': `Bearer ${global.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Delete category
    deleteCategory: async (id) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/exams/categories/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

// Transactions API calls
const transactionsAPI = {
    // Get all transactions with pagination and filters
    getAllTransactions: async (page = 1, limit = 10, search = '', status = '') => {
        try {
            let queryParams = `?page=${page}&limit=${limit}`;
            
            if (search) {
                queryParams += `&search=${encodeURIComponent(search)}`;
            }
            
            if (status) {
                queryParams += `&status=${encodeURIComponent(status)}`;
            }
            
            console.log(`Making request to: ${API_BASE_URL}/payments/admin/transactions${queryParams}`);
            
            const response = await axios.get(`${API_BASE_URL}/payments/admin/transactions${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            console.log(`Received ${response.data.transactions?.length || 0} transactions from API`);
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get transaction by ID
    getTransactionById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/payments/admin/transactions/${id}`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    },
    
    // Get transaction statistics (for dashboard)
    getTransactionStats: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/payments/admin/transactions/stats`, {
                headers: {
                    'Authorization': `Bearer ${global.token}`
                }
            });
            
            return response.data;
        } catch (error) {
            handleApiError(error);
            throw error;
        }
    }
};

// Fungsi untuk menangani error API
function handleApiError(error) {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('API Error Response:', error.response.status, error.response.data);
        
        // Check if token is invalid or expired
        if (error.response.status === 401) {
            console.error('Unauthorized: Token might be invalid or expired');
        }
    } else if (error.request) {
        // The request was made but no response was received
        console.error('API Error Request:', error.request);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error('API Error Message:', error.message);
    }
}

module.exports = {
  authAPI,
  userAPI,
  adminAPI,
  doctorsAPI,
  dokterMudaAPI,
  medicalFacultiesAPI,
  kurikulumAPI,
  webinarAPI,
  slidersAPI ,
  agendaAPI,
  aboutAPI,
  articlesAPI,
  articleCategoriesAPI,
  organizationStructureAPI,
  benefitsAPI,
  testimonialsAPI,
  visionMissionAPI,
  contactsAPI,
  organizationHistoryAPI,
  examsAPI,
  examCategoriesAPI,
  transactionsAPI
};