const prisma = require('../lib/prisma');

const loggerMiddleware = async (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', async () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      try {
        await prisma.systemLog.create({
          data: {
            level: res.statusCode >= 500 ? 'error' : 'warn',
            message: `${req.method} ${req.originalUrl} - ${res.statusCode}`,
            metadata: JSON.stringify({ duration, ip: req.ip }),
            user_id: req.userId || null,
          },
        });
      } catch (e) {
        // Silently fail logging
      }
    }
  });

  next();
};

module.exports = { loggerMiddleware };
