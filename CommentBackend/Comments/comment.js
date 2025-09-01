// comment.js (inside models directory)

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Define schema separately
const commentSchema = new mongoose.Schema({
  user: String,
  message: String,
  likes: { type: Number, default: 0 },
  replies: [mongoose.Schema.Types.Mixed] // avoid circular reference
}, { minimize: false });

const Comment = mongoose.model('Comment', commentSchema);

function insertReply(tree, targetId, newReply) {
  if (tree._id.toString() === targetId) {
    tree.replies.push(newReply);
    return true;
  }
  for (let reply of tree.replies) {
    if (insertReply(reply, targetId, newReply)) return true;
  }
  return false;
}

function deleteNestedReply(tree, targetId) {
  tree.replies = tree.replies.filter(reply => {
    if (reply._id.toString() === targetId) return false;
    deleteNestedReply(reply, targetId);
    return true;
  });
}

function updateLike(tree, id, inc) {
  if (tree._id.toString() === id) {
    tree.likes += inc;
    return true;
  }
  for (let reply of tree.replies) {
    if (updateLike(reply, id, inc)) return true;
  }
  return false;
}

router.get('/comments', async (req, res) => {
  try {
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const comments = await Comment.find().sort({ _id: -1 }).skip(skip).limit(limit);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/new-comment', async (req, res) => {
  const { messageData } = req.body;
  try {
    const newComment = new Comment({
      user: 'super user',
      message: messageData,
      likes: 0,
      replies: []
    });
    const saved = await newComment.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/get-more-data', async (req, res) => {
  const { commentIncrement } = req.body;
  try {
    const moreComments = await Comment.find().sort({ _id: -1 }).skip(commentIncrement).limit(10);
    res.json(moreComments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/new-sub-comment', async (req, res) => {
  const { messageId, messageData } = req.body;
  try {
    const all = await Comment.find();
    for (let comment of all) {
      if (insertReply(comment, messageId, {
        _id: new mongoose.Types.ObjectId(),
        user: 'Super User',
        message: messageData,
        likes: 0,
        replies: []
      })) {
        await comment.save();
        return res.status(200).json(comment);
      }
    }
    res.status(404).json({ error: 'Message not found' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add sub-comment' });
  }
});

router.post('/update-comment', async (req, res) => {
  const { commentId } = req.body;
  try {
    const comment = await Comment.findById(commentId);
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch updated comment' });
  }
});

router.post('/delete-comment', async (req, res) => {
  try {
    await Comment.deleteOne({ _id: req.body.messageId });
    res.send("Deleted");
  } catch (err) {
    res.status(500).json({ error: 'Deletion failed' });
  }
});

router.post('/delete-sub-comments', async (req, res) => {
  const { messageId, subId } = req.body;
  try {
    const all = await Comment.find();
    for (let comment of all) {
      if (comment._id.toString() === messageId || insertReply(comment, messageId, {})) {
        deleteNestedReply(comment, subId);
        await comment.save();
        return res.send("Deleted sub-comment");
      }
    }
    res.status(404).json({ error: 'Parent message not found' });
  } catch (err) {
    res.status(500).json({ error: 'Sub-deletion failed' });
  }
});

router.post('/like-comment', async (req, res) => {
  const { commentId, increment } = req.body;
  try {
    const all = await Comment.find();
    for (let comment of all) {
      if (updateLike(comment, commentId, increment)) {
        await comment.save();
        return res.status(200).json({ success: true });
      }
    }
    res.status(404).json({ error: 'Comment not found' });
  } catch (err) {
    res.status(500).json({ error: 'Like failed' });
  }
});

module.exports = router;
