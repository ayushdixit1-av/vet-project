const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/dashboard', verifyToken, isAdmin, analyticsController.getDashboardStats);
router.get('/most-viewed', verifyToken, isAdmin, analyticsController.getMostViewed);
router.get('/recent', verifyToken, isAdmin, analyticsController.getRecentActivity);
router.get('/growth', verifyToken, isAdmin, analyticsController.getContentGrowth);
router.get('/popular-searches', verifyToken, isAdmin, analyticsController.getPopularSearches);

module.exports = router;
