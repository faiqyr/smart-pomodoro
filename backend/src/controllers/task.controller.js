const { z } = require('zod');
const prisma = require('../lib/prisma');

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
});

const getTasks = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const where = { user_id: req.userId };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const task = await prisma.task.create({
      data: { ...data, user_id: req.userId },
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateTaskSchema.parse(req.body);

    const existing = await prisma.task.findFirst({ where: { id, user_id: req.userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Set completed_at when status changes to completed
    if (data.status === 'completed' && existing.status !== 'completed') {
      data.completed_at = new Date();
    }

    const task = await prisma.task.update({ where: { id }, data });
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.task.findFirst({ where: { id, user_id: req.userId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await prisma.task.delete({ where: { id } });
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
