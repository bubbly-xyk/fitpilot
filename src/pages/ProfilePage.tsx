import { useState } from 'react';
import type { ReactNode } from 'react';
import { useApp } from '../store';
import type { UserProfile } from '../types';
import { calcTargetCalories } from '../lib/tdee';
import { Card, PageTitle } from '../components/ui';

const DEFAULT_PROFILE: UserProfile = {
  gender: 'male',
  heightCm: 175,
  weightKg: 75,
  age: 28,
  goal: 'fatloss',
  level: 'beginner',
  daysPerWeek: 4,
  equipment: 'dumbbell',
  dietPref: 'none',
  notes: '',
};

export default function ProfilePage() {
  const { profile, setProfile } = useApp();
  const [form, setForm] = useState<UserProfile>(profile ?? DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);

  function upd<K extends keyof UserProfile>(k: K, v: UserProfile[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  const target = calcTargetCalories(form);

  const save = () => {
    const withTarget = { ...form, targetCalories: target };
    setProfile(withTarget);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="max-w-2xl">
      <PageTitle title="个人资料" desc="填写后即可一键生成专属训练/饮食计划" />
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <Field label="性别">
            <select value={form.gender} onChange={(e) => upd('gender', e.target.value as UserProfile['gender'])} className="input">
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </Field>
          <Field label="年龄">
            <input type="number" value={form.age} onChange={(e) => upd('age', Number(e.target.value))} className="input" />
          </Field>
          <Field label="身高 (cm)">
            <input type="number" value={form.heightCm} onChange={(e) => upd('heightCm', Number(e.target.value))} className="input" />
          </Field>
          <Field label="体重 (kg)">
            <input type="number" value={form.weightKg} onChange={(e) => upd('weightKg', Number(e.target.value))} className="input" />
          </Field>
          <Field label="目标">
            <select value={form.goal} onChange={(e) => upd('goal', e.target.value as UserProfile['goal'])} className="input">
              <option value="fatloss">减脂</option>
              <option value="muscle">增肌</option>
              <option value="shape">塑形</option>
            </select>
          </Field>
          <Field label="健身水平">
            <select value={form.level} onChange={(e) => upd('level', e.target.value as UserProfile['level'])} className="input">
              <option value="beginner">新手</option>
              <option value="intermediate">进阶</option>
              <option value="advanced">高级</option>
            </select>
          </Field>
          <Field label="每周可练天数">
            <select value={form.daysPerWeek} onChange={(e) => upd('daysPerWeek', Number(e.target.value))} className="input">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>{n} 天</option>
              ))}
            </select>
          </Field>
          <Field label="器械条件">
            <select value={form.equipment} onChange={(e) => upd('equipment', e.target.value as UserProfile['equipment'])} className="input">
              <option value="bodyweight">徒手无器械</option>
              <option value="dumbbell">一对哑铃</option>
              <option value="gym">健身房</option>
            </select>
          </Field>
          <Field label="饮食偏好">
            <select value={form.dietPref} onChange={(e) => upd('dietPref', e.target.value as UserProfile['dietPref'])} className="input">
              <option value="none">无特殊偏好</option>
              <option value="halal">清真</option>
              <option value="vegetarian">素食</option>
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <label htmlFor="profile-notes" className="block text-sm font-medium text-gray-600 mb-1">
            其他健身需求 / 备注
          </label>
          <textarea
            id="profile-notes"
            value={form.notes ?? ''}
            onChange={(event) => upd('notes', event.target.value)}
            maxLength={500}
            rows={4}
            placeholder="例如：膝盖不适、只能晨练、希望加强背部、忌口或其他需要 AI 制定计划时考虑的情况"
            className="input resize-y"
          />
          <div className="mt-1 text-right text-xs text-gray-400">
            还可输入 {500 - (form.notes ?? '').length} 字
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button onClick={save} className="btn-primary">保存资料</button>
          {saved && <span className="text-sm text-brand-dark">✓ 已保存</span>}
          <span className="ml-auto text-sm text-gray-500">
            预估每日目标热量 <b className="text-brand-dark text-base">{target}</b> kcal
          </span>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
