const mongoose = require('mongoose');
const Board = require('../models/Board');
require('dotenv').config();

const boards = [
    {
        name: "general",
        description: "General discussions and conversations",
        icon: "fas fa-comments"
    },
    {
        name: "technology",
        description: "Tech news, gadgets, and programming discussions",
        icon: "fas fa-microchip"
    },
    {
        name: "gaming",
        description: "Video games, esports, and gaming culture",
        icon: "fas fa-gamepad"
    },
    {
        name: "movies",
        description: "Film discussions, reviews, and recommendations",
        icon: "fas fa-film"
    },
    {
        name: "music",
        description: "Music discussions, new releases, and recommendations",
        icon: "fas fa-music"
    },
    {
        name: "sports",
        description: "Sports news, games, and athletic discussions",
        icon: "fas fa-basketball-ball"
    }
];

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        try {
            await Board.deleteMany({}); // Clear existing boards
            const createdBoards = await Board.insertMany(boards);
            console.log('Created boards:', createdBoards);
        } catch (error) {
            console.error('Error creating boards:', error);
        }
        
        mongoose.connection.close();
    })
    .catch(err => console.error('MongoDB connection error:', err)); 