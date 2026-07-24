import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  UserProfile,
  Settings,
  WorkoutPlan,
  DietPlan,
  CheckIn,
  FoodLog,
  BodyMetric,
} from './types';
import * as storage from './lib/storage';

const defaultSettings: Settings = {
  apiKey: '',
  baseURL: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  visionApiKey: '',
  visionBaseURL: '',
  visionModel: '',
};

interface AppContextValue {
  profile: UserProfile | null;
  settings: Settings;
  workoutPlan: WorkoutPlan | null;
  dietPlan: DietPlan | null;
  checkIns: CheckIn[];
  foodLogs: FoodLog[];
  bodyMetrics: BodyMetric[];
  setProfile: (p: UserProfile) => void;
  setSettings: (s: Settings) => void;
  setWorkoutPlan: (w: WorkoutPlan) => void;
  setDietPlan: (d: DietPlan) => void;
  addCheckIn: (c: CheckIn) => void;
  addFoodLog: (f: FoodLog) => void;
  addBodyMetric: (b: BodyMetric) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(() =>
    storage.get<UserProfile>('profile'),
  );
  const [settings, setSettingsState] = useState<Settings>(
    () => storage.get<Settings>('settings') ?? defaultSettings,
  );
  const [workoutPlan, setWorkoutPlanState] = useState<WorkoutPlan | null>(() =>
    storage.get<WorkoutPlan>('workoutPlan'),
  );
  const [dietPlan, setDietPlanState] = useState<DietPlan | null>(() =>
    storage.get<DietPlan>('dietPlan'),
  );
  const [checkIns, setCheckIns] = useState<CheckIn[]>(
    () => storage.get<CheckIn[]>('checkIns') ?? [],
  );
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>(
    () => storage.get<FoodLog[]>('foodLogs') ?? [],
  );
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>(
    () => storage.get<BodyMetric[]>('bodyMetrics') ?? [],
  );

  const setProfile = (p: UserProfile) => {
    setProfileState(p);
    storage.set('profile', p);
  };
  const setSettings = (s: Settings) => {
    setSettingsState(s);
    storage.set('settings', s);
  };
  const setWorkoutPlan = (w: WorkoutPlan) => {
    setWorkoutPlanState(w);
    storage.set('workoutPlan', w);
  };
  const setDietPlan = (d: DietPlan) => {
    setDietPlanState(d);
    storage.set('dietPlan', d);
  };
  const addCheckIn = (c: CheckIn) => {
    setCheckIns((prev) => {
      const next = [...prev.filter((x) => x.date !== c.date), c].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      storage.set('checkIns', next);
      return next;
    });
  };
  const addFoodLog = (f: FoodLog) => {
    setFoodLogs((prev) => {
      const next = [...prev, f];
      storage.set('foodLogs', next);
      return next;
    });
  };
  const addBodyMetric = (b: BodyMetric) => {
    setBodyMetrics((prev) => {
      const next = [...prev.filter((x) => x.date !== b.date), b].sort((a, c) =>
        a.date.localeCompare(c.date),
      );
      storage.set('bodyMetrics', next);
      return next;
    });
  };

  const value: AppContextValue = {
    profile,
    settings,
    workoutPlan,
    dietPlan,
    checkIns,
    foodLogs,
    bodyMetrics,
    setProfile,
    setSettings,
    setWorkoutPlan,
    setDietPlan,
    addCheckIn,
    addFoodLog,
    addBodyMetric,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
