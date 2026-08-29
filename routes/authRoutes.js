const express = require('express');
const router = express.Router();
const { register, login, socialAuth, getMe } = require('../controllers/authController');
const { verifyJWT } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/social', socialAuth);
router.get('/me', verifyJWT, getMe);

module.exports = router;
