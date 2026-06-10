const express = require('express');
const router = express.Router();
const creditController = require('../controllers/creditController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/packages', creditController.getPackages);
router.get('/my-credits', verifyToken, creditController.getMyCredits);
router.post('/create-order', verifyToken, creditController.createPurchaseOrder);
router.post('/verify', verifyToken, creditController.verifyPurchase);
router.post('/grant', verifyToken, isAdmin, creditController.grantCredits);

module.exports = router;