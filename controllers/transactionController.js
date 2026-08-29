const Transaction = require('../models/Transaction');
const Artwork = require('../models/Artwork');
const User = require('../models/User');

// GET /api/transactions/my-purchases (user)
const getMyPurchases = async (req, res) => {
  try {
    const purchases = await Transaction.find({
      type: 'purchase',
      user: req.user._id,
      status: 'completed',
    }).sort({ createdAt: -1 });
    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch purchase history', error: error.message });
  }
};

// GET /api/transactions/my-bought-artworks (user) — gallery view
const getMyBoughtArtworks = async (req, res) => {
  try {
    const purchases = await Transaction.find({
      type: 'purchase',
      user: req.user._id,
      status: 'completed',
    }).populate('artwork');
    res.status(200).json(purchases.map((p) => p.artwork).filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bought artworks', error: error.message });
  }
};

// GET /api/transactions/my-sales (artist)
const getMySales = async (req, res) => {
  try {
    const sales = await Transaction.find({
      type: 'purchase',
      artist: req.user._id,
      status: 'completed',
    }).sort({ createdAt: -1 });
    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sales history', error: error.message });
  }
};

// GET /api/transactions (admin) — all platform transactions
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
};

// GET /api/transactions/analytics (admin)
const getAnalytics = async (req, res) => {
  try {
    const [totalUsers, totalArtists, totalArtworksSold, revenueAgg, byCategory] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'artist' }),
      Artwork.countDocuments({ isSold: true }),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Artwork.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    ]);

    const salesByMonth = await Transaction.aggregate([
      { $match: { type: 'purchase', status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      totalUsers,
      totalArtists,
      totalArtworksSold,
      totalRevenue: revenueAgg[0]?.total || 0,
      artworksByCategory: byCategory,
      salesByMonth,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};

module.exports = {
  getMyPurchases,
  getMyBoughtArtworks,
  getMySales,
  getAllTransactions,
  getAnalytics,
};
