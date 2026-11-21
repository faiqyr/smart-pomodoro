const prisma = require('../lib/prisma');

const getDailyAnalytics = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await prisma.pomodoroSession.findMany({
      where: { user_id: req.userId, start_time: { gte: targetDate, lte: endOfDay } },
    });
    const totalTasks = await prisma.task.count({ where: { user_id: req.userId } });
    const completedTasks = await prisma.task.count({
      where: { user_id: req.userId, status: 'completed', completed_at: { gte: targetDate, lte: endOfDay } },
    });
    const drowsinessCount = await prisma.drowsinessEvent.count({
      where: { user_id: req.userId, event_time: { gte: targetDate, lte: endOfDay } },
    });
    const distractionCount = await prisma.focusEvent.count({
      where: { user_id: req.userId, start_time: { gte: targetDate, lte: endOfDay } },
    });

    const totalFocusMin = sessions.filter(s => s.session_status === 'completed').reduce((s, x) => s + x.focus_duration, 0);
    const totalMin = sessions.reduce((s, x) => s + x.focus_duration, 0);
    const focusScore = totalMin > 0 ? (totalFocusMin / totalMin) * 100 : 0;
    const prodScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const drowsyScore = Math.max(0, 100 - drowsinessCount * 10);

    const analytics = await prisma.dailyAnalytics.upsert({
      where: { user_id_date: { user_id: req.userId, date: targetDate } },
      update: { focus_score: Math.round(focusScore * 10) / 10, productivity_score: Math.round(prodScore * 10) / 10, drowsiness_score: Math.round(drowsyScore * 10) / 10, total_focus_minutes: totalFocusMin, total_sessions: sessions.length, tasks_completed: completedTasks, total_tasks: totalTasks, drowsiness_count: drowsinessCount, distraction_count: distractionCount },
      create: { user_id: req.userId, date: targetDate, focus_score: Math.round(focusScore * 10) / 10, productivity_score: Math.round(prodScore * 10) / 10, drowsiness_score: Math.round(drowsyScore * 10) / 10, total_focus_minutes: totalFocusMin, total_sessions: sessions.length, tasks_completed: completedTasks, total_tasks: totalTasks, drowsiness_count: drowsinessCount, distraction_count: distractionCount },
    });

    res.json({ success: true, data: analytics });
  } catch (error) { next(error); }
};

const getWeeklyAnalytics = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(23, 59, 59, 999);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7); weekAgo.setHours(0, 0, 0, 0);
    const analytics = await prisma.dailyAnalytics.findMany({
      where: { user_id: req.userId, date: { gte: weekAgo, lte: today } },
      orderBy: { date: 'asc' },
    });
    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekAgo); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0);
      const existing = analytics.find(a => new Date(a.date).toDateString() === d.toDateString());
      result.push(existing || { date: d.toISOString(), focus_score: 0, productivity_score: 0, drowsiness_score: 100, total_focus_minutes: 0, total_sessions: 0, tasks_completed: 0, drowsiness_count: 0, distraction_count: 0 });
    }
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(23, 59, 59, 999);
    const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 30); monthAgo.setHours(0, 0, 0, 0);
    const analytics = await prisma.dailyAnalytics.findMany({
      where: { user_id: req.userId, date: { gte: monthAgo, lte: today } },
      orderBy: { date: 'asc' },
    });
    res.json({ success: true, data: analytics });
  } catch (error) { next(error); }
};

const getProductivityInsights = async (req, res, next) => {
  try {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); weekAgo.setHours(0, 0, 0, 0);
    const sessions = await prisma.pomodoroSession.findMany({ where: { user_id: req.userId, start_time: { gte: weekAgo }, session_status: 'completed' } });
    const drowsinessEvents = await prisma.drowsinessEvent.findMany({ where: { user_id: req.userId, event_time: { gte: weekAgo } } });
    const focusEvents = await prisma.focusEvent.findMany({ where: { user_id: req.userId, start_time: { gte: weekAgo } } });
    const insights = [];
    const hourCounts = {};
    sessions.forEach(s => { const h = new Date(s.start_time).getHours(); hourCounts[h] = (hourCounts[h] || 0) + 1; });
    const bestHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0];
    if (bestHour) insights.push({ type: 'productivity', icon: '⏰', message: `You are most productive around ${bestHour[0]}:00.` });
    const drowsyHours = {};
    drowsinessEvents.forEach(e => { const h = new Date(e.event_time).getHours(); drowsyHours[h] = (drowsyHours[h] || 0) + 1; });
    const worstHour = Object.entries(drowsyHours).sort(([, a], [, b]) => b - a)[0];
    if (worstHour) insights.push({ type: 'drowsiness', icon: '😴', message: `You tend to get drowsy around ${worstHour[0]}:00. Consider taking breaks.` });
    const allCount = await prisma.pomodoroSession.count({ where: { user_id: req.userId, start_time: { gte: weekAgo } } });
    const rate = allCount > 0 ? (sessions.length / allCount) * 100 : 0;
    if (rate < 70) insights.push({ type: 'focus', icon: '🎯', message: `Session completion rate: ${Math.round(rate)}%. Try shorter sessions.` });
    else if (rate > 90) insights.push({ type: 'achievement', icon: '🏆', message: `Great job! ${Math.round(rate)}% completion rate!` });
    if (focusEvents.length > 10) insights.push({ type: 'distraction', icon: '📱', message: 'Frequent distractions detected. Try Do Not Disturb mode.' });
    if (insights.length === 0) insights.push({ type: 'welcome', icon: '👋', message: 'Start a Pomodoro session to get personalized insights!' });
    res.json({ success: true, data: { insights, stats: { totalSessions: allCount, completedSessions: sessions.length, completionRate: Math.round(rate), totalDrowsiness: drowsinessEvents.length, totalDistractions: focusEvents.length } } });
  } catch (error) { next(error); }
};

module.exports = { getDailyAnalytics, getWeeklyAnalytics, getMonthlyAnalytics, getProductivityInsights };
