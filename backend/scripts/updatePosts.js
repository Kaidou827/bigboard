const mongoose = require('mongoose');
const Post = require('../models/Post');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        try {
            const result = await Post.updateMany(
                { board: { $exists: false } },
                { $set: { board: 'general' } }
            );
            console.log('Updated posts:', result);
        } catch (error) {
            console.error('Error updating posts:', error);
        }
        mongoose.connection.close();
    })
    .catch(err => console.error('MongoDB connection error:', err)); 