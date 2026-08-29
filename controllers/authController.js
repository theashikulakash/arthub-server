const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, photoURL } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (!['user', 'artist'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either "user" or "artist"' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      photoURL: photoURL || '',
      provider: 'credentials',
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL,
        subscriptionTier: user.subscriptionTier,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL,
        subscriptionTier: user.subscriptionTier,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// POST /api/auth/social
// Called after BetterAuth / Google OAuth succeeds on the client.
// Upserts the user, then issues our own app JWT so the rest of the API stays consistent.
const socialAuth = async (req, res) => {
  try {
    const { name, email, photoURL, role } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required for social login' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name: name || 'ArtHub User',
        email: email.toLowerCase(),
        photoURL: photoURL || '',
        provider: 'google',
        role: role && ['user', 'artist'].includes(role) ? role : 'user',
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL,
        subscriptionTier: user.subscriptionTier,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Social login failed', error: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.status(200).json({ user: req.user });
};

module.exports = { register, login, socialAuth, getMe };
