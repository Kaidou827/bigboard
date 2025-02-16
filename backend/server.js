const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",  // Allow all origins during development
        methods: ["GET", "POST", "PATCH"]
    }
});

// Middleware
app.use(cors({
    origin: "*",  // Allow all origins during development
    methods: ["GET", "POST", "PATCH"]
}));
app.use(express.json());

// Store io instance
app.set('io', io);

// Add this line before mongoose.connect
mongoose.set('strictQuery', false);

// Configure Cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Configure Multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/bigboard', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully');
    // Start server AFTER MongoDB connects
    const PORT = process.env.PORT || 5001;
    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} is busy, trying ${PORT + 1}`);
            httpServer.listen(PORT + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Routes
const usersRouter = require('./routes/users');
const postsRouter = require('./routes/posts');
const boardsRouter = require('./routes/boards');

// API Routes - Put these BEFORE the catch-all route
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/boards', boardsRouter);

// API test endpoint
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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'BigBoard API is running' });
});

// Catch-all route should be LAST
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'BigBoard API is running' });
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('User connected');
    
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
}); 