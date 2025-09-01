import express from 'express';
import cors from 'cors';
import postRoutes from './routes/posts.js';
import userRoutes from './routes/users.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

// API Routes
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Mini-LinkedIn API! It is running correctly.');
});

// This line should be after the one you just added
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });
