const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.post('/grant', verifyToken, isAdmin, paymentController.grantCourse);
router.post('/create-order', verifyToken, paymentController.createOrder);
router.post('/verify', verifyToken, paymentController.verifyPayment);
router.get('/user-purchases', verifyToken, paymentController.getUserPurchases);
router.post('/webhook', paymentController.webhook);

module.exports = router;
