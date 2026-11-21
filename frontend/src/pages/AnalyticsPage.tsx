import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { analyticsAPI, visionAPI } from '../services/api';

export default function AnalyticsPage() {
  const [tab, setTab] = useState('weekly');
  const [data, setData] = useState<any[]>([]);
  const [drowsiness, setDrowsiness] = useState<any[]>([]);
  const [focus, setFocus] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    try {
      const res = tab === 'weekly' ? await analyticsAPI.getWeekly() : await analyticsAPI.getMonthly();
      setData(res.data.data.map((d: any) => ({
        ...d,
        label: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      })));
      const dRes = await visionAPI.getDrowsinessEvents();
      setDrowsiness(dRes.data.data);
      const fRes = await visionAPI.getFocusEvents();
      setFocus(fRes.data.data);
    } catch (err) { console.error(err); }
  };

  const COLORS = ['#6c63ff', '#ff6584', '#00d68f', '#ffaa00'];

  const severityData = [
    { name: 'Low', value: drowsiness.filter(d => d.severity === 'low').length || 0 },
    { name: 'Medium', value: drowsiness.filter(d => d.severity === 'medium').length || 0 },
    { name: 'High', value: drowsiness.filter(d => d.severity === 'high').length || 0 },
  ].filter(d => d.value > 0);

  const focusTypeData = [
    { name: 'Looking Away', value: focus.filter(f => f.event_type === 'LOOKING_AWAY').length || 0 },
    { name: 'Face Missing', value: focus.filter(f => f.event_type === 'FACE_MISSING').length || 0 },
    { name: 'Left Desk', value: focus.filter(f => f.event_type === 'LEFT_DESK').length || 0 },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="page-header">
        <h2>Analytics</h2>
        <p>Detailed productivity analytics and trends</p>
      </div>

      <div className="tabs" style={{ display: 'inline-flex' }}>
        <button className={`tab ${tab === 'weekly' ? 'active' : ''}`} onClick={() => setTab('weekly')}>Weekly</button>
        <button className={`tab ${tab === 'monthly' ? 'active' : ''}`} onClick={() => setTab('monthly')}>Monthly</button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card purple">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{data.length > 0 ? Math.round(data.reduce((s, d) => s + (d.focus_score || 0), 0) / data.length) : 0}%</div>
          <div className="stat-label">Avg Focus Score</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{data.reduce((s, d) => s + (d.tasks_completed || 0), 0)}</div>
          <div className="stat-label">Tasks Completed</div>
        </div>
        <div className="stat-card pink">
          <div className="stat-icon">😴</div>
          <div className="stat-value">{drowsiness.length}</div>
          <div className="stat-label">Drowsiness Events</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{focus.length}</div>
          <div className="stat-label">Distractions</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20 }}>Focus Score Trend</h3>
          <div className="chart-container">
            <ResponsiveContainer>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="label" stroke="#8888a8" fontSize={11} />
                <YAxis stroke="#8888a8" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e8e8f0' }} />
                <Area type="monotone" dataKey="focus_score" stroke="#6c63ff" fill="url(#g1)" name="Focus %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20 }}>Productivity Score Trend</h3>
          <div className="chart-container">
            <ResponsiveContainer>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="label" stroke="#8888a8" fontSize={11} />
                <YAxis stroke="#8888a8" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e8e8f0' }} />
                <Line type="monotone" dataKey="productivity_score" stroke="#00d68f" strokeWidth={2} dot={{ fill: '#00d68f' }} name="Prod %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20 }}>Drowsiness & Distraction</h3>
          <div className="chart-container">
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="label" stroke="#8888a8" fontSize={11} />
                <YAxis stroke="#8888a8" fontSize={11} />
                <Tooltip contentStyle={{ background: '#16213e', border: '1px solid #2a2a4a', borderRadius: 8, color: '#e8e8f0' }} />
                <Bar dataKey="drowsiness_count" fill="#ff6584" name="Drowsiness" radius={[4, 4, 0, 0]} />
                <Bar dataKey="distraction_count" fill="#ffaa00" name="Distractions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20 }}>Event Breakdown</h3>
          <div style={{ display: 'flex', gap: 20 }}>
            {severityData.length > 0 ? (
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Drowsiness Severity</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={severityData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                      {severityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : null}
            {focusTypeData.length > 0 ? (
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Distraction Types</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={focusTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                      {focusTypeData.map((_, i) => <Cell key={i} fill={COLORS[(i + 1) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : null}
            {severityData.length === 0 && focusTypeData.length === 0 && (
              <div className="empty-state" style={{ padding: 40 }}>
                <p>No events recorded yet. Start a session with vision detection enabled.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
