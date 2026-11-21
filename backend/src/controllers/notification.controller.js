const prisma = require('../lib/prisma');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.userId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({ where: { user_id: req.userId, read: false } });
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({ where: { id }, data: { read: true } });
    res.json({ success: true });
  } catch (error) { next(error); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { user_id: req.userId, read: false }, data: { read: true } });
    res.json({ success: true });
  } catch (error) { next(error); }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
