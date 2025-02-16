const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5001", "https://your-frontend-url.com"],
        methods: ["GET", "POST", "PATCH"]
    }
});

// Middleware
app.use(cors({
    origin: ["http://localhost:5001", "https://your-frontend-url.com"],
    methods: ["GET", "POST", "PATCH"]
}));
app.use(express.json());

// Store io instance
app.set('io', io);

// Add this line before mongoose.connect
mongoose.set('strictQuery', false);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/bigboard', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Routes
const postsRouter = require('./routes/posts');
app.use('/api/posts', postsRouter);

// Add this after your existing routes
app.get('/api/test', async (req, res) => {
    try {
        // Test database connection
        const collections = await mongoose.connection.db.listCollections().toArray();
        res.json({ 
            status: 'success',
            message: 'Connected to MongoDB successfully',
            collections: collections.map(c => c.name)
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            message: 'Database connection error',
            error: error.message
        });
    }
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('User connected');
    
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 