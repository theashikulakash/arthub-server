const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    artworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
