import {
  LayoutDashboard,
  Dumbbell,
  Salad,
  Camera,
  BookOpen,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type TabKey =
  | 'dashboard'
  | 'workout'
  | 'diet'
  | 'photo'
  | 'library'
  | 'profile';

export const NAV_ITEMS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
  { key: 'workout', label: '训练计划', icon: Dumbbell },
  { key: 'diet', label: '饮食计划', icon: Salad },
  { key: 'photo', label: '拍照识别', icon: Camera },
  { key: 'library', label: '动作库', icon: BookOpen },
  { key: 'profile', label: '资料', icon: User },
];
