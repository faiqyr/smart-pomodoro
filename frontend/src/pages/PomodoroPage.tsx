import { useEffect, useRef, useCallback } from 'react';
import { usePomodoroStore } from '../store/pomodoroStore';
import { pomodoroAPI } from '../services/api';

export default function PomodoroPage() {
  const {
    isRunning, isPaused, timeLeft, totalTime, focusDuration, breakDuration,
    isBreak, sessionsCompleted, dailyTarget,
    setFocusDuration, setBreakDuration, start, pause, resume, stop, tick,
    startBreak, incrementCompleted,
  } = usePomodoroStore();
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleTick = useCallback(() => {
    const { timeLeft, isRunning, isPaused, isBreak } = usePomodoroStore.getState();
    if (!isRunning || isPaused) return;
    if (timeLeft <= 0) {
      if (!isBreak) {
        pomodoroAPI.stop('completed').catch(() => {});
        incrementCompleted();
        try { audioRef.current?.play(); } catch {}
        startBreak();
      } else {
        stop();
      }
      return;
    }
    tick();
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = window.setInterval(handleTick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isPaused, handleTick]);

  const handleStart = async () => {
    try {
      const res = await pomodoroAPI.start({ focus_duration: focusDuration, break_duration: breakDuration });
      start(res.data.data.id);
    } catch (err: any) {
      if (err.response?.data?.message?.includes('already have')) {
        await pomodoroAPI.stop('cancelled');
        const res = await pomodoroAPI.start({ focus_duration: focusDuration, break_duration: breakDuration });
        start(res.data.data.id);
      }
    }
  };

  const handlePause = async () => {
    pause();
    await pomodoroAPI.pause().catch(() => {});
  };

  const handleResume = async () => {
    resume();
    await pomodoroAPI.resume().catch(() => {});
  };

  const handleStop = async () => {
    stop();
    await pomodoroAPI.stop('cancelled').catch(() => {});
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const circumference = 2 * Math.PI * 125;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div>
      <div className="page-header">
        <h2>Pomodoro Timer</h2>
        <p>Stay focused with timed work sessions</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="timer-container">
            <div className="timer-circle">
              <svg width="280" height="280">
                <circle cx="140" cy="140" r="125" fill="none" stroke="var(--border-color)" strokeWidth="8" />
                <circle
                  cx="140" cy="140" r="125" fill="none"
                  stroke={isBreak ? '#00d68f' : '#6c63ff'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="timer-time">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <div className="timer-label">{isBreak ? 'Break Time' : 'Focus Time'}</div>
            </div>

            <div className="timer-controls">
              {!isRunning ? (
                <button className="btn btn-primary btn-lg" onClick={handleStart}>▶ Start Focus</button>
              ) : (
                <>
                  {isPaused ? (
                    <button className="btn btn-success btn-lg" onClick={handleResume}>▶ Resume</button>
                  ) : (
                    <button className="btn btn-ghost btn-lg" onClick={handlePause}>⏸ Pause</button>
                  )}
                  <button className="btn btn-danger btn-lg" onClick={handleStop}>⏹ Stop</button>
                </>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 className="card-title" style={{ marginBottom: 20 }}>⚙️ Timer Settings</h3>
            <div className="form-group">
              <label className="form-label">Focus Duration (min)</label>
              <input
                type="number" className="form-input" value={focusDuration} min={1} max={120}
                onChange={(e) => setFocusDuration(Number(e.target.value))}
                disabled={isRunning}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Break Duration (min)</label>
              <input
                type="number" className="form-input" value={breakDuration} min={1} max={60}
                onChange={(e) => setBreakDuration(Number(e.target.value))}
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 20 }}>📊 Today's Progress</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Sessions Completed</span>
              <span style={{ fontWeight: 700 }}>{sessionsCompleted} / {dailyTarget}</span>
            </div>
            <div style={{ background: 'var(--bg-input)', borderRadius: 8, height: 12, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min((sessionsCompleted / dailyTarget) * 100, 100)}%`,
                height: '100%',
                background: 'var(--gradient-primary)',
                borderRadius: 8,
                transition: 'width 0.5s ease',
              }} />
            </div>
            {sessionsCompleted >= dailyTarget && (
              <div className="alert alert-success" style={{ marginTop: 16 }}>
                🎉 Daily target achieved! Great work!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
