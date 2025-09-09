import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Import route files
import postsRouter from './routes/posts.js';
import usersRouter from './routes/users.js';
import authMiddleware from './middleware/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);  // Register the users routes

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Protected test route
app.get('/api/protected', authMiddleware, (req, res) => {
    res.json({ message: 'You have access to protected data!', user: req.user });
});

app.get('/', (req, res) => {
  res.send('Welcome to the Mini-LinkedIn API! It is running correctly.');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
