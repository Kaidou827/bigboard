const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            username,
            password: hashedPassword
        });

        const newUser = await user.save();
        
        // Don't send password in response
        const userResponse = {
            _id: newUser._id,
            username: newUser.username,
            createdAt: newUser.createdAt
        };

        res.status(201).json(userResponse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    console.log('Login attempt:', req.body);
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        console.log('Found user:', user);

        if (!user) {
            console.log('User not found');
            return res.status(400).json({ message: 'User not found' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Password valid:', validPassword);

        if (!validPassword) {
            console.log('Invalid password');
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Create a user object without the password
        const userResponse = {
            _id: user._id,
            username: user.username,
            handle: user.handle,
            displayName: user.displayName,
            profilePicture: user.profilePicture
        };

        console.log('Login successful, sending response:', userResponse);
        res.json(userResponse);
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 