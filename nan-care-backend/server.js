require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const appointmentRoutes = require('./routes/appointments');
const departmentRoutes = require('./routes/departments');
const doctorRoutes = require('./routes/doctors');

const app = express();

// --- DB ---
connectDB();

// --- Core middleware ---
app.use(express.json());

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (curl, Postman, server-to-server)
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
  })
);

// Basic rate limiting on the public appointment-booking endpoint to prevent spam
const appointmentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per IP per window
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/appointments', appointmentLimiter);

// --- Routes ---
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Nan Care Hospital backend' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

app.use('/api/appointments', appointmentRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Nan Care backend running on port ${PORT}`);
});
