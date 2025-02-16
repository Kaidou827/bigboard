const express = require('express');
const router = express.Router();
const Board = require('../models/Board');

// Get all boards
router.get('/', async (req, res) => {
    try {
        const boards = await Board.find();
        res.json(boards);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get board by name
router.get('/:name', async (req, res) => {
    try {
        const board = await Board.findOne({ name: req.params.name });
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }
        res.json(board);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a board
router.post('/', async (req, res) => {
    try {
        const board = new Board({
            name: req.body.name,
            description: req.body.description,
            icon: req.body.icon,
            postCount: req.body.postCount || 0
        });
        const newBoard = await board.save();
        res.status(201).json(newBoard);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router; 