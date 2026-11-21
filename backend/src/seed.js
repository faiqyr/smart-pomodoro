const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const password_hash = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@pomodoro.com' },
    update: {},
    create: { name: 'Demo User', email: 'demo@pomodoro.com', password_hash },
  });

  await prisma.telegramSettings.upsert({
    where: { user_id: user.id },
    update: {},
    create: { user_id: user.id },
  });

  const tasks = [
    { title: 'Complete project documentation', description: 'Write comprehensive docs', priority: 'high', status: 'in_progress' },
    { title: 'Review pull requests', description: 'Review pending PRs', priority: 'medium', status: 'pending' },
    { title: 'Fix login bug', description: 'Fix auth issue', priority: 'high', status: 'completed' },
    { title: 'Design new dashboard', description: 'Create wireframes', priority: 'low', status: 'pending' },
    { title: 'Database optimization', description: 'Optimize slow queries', priority: 'medium', status: 'in_progress' },
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: { ...task, user_id: user.id, completed_at: task.status === 'completed' ? new Date() : null },
    });
  }

  console.log('✅ Seed data created successfully');
  console.log('📧 Demo login: demo@pomodoro.com / password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
