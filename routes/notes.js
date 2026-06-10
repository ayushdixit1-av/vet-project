const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, noteController.getNotes);
router.get('/public', noteController.getPublicNotes);
router.get('/:id', verifyToken, noteController.getNoteById);
router.post('/', verifyToken, noteController.createNote);
router.put('/:id', verifyToken, noteController.updateNote);
router.delete('/:id', verifyToken, noteController.deleteNote);

module.exports = router;
