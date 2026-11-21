const { z } = require('zod');
const prisma = require('../lib/prisma');

const startSchema = z.object({
  focus_duration: z.number().min(1).max(120).optional().default(25),
  break_duration: z.number().min(1).max(60).optional().default(5),
  task_id: z.string().optional().nullable(),
});

const startSession = async (req, res, next) => {
  try {
    const data = startSchema.parse(req.body);

    // Check for active session
    const activeSession = await prisma.pomodoroSession.findFirst({
      where: { user_id: req.userId, session_status: { in: ['active', 'paused'] } },
    });
    if (activeSession) {
      return res.status(400).json({ success: false, message: 'You already have an active session' });
    }

    const session = await prisma.pomodoroSession.create({
      data: {
        user_id: req.userId,
        focus_duration: data.focus_duration,
        break_duration: data.break_duration,
        task_id: data.task_id || null,
        session_status: 'active',
      },
    });
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

const pauseSession = async (req, res, next) => {
  try {
    const session = await prisma.pomodoroSession.findFirst({
      where: { user_id: req.userId, session_status: 'active' },
    });
    if (!session) {
      return res.status(404).json({ success: false, message: 'No active session found' });
    }

    const updated = await prisma.pomodoroSession.update({
      where: { id: session.id },
      data: { session_status: 'paused' },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const resumeSession = async (req, res, next) => {
  try {
    const session = await prisma.pomodoroSession.findFirst({
      where: { user_id: req.userId, session_status: 'paused' },
    });
    if (!session) {
      return res.status(404).json({ success: false, message: 'No paused session found' });
    }

    const updated = await prisma.pomodoroSession.update({
      where: { id: session.id },
      data: { session_status: 'active' },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const stopSession = async (req, res, next) => {
  try {
    const { status } = req.body; // completed or cancelled
    const session = await prisma.pomodoroSession.findFirst({
      where: { user_id: req.userId, session_status: { in: ['active', 'paused'] } },
    });
    if (!session) {
      return res.status(404).json({ success: false, message: 'No active session found' });
    }

    const updated = await prisma.pomodoroSession.update({
      where: { id: session.id },
      data: {
        session_status: status || 'completed',
        end_time: new Date(),
      },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const sessions = await prisma.pomodoroSession.findMany({
      where: { user_id: req.userId },
      orderBy: { start_time: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.pomodoroSession.count({ where: { user_id: req.userId } });
    res.json({ success: true, data: { sessions, total } });
  } catch (error) {
    next(error);
  }
};

const getActiveSession = async (req, res, next) => {
  try {
    const session = await prisma.pomodoroSession.findFirst({
      where: { user_id: req.userId, session_status: { in: ['active', 'paused'] } },
    });
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

module.exports = { startSession, pauseSession, resumeSession, stopSession, getHistory, getActiveSession };
