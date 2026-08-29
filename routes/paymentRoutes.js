const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/auth');
const {
  createArtworkCheckout,
  createSubscriptionCheckout,
  verifySession,
} = require('../controllers/paymentController');

// Note: the raw-body webhook route is mounted separately in server.js (needs raw body, not JSON-parsed)
router.post('/artwork-checkout', verifyJWT, createArtworkCheckout);
router.post('/subscription-checkout', verifyJWT, createSubscriptionCheckout);
router.get('/verify/:sessionId', verifyJWT, verifySession);

module.exports = router;
