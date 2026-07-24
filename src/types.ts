export type Gender = 'male' | 'female';
export type Goal = 'fatloss' | 'muscle' | 'shape';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'bodyweight' | 'dumbbell' | 'gym';
export type DietPref = 'none' | 'halal' | 'vegetarian';

export interface UserProfile {
  gender: Gender;
  heightCm: number;
  weightKg: number;
  age: number;
  goal: Goal;
  level: Level;
  daysPerWeek: number;
  equipment: Equipment;
  dietPref: DietPref;
  targetCalories?: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  note?: string;
}
export interface WorkoutDay {
  day: number;
  focus: string;
  exercises: Exercise[];
}
export interface WorkoutPlan {
  id: string;
  createdAt: number;
  days: WorkoutDay[];
}

export interface FoodItem {
  food: string;
  portion: string;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
}
export interface Meal {
  name: string;
  items: FoodItem[];
}
export interface DietPlan {
  id: string;
  createdAt: number;
  dailyCalories: number;
  meals: Meal[];
}

export interface CheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  items: string;
  durationMin?: number;
}
export interface FoodLog {
  id: string;
  date: string; // YYYY-MM-DD
  items: FoodItem[];
  totalKcal: number;
}
export interface BodyMetric {
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export interface Settings {
  apiKey: string;
  baseURL: string;
  model: string;
  // 视觉模型(拍照识别专用)。留空则复用上面的文本模型配置。
  // 注意:DeepSeek 无视觉模型,拍照识别需单独配一个支持视觉的模型(如智谱 GLM-4V)。
  visionApiKey?: string;
  visionBaseURL?: string;
  visionModel?: string;
}
