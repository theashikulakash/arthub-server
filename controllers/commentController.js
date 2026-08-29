const Comment = require('../models/Comment');
const Transaction = require('../models/Transaction');

// GET /api/artworks/:id/comments (public)
const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ artworkId: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
  }
};

// POST /api/artworks/:id/comments (must have purchased the artwork)
const addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    const hasPurchased = await Transaction.findOne({
      type: 'purchase',
      user: req.user._id,
      artwork: req.params.id,
      status: 'completed',
    });

    if (!hasPurchased) {
      return res.status(403).json({ message: 'You can only comment on artworks you have purchased' });
    }

    const newComment = await Comment.create({
      artworkId: req.params.id,
      userId: req.user._id,
      userName: req.user.name,
      comment: comment.trim(),
    });

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

// PATCH /api/comments/:commentId (owner only)
const editComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const existing = await Comment.findById(req.params.commentId);
    if (!existing) return res.status(404).json({ message: 'Comment not found' });

    if (existing.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    existing.comment = comment?.trim() || existing.comment;
    await existing.save();
    res.status(200).json(existing);
  } catch (error) {
    res.status(500).json({ message: 'Failed to edit comment', error: error.message });
  }
};

// DELETE /api/comments/:commentId (owner only)
const deleteComment = async (req, res) => {
  try {
    const existing = await Comment.findById(req.params.commentId);
    if (!existing) return res.status(404).json({ message: 'Comment not found' });

    if (existing.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await existing.deleteOne();
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
};

module.exports = { getComments, addComment, editComment, deleteComment };
