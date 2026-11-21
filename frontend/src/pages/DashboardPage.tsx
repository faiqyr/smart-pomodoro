import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { analyticsAPI, taskAPI, pomodoroAPI } from '../services/api';

export default function DashboardPage() {
  const [daily, setDaily] = useState<any>(null);
  const [weekly, setWeekly] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>({ insights: [], stats: {} });
  const [taskCount, setTaskCount] = useState({ total: 0, completed: 0, inProgress: 0 });
  const [sessions, setSessions] = useState({ total: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dailyRes, weeklyRes, insightsRes, tasksRes, sessionRes] = await Promise.all([
        analyticsAPI.getDaily(),
        analyticsAPI.getWeekly(),
        analyticsAPI.getInsights(),
        taskAPI.getAll(),
        pomodoroAPI.getHistory({ limit: 100 }),
      ]);
      setDaily(dailyRes.data.data);
      setWeekly(weeklyRes.data.data.map((d: any) => ({
        ...d,
        day: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
      })));
      setInsights(insightsRes.data.data);
      const tasks = tasksRes.data.data;
      setTaskCount({
        total: tasks.length,
        completed: tasks.filter((t: any) => t.status === 'completed').length,
        inProgress: tasks.filter((t: any) => t.status === 'in_progress').length,
      });
      setSessions({ total: sessionRes.data.data.total || 0 });
    } catch (err) {
      console.error(err);
    }
  };

  const formatMinutes = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of your productivity metrics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{formatMinutes(daily?.total_focus_minutes || 0)}</div>
          <div className="stat-label">Focus Time Today</div>
        </div>
        <div className="stat-card pink">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{taskCount.completed}/{taskCount.total}</div>
          <div className="stat-label">Tasks Completed</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{Math.round(daily?.focus_score || 0)}%</div>
          <div className="stat-label">Focus Score</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">🍅</div>
          <div className="stat-value">{daily?.total_sessions || 0}</div>
          <div className="stat-label">Sessions Today</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Weekly Focus Trend</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="day" stroke="#8888a8" fontSize={12} />
                <YAxis stroke="#8888a8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#16213e', border: '1px solid #2a2a4a', borderRadius: '8px', color: '#e8e8f0' }}
                />
                <Area type="monotone" dataKey="total_focus_minutes" stroke="#6c63ff" fill="url(#focusGrad)" name="Focus (min)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Weekly Sessions</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="day" stroke="#8888a8" fontSize={12} />
                <YAxis stroke="#8888a8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#16213e', border: '1px solid #2a2a4a', borderRadius: '8px', color: '#e8e8f0' }}
                />
                <Bar dataKey="total_sessions" fill="#ff6584" name="Sessions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3 className="card-title">🤖 AI Productivity Coach</h3>
        </div>
        {insights.insights?.map((insight: any, i: number) => (
          <div className="insight-card" key={i}>
            <div className="insight-icon">{insight.icon}</div>
            <div className="insight-message">{insight.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
