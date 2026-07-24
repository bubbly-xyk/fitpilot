import type { UserProfile } from '../types';

/** Mifflin-St Jeor 基础代谢 + 轻度活动系数,再按目标微调,得到每日目标热量 */
export function calcTargetCalories(p: UserProfile): number {
  const bmr =
    10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.gender === 'male' ? 5 : -161);
  const tdee = bmr * 1.375; // 轻度活动
  const adjust = p.goal === 'fatloss' ? -400 : p.goal === 'muscle' ? 300 : 0;
  return Math.round((tdee + adjust) / 10) * 10;
}
