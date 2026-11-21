import { useEffect, useState } from 'react';
import { telegramAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { usePomodoroStore } from '../store/pomodoroStore';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { dailyTarget, setDailyTarget } = usePomodoroStore();
  const [telegram, setTelegram] = useState({ bot_token: '', chat_id: '', enabled: false });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    telegramAPI.getSettings().then(res => {
      setTelegram(res.data.data);
    }).catch(() => {});
  }, []);

  const saveTelegram = async () => {
    setSaving(true);
    try {
      await telegramAPI.updateSettings(telegram);
      setMsg('Settings saved successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Failed to save settings'); }
    setSaving(false);
  };

  const testTelegram = async () => {
    setTesting(true);
    try {
      await telegramAPI.test();
      setMsg('Test notification sent!');
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to send test notification');
    }
    setTesting(false);
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Configure your Smart Pomodoro Assistant</p>
      </div>

      {msg && <div className={`alert ${msg.includes('Failed') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}

      <div className="grid-2">
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="settings-section">
              <h3>👤 Profile</h3>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={user?.name || ''} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={user?.email || ''} disabled />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="settings-section">
              <h3>🍅 Pomodoro Settings</h3>
              <div className="form-group">
                <label className="form-label">Daily Session Target</label>
                <input type="number" className="form-input" value={dailyTarget} min={1} max={20}
                  onChange={(e) => setDailyTarget(Number(e.target.value))} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="settings-section">
              <h3>📱 Telegram Notifications</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontSize: 14 }}>Enable Telegram Notifications</span>
                <div
                  className={`toggle ${telegram.enabled ? 'active' : ''}`}
                  onClick={() => setTelegram({ ...telegram, enabled: !telegram.enabled })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bot Token</label>
                <input className="form-input" value={telegram.bot_token} placeholder="Enter your Telegram Bot Token"
                  onChange={(e) => setTelegram({ ...telegram, bot_token: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Chat ID</label>
                <input className="form-input" value={telegram.chat_id} placeholder="Enter your Telegram Chat ID"
                  onChange={(e) => setTelegram({ ...telegram, chat_id: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" onClick={saveTelegram} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
                <button className="btn btn-ghost" onClick={testTelegram} disabled={testing}>
                  {testing ? 'Sending...' : '📤 Test Notification'}
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="settings-section">
              <h3>📹 Vision Detection</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
                The computer vision module uses MediaPipe Face Mesh natively in your browser!
                Drowsiness and focus detection run directly on your device when a Pomodoro session is active.
                Please ensure you have granted camera permissions.
              </p>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <code style={{ color: 'var(--accent-success)', fontSize: 13 }}>
                  ✓ Web Vision Active
                </code>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <button className="btn btn-danger" style={{ width: '100%' }} onClick={logout}>
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
