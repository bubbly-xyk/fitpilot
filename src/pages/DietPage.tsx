import { useState } from 'react';
import { useApp } from '../store';
import { generateDietPlan } from '../lib/llm';
import type { Meal } from '../types';
import { Card, PageTitle, Spinner } from '../components/ui';

function mealTotals(meals: Meal[]) {
  let kcal = 0, protein = 0, carb = 0, fat = 0;
  for (const m of meals) {
    for (const it of m.items) {
      kcal += it.kcal || 0;
      protein += it.protein || 0;
      carb += it.carb || 0;
      fat += it.fat || 0;
    }
  }
  return { kcal, protein, carb, fat };
}

export default function DietPage() {
  const { profile, dietPlan, setDietPlan } = useApp();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const generate = async () => {
    if (!profile) {
      setNotice('请先到「资料」页填写个人信息');
      return;
    }
    setLoading(true);
    setNotice('');
    try {
      const plan = await generateDietPlan(profile);
      setDietPlan(plan);
    } catch (e) {
      setNotice('生成失败：' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const totals = dietPlan ? mealTotals(dietPlan.meals) : null;

  return (
    <div>
      <PageTitle title="饮食计划" desc="按目标热量生成每日餐单与营养搭配" />

      <div className="mb-4 flex items-center gap-3">
        <button onClick={generate} disabled={loading} className="btn-primary">
          {loading ? '生成中...' : dietPlan ? '重新生成' : '一键生成饮食计划'}
        </button>
        {loading && <Spinner label="营养师正在配餐..." />}
      </div>
      {notice && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          {notice}
        </p>
      )}

      {dietPlan && totals && (
        <Card className="mb-4 bg-brand-bg border-brand-light">
          <div className="flex flex-wrap gap-6 text-center">
            <Stat label="每日总热量" value={`${totals.kcal} kcal`} main />
            <Stat label="蛋白质" value={`${Math.round(totals.protein)} g`} />
            <Stat label="碳水" value={`${Math.round(totals.carb)} g`} />
            <Stat label="脂肪" value={`${Math.round(totals.fat)} g`} />
          </div>
        </Card>
      )}

      {!dietPlan && !loading && (
        <Card className="text-center text-gray-400 py-10">还没有餐单,点上方按钮生成 🥗</Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2 stagger">
        {dietPlan?.meals.map((m, mi) => (
          <Card key={mi}>
            <h3 className="font-semibold text-gray-800 mb-2">{m.name}</h3>
            <div className="divide-y divide-gray-100">
              {m.items.map((it, i) => (
                <div key={i} className="py-2 flex items-center gap-3 text-sm">
                  <span className="flex-1 text-gray-800">
                    {it.food} <span className="text-gray-400">· {it.portion}</span>
                  </span>
                  <span className="text-gray-600">{it.kcal} kcal</span>
                  <span className="text-xs text-gray-400 w-28 text-right">
                    蛋{it.protein} 碳{it.carb} 脂{it.fat}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, main }: { label: string; value: string; main?: boolean }) {
  return (
    <div>
      <div className={main ? 'text-2xl font-bold text-brand-dark' : 'text-lg font-semibold text-gray-700'}>
        {value}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
