const express = require('express');
const router = express.Router();
const testAttemptController = require('../controllers/testAttemptController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.post('/submit', verifyToken, testAttemptController.submitAttempt);
router.get('/user/:testId', verifyToken, testAttemptController.getUserAttempt);
router.get('/user', verifyToken, testAttemptController.getUserResults);
router.get('/all', verifyToken, isAdmin, testAttemptController.getAllResults);

module.exports = router;