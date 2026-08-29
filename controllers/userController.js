const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Artwork = require('../models/Artwork');

// GET /api/users  (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// PATCH /api/users/:id/role  (admin only)
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'artist', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update role', error: error.message });
  }
};

// PATCH /api/users/profile  (self)
const updateProfile = async (req, res) => {
  try {
    const { name, photoURL } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(name && { name }), ...(photoURL && { photoURL }) },
      { new: true }
    ).select('-password');
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// PATCH /api/users/change-password (self)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.password) {
      return res.status(400).json({ message: 'Password change not available for social login accounts' });
    }
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
};

// GET /api/users/top-artists
const getTopArtists = async (req, res) => {
  try {
    const topArtists = await Artwork.aggregate([
      { $group: { _id: '$artist', totalSales: { $sum: '$salesCount' }, artistName: { $first: '$artistName' } } },
      { $sort: { totalSales: -1 } },
      { $limit: 3 },
    ]);

    const populated = await Promise.all(
      topArtists.map(async (a) => {
        const artistUser = await User.findById(a._id).select('name photoURL');
        return {
          _id: a._id,
          name: artistUser?.name || a.artistName,
          photoURL: artistUser?.photoURL || '',
          totalSales: a.totalSales,
        };
      })
    );

    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch top artists', error: error.message });
  }
};

// POST /api/users/wishlist/:artworkId (self)
const toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const artworkId = req.params.artworkId;
    const idx = user.wishlist.findIndex((id) => id.toString() === artworkId);

    if (idx > -1) {
      user.wishlist.splice(idx, 1);
    } else {
      user.wishlist.push(artworkId);
    }
    await user.save();
    res.status(200).json({ wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update wishlist', error: error.message });
  }
};

// GET /api/users/wishlist (self)
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.status(200).json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch wishlist', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  updateProfile,
  changePassword,
  getTopArtists,
  toggleWishlist,
  getWishlist,
};
