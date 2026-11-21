import { create } from 'zustand';

interface PomodoroState {
  isRunning: boolean;
  isPaused: boolean;
  timeLeft: number;
  totalTime: number;
  focusDuration: number;
  breakDuration: number;
  isBreak: boolean;
  sessionId: string | null;
  sessionsCompleted: number;
  dailyTarget: number;
  setFocusDuration: (min: number) => void;
  setBreakDuration: (min: number) => void;
  setDailyTarget: (n: number) => void;
  start: (sessionId: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  tick: () => void;
  startBreak: () => void;
  incrementCompleted: () => void;
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  timeLeft: 25 * 60,
  totalTime: 25 * 60,
  focusDuration: 25,
  breakDuration: 5,
  isBreak: false,
  sessionId: null,
  sessionsCompleted: 0,
  dailyTarget: 8,

  setFocusDuration: (min) => set({ focusDuration: min, timeLeft: min * 60, totalTime: min * 60 }),
  setBreakDuration: (min) => set({ breakDuration: min }),
  setDailyTarget: (n) => set({ dailyTarget: n }),

  start: (sessionId) => set({
    isRunning: true,
    isPaused: false,
    sessionId,
    timeLeft: get().focusDuration * 60,
    totalTime: get().focusDuration * 60,
    isBreak: false,
  }),

  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),

  stop: () => set({
    isRunning: false,
    isPaused: false,
    timeLeft: get().focusDuration * 60,
    totalTime: get().focusDuration * 60,
    isBreak: false,
    sessionId: null,
  }),

  tick: () => {
    const { timeLeft } = get();
    if (timeLeft > 0) {
      set({ timeLeft: timeLeft - 1 });
    }
  },

  startBreak: () => set({
    isBreak: true,
    timeLeft: get().breakDuration * 60,
    totalTime: get().breakDuration * 60,
  }),

  incrementCompleted: () => set((s) => ({ sessionsCompleted: s.sessionsCompleted + 1 })),
}));
