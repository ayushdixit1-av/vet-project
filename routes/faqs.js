const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', faqController.getFaqs);
router.post('/', verifyToken, isAdmin, faqController.createFaq);
router.put('/:id', verifyToken, isAdmin, faqController.updateFaq);
router.delete('/:id', verifyToken, isAdmin, faqController.deleteFaq);

module.exports = router;
