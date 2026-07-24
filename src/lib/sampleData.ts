import type { WorkoutPlan, DietPlan, WorkoutDay } from '../types';
import { uid } from './storage';

const TEMPLATE_DAYS: WorkoutDay[] = [
  {
    day: 1,
    focus: '胸 + 三头',
    exercises: [
      { name: '哑铃卧推', sets: 4, reps: '8-12', restSec: 90, note: '肩胛收紧,下放至胸侧' },
      { name: '上斜哑铃推举', sets: 3, reps: '10-12', restSec: 90, note: '30度上斜,控制离心' },
      { name: '俯卧撑', sets: 3, reps: '力竭', restSec: 60, note: '身体成一条直线' },
      { name: '哑铃臂屈伸', sets: 3, reps: '12-15', restSec: 60, note: '大臂固定,只动小臂' },
    ],
  },
  {
    day: 2,
    focus: '背 + 二头',
    exercises: [
      { name: '哑铃划船', sets: 4, reps: '8-12', restSec: 90, note: '背部发力,肘部贴身' },
      { name: '俯身飞鸟', sets: 3, reps: '12-15', restSec: 60, note: '感受后背夹紧' },
      { name: '哑铃弯举', sets: 3, reps: '10-12', restSec: 60, note: '肘部固定不晃动' },
    ],
  },
  {
    day: 3,
    focus: '腿 + 核心',
    exercises: [
      { name: '高脚杯深蹲', sets: 4, reps: '10-15', restSec: 90, note: '蹲到大腿平行地面' },
      { name: '哑铃箭步蹲', sets: 3, reps: '每侧12', restSec: 90, note: '膝盖不超过脚尖' },
      { name: '臀桥', sets: 3, reps: '15-20', restSec: 60, note: '顶峰收紧臀部' },
      { name: '平板支撑', sets: 3, reps: '45秒', restSec: 45, note: '核心收紧不塌腰' },
    ],
  },
  {
    day: 4,
    focus: '肩 + 有氧',
    exercises: [
      { name: '哑铃肩上推举', sets: 4, reps: '8-12', restSec: 90, note: '核心收紧,不借力' },
      { name: '哑铃侧平举', sets: 3, reps: '12-15', restSec: 60, note: '小重量,顶峰停顿' },
      { name: '快走/慢跑', sets: 1, reps: '20分钟', restSec: 0, note: '心率维持中低强度' },
    ],
  },
  {
    day: 5,
    focus: '全身循环',
    exercises: [
      { name: '波比跳', sets: 4, reps: '10', restSec: 60, note: '动作连贯,量力而行' },
      { name: '深蹲跳', sets: 3, reps: '12', restSec: 60, note: '落地缓冲' },
      { name: '登山跑', sets: 3, reps: '30秒', restSec: 45, note: '保持核心稳定' },
    ],
  },
];

/** LLM 失败时的兜底训练计划,保证演示不白屏 */
export function sampleWorkout(days: number): WorkoutPlan {
  const n = Math.min(Math.max(days, 1), TEMPLATE_DAYS.length);
  return {
    id: uid(),
    createdAt: Date.now(),
    days: TEMPLATE_DAYS.slice(0, n).map((d, i) => ({ ...d, day: i + 1 })),
  };
}

/** LLM 失败时的兜底饮食计划 */
export function sampleDiet(target: number): DietPlan {
  return {
    id: uid(),
    createdAt: Date.now(),
    dailyCalories: target,
    meals: [
      {
        name: '早餐',
        items: [
          { food: '燕麦', portion: '50g', kcal: 190, protein: 7, carb: 33, fat: 3 },
          { food: '鸡蛋', portion: '2个', kcal: 140, protein: 12, carb: 1, fat: 10 },
          { food: '牛奶', portion: '250ml', kcal: 130, protein: 8, carb: 12, fat: 5 },
        ],
      },
      {
        name: '午餐',
        items: [
          { food: '糙米饭', portion: '150g', kcal: 170, protein: 4, carb: 36, fat: 1 },
          { food: '鸡胸肉', portion: '150g', kcal: 165, protein: 31, carb: 0, fat: 4 },
          { food: '西兰花', portion: '150g', kcal: 50, protein: 4, carb: 8, fat: 1 },
        ],
      },
      {
        name: '晚餐',
        items: [
          { food: '红薯', portion: '150g', kcal: 130, protein: 2, carb: 30, fat: 0 },
          { food: '三文鱼', portion: '120g', kcal: 220, protein: 24, carb: 0, fat: 14 },
          { food: '生菜沙拉', portion: '1份', kcal: 60, protein: 2, carb: 6, fat: 3 },
        ],
      },
      {
        name: '加餐',
        items: [
          { food: '希腊酸奶', portion: '150g', kcal: 100, protein: 15, carb: 6, fat: 2 },
        ],
      },
    ],
  };
}
