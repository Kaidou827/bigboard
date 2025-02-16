const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const multer = require('multer');

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
router.post('/', multer().single('image'), async (req, res) => {
    try {
        let imageUrl = null;
        
        if (req.file) {
            // Upload to Cloudinary
            const stream = cloudinary.uploader.upload_stream(
                { folder: "bigboard" },
                (error, result) => {
                    if (error) throw error;
                    imageUrl = result.secure_url;
                }
            );

            Readable.from(req.file.buffer).pipe(stream);
        }

        const post = new Post({
            title: req.body.title,
            content: req.body.content,
            author: req.body.author || 'Anonymous',
            board: req.body.board || 'general',
            image: imageUrl
        });

        const newPost = await post.save();
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

// Get single post
router.get('/:id', async (req, res) => {
    try {
        console.log('Fetching post with ID:', req.params.id);
        
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.log('Invalid post ID format');
            return res.status(400).json({ message: 'Invalid post ID format' });
        }
        
        const post = await Post.findById(req.params.id);
        console.log('Found post:', post);
        
        if (!post) {
            console.log('Post not found');
            return res.status(404).json({ message: 'Post not found' });
        }
        
        res.json(post);
    } catch (err) {
        console.error('Error fetching post:', err);
        res.status(500).json({ message: err.message });
    }
});

// Add reply to post
router.post('/:id/reply', async (req, res) => {
    try {
        console.log('Adding reply to post:', req.params.id);
        console.log('Reply data:', req.body);

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.replies.push({
            content: req.body.content,
            author: req.body.author || 'Anonymous'
        });

        const updatedPost = await post.save();
        console.log('Updated post with reply:', updatedPost);
        
        // Emit socket event for real-time updates
        req.app.get('io').emit('postUpdated', updatedPost);
        res.status(201).json(updatedPost);
    } catch (err) {
        console.error('Error adding reply:', err);
        res.status(400).json({ message: err.message });
    }
});

module.exports = router; 