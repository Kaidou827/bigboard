const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    handle: {
        type: String,
        unique: true,
        sparse: true
    },
    displayName: {
        type: String
    },
    profilePicture: {
        type: String,
        default: 'default-profile.png'
    },
    bio: {
        type: String,
        maxLength: 160
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }]
});

module.exports = mongoose.model('User', userSchema); 