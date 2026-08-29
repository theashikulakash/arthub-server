const Artwork = require('../models/Artwork');

// GET /api/artworks
// Supports: search, category filter, price range, sort, pagination
const getArtworks = async (req, res) => {
  try {
    const {
      search = '',
      category,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = 1,
      limit = 8,
    } = req.query;

    const query = { isPublished: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artistName: { $regex: search, $options: 'i' } },
      ];
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price-low') sortOption = { price: 1 };
    if (sort === 'price-high') sortOption = { price: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [artworks, total] = await Promise.all([
      Artwork.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Artwork.countDocuments(query),
    ]);

    res.status(200).json({
      artworks,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      totalItems: total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch artworks', error: error.message });
  }
};

// GET /api/artworks/featured
const getFeaturedArtworks = async (req, res) => {
  try {
    const artworks = await Artwork.aggregate([
      { $match: { isPublished: true } },
      { $sample: { size: 6 } },
    ]);
    res.status(200).json(artworks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch featured artworks', error: error.message });
  }
};

// GET /api/artworks/:id
const getArtworkById = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });
    res.status(200).json(artwork);
  } catch (error) {
    res.status(404).json({ message: 'Artwork not found' });
  }
};

// GET /api/artworks/mine (artist)
const getMyArtworks = async (req, res) => {
  try {
    const artworks = await Artwork.find({ artist: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(artworks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your artworks', error: error.message });
  }
};

// POST /api/artworks (artist)
const createArtwork = async (req, res) => {
  try {
    const { title, description, price, category, image } = req.body;
    if (!title || !description || !price || !category || !image) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const artwork = await Artwork.create({
      title,
      description,
      price,
      category,
      image,
      artist: req.user._id,
      artistName: req.user.name,
    });

    res.status(201).json(artwork);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create artwork', error: error.message });
  }
};

// PUT /api/artworks/:id (owning artist only)
const updateArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });

    if (artwork.artist.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own artworks' });
    }
    if (artwork.isSold) {
      return res.status(400).json({ message: 'Cannot edit a sold artwork' });
    }

    const { title, description, price, category, image } = req.body;
    Object.assign(artwork, {
      ...(title && { title }),
      ...(description && { description }),
      ...(price && { price }),
      ...(category && { category }),
      ...(image && { image }),
    });

    await artwork.save();
    res.status(200).json(artwork);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update artwork', error: error.message });
  }
};

// DELETE /api/artworks/:id (owning artist or admin)
const deleteArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });

    const isOwner = artwork.artist.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this artwork' });
    }

    await artwork.deleteOne();
    res.status(200).json({ message: 'Artwork deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete artwork', error: error.message });
  }
};

// GET /api/artworks (admin: all, incl. unpublished) -> reused with query flag
const getAllArtworksAdmin = async (req, res) => {
  try {
    const artworks = await Artwork.find().sort({ createdAt: -1 });
    res.status(200).json(artworks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch artworks', error: error.message });
  }
};

module.exports = {
  getArtworks,
  getFeaturedArtworks,
  getArtworkById,
  getMyArtworks,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  getAllArtworksAdmin,
};
