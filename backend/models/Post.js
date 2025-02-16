const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    author: {
        type: String,
        default: 'Anonymous'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: String,
        default: 'Anonymous'
    },
    board: {
        type: String,
        default: 'general'
    },
    votes: {
        type: Number,
        default: 0
    },
    replies: [replySchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    image: {
        type: String,  // This will store the image URL
        required: false
    }
});

module.exports = mongoose.model('Post', postSchema); 