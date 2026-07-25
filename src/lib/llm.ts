import type {
  DietPlan,
  FoodItem,
  UserProfile,
  WorkoutPlan,
} from '../types';
import { apiRequest } from './api';

export function generateWorkoutPlan(
  profile: UserProfile,
): Promise<WorkoutPlan> {
  return apiRequest('/api/v1/ai/workout-plan', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export function generateDietPlan(profile: UserProfile): Promise<DietPlan> {
  return apiRequest('/api/v1/ai/diet-plan', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export function recognizeFood(imageDataUrl: string): Promise<FoodItem[]> {
  return apiRequest('/api/v1/ai/recognize-food', {
    method: 'POST',
    body: JSON.stringify({ imageDataUrl }),
  });
}
