const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', pdfController.getAllPdfs);
router.post('/add', verifyToken, isAdmin, pdfController.addPdf);
router.get('/proxy/:id', verifyToken, pdfController.proxyPdf);
router.get('/:id', verifyToken, pdfController.getPdf);
router.get('/section/:sectionId', pdfController.getPdfsBySection);
router.put('/:id', verifyToken, isAdmin, pdfController.updatePdf);
router.delete('/:id', verifyToken, isAdmin, pdfController.deletePdf);

module.exports = router;
