const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const {
  getMyPurchases,
  getMyBoughtArtworks,
  getMySales,
  getAllTransactions,
  getAnalytics,
} = require('../controllers/transactionController');

router.get('/my-purchases', verifyJWT, requireRole('user'), getMyPurchases);
router.get('/my-bought-artworks', verifyJWT, requireRole('user'), getMyBoughtArtworks);
router.get('/my-sales', verifyJWT, requireRole('artist'), getMySales);
router.get('/analytics', verifyJWT, requireRole('admin'), getAnalytics);
router.get('/', verifyJWT, requireRole('admin'), getAllTransactions);

module.exports = router;
