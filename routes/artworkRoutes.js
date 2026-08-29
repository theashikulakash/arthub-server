const express = require('express');
const router = express.Router();
const { verifyJWT, requireRole } = require('../middleware/auth');
const {
  getArtworks,
  getFeaturedArtworks,
  getArtworkById,
  getMyArtworks,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  getAllArtworksAdmin,
} = require('../controllers/artworkController');
const { getComments, addComment } = require('../controllers/commentController');

// Public
router.get('/', getArtworks);
router.get('/featured', getFeaturedArtworks);

// Artist-only (must come before /:id to avoid route collisions)
router.get('/mine', verifyJWT, requireRole('artist'), getMyArtworks);
router.post('/', verifyJWT, requireRole('artist'), createArtwork);

// Admin-only
router.get('/admin/all', verifyJWT, requireRole('admin'), getAllArtworksAdmin);

// Public detail
router.get('/:id', getArtworkById);

// Owning artist / admin
router.put('/:id', verifyJWT, requireRole('artist'), updateArtwork);
router.delete('/:id', verifyJWT, requireRole('artist', 'admin'), deleteArtwork);

// Comments (nested under artwork)
router.get('/:id/comments', getComments);
router.post('/:id/comments', verifyJWT, addComment);

module.exports = router;
