const { z } = require('zod');
const prisma = require('../lib/prisma');

const updateSchema = z.object({
  bot_token: z.string().optional(),
  chat_id: z.string().optional(),
  enabled: z.boolean().optional(),
});

const getSettings = async (req, res, next) => {
  try {
    let settings = await prisma.telegramSettings.findUnique({ where: { user_id: req.userId } });
    if (!settings) {
      settings = await prisma.telegramSettings.create({ data: { user_id: req.userId } });
    }
    res.json({ success: true, data: settings });
  } catch (error) { next(error); }
};

const updateSettings = async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const settings = await prisma.telegramSettings.upsert({
      where: { user_id: req.userId },
      update: data,
      create: { user_id: req.userId, ...data },
    });
    res.json({ success: true, data: settings });
  } catch (error) { next(error); }
};

const testNotification = async (req, res, next) => {
  try {
    const settings = await prisma.telegramSettings.findUnique({ where: { user_id: req.userId } });
    if (!settings || !settings.bot_token || !settings.chat_id) {
      return res.status(400).json({ success: false, message: 'Telegram not configured' });
    }
    const TelegramBot = require('node-telegram-bot-api');
    const bot = new TelegramBot(settings.bot_token);
    await bot.sendMessage(settings.chat_id, '✅ Smart Pomodoro Assistant connected successfully!');
    res.json({ success: true, message: 'Test notification sent!' });
  } catch (error) { next(error); }
};

module.exports = { getSettings, updateSettings, testNotification };
