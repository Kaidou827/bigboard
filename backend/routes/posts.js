const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// Get all posts
router.get('/', async (req, res) => {
    try {
        console.log('Fetching all posts...');
        const posts = await Post.find().sort({ createdAt: -1 });
        console.log('Found posts:', posts);
        res.json(posts);
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).json({ message: err.message });
    }
});

// Create a post
router.post('/', async (req, res) => {
    console.log('Received post data:', req.body);
    const post = new Post({
        title: req.body.title,
        content: req.body.content,
        author: req.body.author || 'Anonymous',
        board: req.body.board || 'general'
    });

    try {
        const newPost = await post.save();
        console.log('Created new post:', newPost);
        req.app.get('io').emit('newPost', newPost);
        res.status(201).json(newPost);
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(400).json({ message: err.message });
    }
});

// Update post (for likes/votes)
router.patch('/:id/vote', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.votes = (post.votes || 0) + 1;
        const updatedPost = await post.save();
        req.app.get('io').emit('updatePost', updatedPost);
        res.json(updatedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router; 