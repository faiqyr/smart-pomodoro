const { z } = require('zod');
const prisma = require('../lib/prisma');

const drowsinessSchema = z.object({
  eye_closure_duration: z.number().positive(),
  severity: z.enum(['low', 'medium', 'high']),
});

const focusSchema = z.object({
  event_type: z.enum(['LOOKING_AWAY', 'FACE_MISSING', 'LEFT_DESK']),
  duration: z.number().positive().optional(),
});

const reportDrowsiness = async (req, res, next) => {
  try {
    const data = drowsinessSchema.parse(req.body);
    const event = await prisma.drowsinessEvent.create({
      data: { ...data, user_id: req.userId },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        user_id: req.userId,
        type: 'drowsiness',
        message: `🚨 Drowsiness detected! Eye closure: ${data.eye_closure_duration.toFixed(1)}s (${data.severity} severity)`,
      },
    });

    // Send telegram notification if enabled
    try {
      const telegramSettings = await prisma.telegramSettings.findUnique({
        where: { user_id: req.userId },
      });
      if (telegramSettings && telegramSettings.enabled && telegramSettings.bot_token && telegramSettings.chat_id) {
        const TelegramBot = require('node-telegram-bot-api');
        const bot = new TelegramBot(telegramSettings.bot_token);
        const message = `🚨 *Drowsiness Detected*\n\nEye closure duration: ${data.eye_closure_duration.toFixed(1)} seconds\nSeverity: ${data.severity.toUpperCase()}\nTime: ${new Date().toLocaleTimeString()}\n\n💡 Recommendation: Take a short walk or splash cold water on your face.`;
        await bot.sendMessage(telegramSettings.chat_id, message, { parse_mode: 'Markdown' });
      }
    } catch (telegramError) {
      console.error('Telegram notification error:', telegramError.message);
    }

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

const reportFocus = async (req, res, next) => {
  try {
    const data = focusSchema.parse(req.body);
    const event = await prisma.focusEvent.create({
      data: {
        user_id: req.userId,
        event_type: data.event_type,
        duration: data.duration || null,
        end_time: data.duration ? new Date() : null,
      },
    });

    // Create notification for extended distractions
    if (data.duration && data.duration > 60) {
      await prisma.notification.create({
        data: {
          user_id: req.userId,
          type: 'focus_lost',
          message: `⚠️ You were distracted for ${Math.round(data.duration)}s (${data.event_type.replace('_', ' ').toLowerCase()})`,
        },
      });
    }

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

const getDrowsinessEvents = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const where = { user_id: req.userId };
    if (from || to) {
      where.event_time = {};
      if (from) where.event_time.gte = new Date(from);
      if (to) where.event_time.lte = new Date(to);
    }

    const events = await prisma.drowsinessEvent.findMany({
      where,
      orderBy: { event_time: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

const getFocusEvents = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const where = { user_id: req.userId };
    if (from || to) {
      where.start_time = {};
      if (from) where.start_time.gte = new Date(from);
      if (to) where.start_time.lte = new Date(to);
    }

    const events = await prisma.focusEvent.findMany({
      where,
      orderBy: { start_time: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

module.exports = { reportDrowsiness, reportFocus, getDrowsinessEvents, getFocusEvents };
