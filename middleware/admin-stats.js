// middleware/admin-stats.js

const { doctorsAPI } = require('../services/api');

// Middleware to fetch global admin statistics for sidebar and navigation
const adminStats = async (req, res, next) => {
    try {
        // Current path for active menu items
        res.locals.path = req.path;
        
        // Only fetch doctor stats for admin routes and logged in admin users
        if (req.path.startsWith('/admin') && req.session && req.session.user && 
            (req.session.user.role === 'admin' || req.session.user.is_admin === 1)) {
            
            try {
                // Get count of doctors pending verification
                const doctorStats = await doctorsAPI.getDoctorStats();
                if (doctorStats && doctorStats.pendingVerificationCount) {
                    res.locals.doctorsPendingCount = doctorStats.pendingVerificationCount;
                }
            } catch (statsErr) {
                console.error('Error fetching doctor stats:', statsErr);
                // Continue even if stats fetch fails
            }
        }
        
        next();
    } catch (err) {
        console.error('Error in admin stats middleware:', err);
        // Continue to the next middleware even if this fails
        next();
    }
};

module.exports = adminStats;