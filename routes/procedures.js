const express = require('express');
const router = express.Router();
const procedureController = require('../controllers/procedureController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', procedureController.getProcedures);
router.get('/search', procedureController.searchProcedures);
router.get('/:slug', procedureController.getProcedureBySlug);
router.post('/', verifyToken, isAdmin, procedureController.createProcedure);
router.put('/:id', verifyToken, isAdmin, procedureController.updateProcedure);
router.delete('/:id', verifyToken, isAdmin, procedureController.deleteProcedure);

module.exports = router;
