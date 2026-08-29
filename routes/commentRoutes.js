const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const { editComment, deleteComment } = require('../controllers/commentController');

router.patch('/:commentId', verifyJWT, editComment);
router.delete('/:commentId', verifyJWT, deleteComment);

module.exports = router;
