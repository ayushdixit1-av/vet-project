const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/auth');

router.post('/submit', verifyToken, reviewController.submitReview);
router.get('/', reviewController.getReviews);
router.get('/user', verifyToken, reviewController.getUserReview);

module.exports = router;
