require('dotenv').config();
const express = require('express');
const cors = require('cors');

const morgan = require('morgan');
const connectDB = require('./config/db');

const { seedAdmin } = require('./scripts/seedAdmin');
const { stripeWebhook } = require('./controllers/paymentController');


const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const artworkRoutes = require('./routes/artworkRoutes');
const commentRoutes = require('./routes/commentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);



app.use(morgan('dev'));


app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhook);



// JSON body parser for everything else
app.use(express.json());



// health check (useful to confirm no 404/504 issues on the deployed server)
app.get('/', (req, res) => {
  res.status(200).json({ message: 'ArtHub API is running', status: 'ok' });
});



// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/transactions', transactionRoutes);

// 404 handler for unknown API routes
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// global error handler (prevents unhandled errors from producing raw 500/CORS-less crashes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

module.exports = app;

if (require.main === module) {
  connectDB()
    .then(async () => {
      try {
        await seedAdmin();
      } catch (error) {
        console.error(`Admin seed failed: ${error.message}`);
      }

      app.listen(PORT, () => {
        console.log(`ArtHub server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error(error);
    });
}
