const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');
const pomodoroRoutes = require('./routes/pomodoro.routes');
const visionRoutes = require('./routes/vision.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const telegramRoutes = require('./routes/telegram.routes');
const notificationRoutes = require('./routes/notification.routes');
const { errorHandler } = require('./middlewares/error.middleware');
const { loggerMiddleware } = require('./middlewares/logger.middleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CORS_ORIGIN || '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);
    // Allow requests with no origin (mobile, curl, Vercel health checks)
    if (!origin || allowed.includes(origin) || allowed.includes('*')) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(loggerMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/pomodoro', pomodoroRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Only start the server when running locally (not on Vercel serverless)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Smart Pomodoro API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
