const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const {
  getAllUsers,
  updateUserRole,
  updateProfile,
  changePassword,
  getTopArtists,
  toggleWishlist,
  getWishlist,
} = require('../controllers/userController');

router.get('/top-artists', getTopArtists); // public
router.get('/', verifyJWT, requireRole('admin'), getAllUsers);
router.patch('/:id/role', verifyJWT, requireRole('admin'), updateUserRole);
router.patch('/profile', verifyJWT, updateProfile);
router.patch('/change-password', verifyJWT, changePassword);
router.get('/wishlist', verifyJWT, getWishlist);
router.post('/wishlist/:artworkId', verifyJWT, toggleWishlist);

module.exports = router;
