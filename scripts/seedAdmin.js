// Run with: node scripts/seedAdmin.js
// Creates (or resets) the admin account defined in your .env file
require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@arthub.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const hashed = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    existing.password = hashed;
    existing.provider = existing.provider || 'credentials';
    await existing.save();
    console.log(`Admin user updated: ${email}`);
    return existing;
  }

  const created = await User.create({
    name: 'ArtHub Admin',
    email,
    password: hashed,
    role: 'admin',
    provider: 'credentials',
  });

  console.log(`Admin user created: ${email}`);
  return created;
};

module.exports = { seedAdmin };
