import { useState } from 'react';
import { useApp } from '../store';
import { generateWorkoutPlan } from '../lib/llm';
import { Card, PageTitle, Spinner } from '../components/ui';

export default function WorkoutPage() {
  const { profile, workoutPlan, setWorkoutPlan } = useApp();
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
      const plan = await generateWorkoutPlan(profile);
      setWorkoutPlan(plan);
    } catch (e) {
      setNotice('生成失败：' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageTitle title="训练计划" desc="根据你的目标与水平,一键生成每周训练安排" />

      <div className="mb-4 flex items-center gap-3">
        <button onClick={generate} disabled={loading} className="btn-primary">
          {loading ? '生成中...' : workoutPlan ? '重新生成' : '一键生成训练计划'}
        </button>
        {loading && <Spinner label="AI 教练正在编排..." />}
      </div>
      {notice && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          {notice}
        </p>
      )}

      {!workoutPlan && !loading && (
        <Card className="text-center text-gray-400 py-10">还没有计划,点上方按钮生成 💪</Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2 stagger">
        {workoutPlan?.days.map((d) => (
          <Card key={d.day}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-full bg-brand-bg text-brand-dark font-bold flex items-center justify-center text-sm">
                D{d.day}
              </span>
              <h3 className="font-semibold text-gray-800">{d.focus}</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {d.exercises.map((ex, i) => (
                <div key={i} className="py-2 flex items-start gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{ex.name}</div>
                    {ex.note && <div className="text-xs text-gray-400 mt-0.5">{ex.note}</div>}
                  </div>
                  <div className="text-sm text-gray-600 whitespace-nowrap">
                    {ex.sets} 组 × {ex.reps}
                    <span className="text-gray-400 ml-2">休息 {ex.restSec}s</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
