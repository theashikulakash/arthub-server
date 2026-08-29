const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ['Painting', 'Digital', 'Sculpture', 'Photography', 'Illustration', 'Other'],
    },
    image: { type: String, required: true }, // imgBB URL
    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    artistName: { type: String, required: true },
    isSold: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    salesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

artworkSchema.index({ title: 'text', artistName: 'text' });

module.exports = mongoose.model('Artwork', artworkSchema);
