import { useState } from 'react';
import type { ReactNode } from 'react';
import { X, Dumbbell, Target, ListChecks, Lightbulb } from 'lucide-react';
import { EXERCISES, MUSCLE_GROUPS } from '../lib/exercises';
import type { ExerciseGuide, MuscleGroup } from '../lib/exercises';
import { PageTitle } from '../components/ui';

const GROUP_COLORS: Record<MuscleGroup, string> = {
  胸: 'from-rose-400 to-rose-500',
  背: 'from-sky-400 to-sky-500',
  腿: 'from-violet-400 to-violet-500',
  肩: 'from-amber-400 to-amber-500',
  手臂: 'from-teal-400 to-teal-500',
  核心: 'from-emerald-400 to-emerald-500',
  有氧: 'from-orange-400 to-orange-500',
};

const DIFF_COLORS: Record<ExerciseGuide['difficulty'], string> = {
  入门: 'bg-emerald-50 text-emerald-700',
  进阶: 'bg-amber-50 text-amber-700',
  高级: 'bg-rose-50 text-rose-700',
};

export default function ExercisePage() {
  const [filter, setFilter] = useState<MuscleGroup | '全部'>('全部');
  const [active, setActive] = useState<ExerciseGuide | null>(null);

  const list =
    filter === '全部' ? EXERCISES : EXERCISES.filter((e) => e.group === filter);

  return (
    <div>
      <PageTitle title="动作教学库" desc="标准动作要点,练对才有效、才不伤" />

      {/* 分类筛选 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-1">
        <Chip label="全部" active={filter === '全部'} onClick={() => setFilter('全部')} />
        {MUSCLE_GROUPS.map((g) => (
          <Chip key={g} label={g} active={filter === g} onClick={() => setFilter(g)} />
        ))}
      </div>

      {/* 动作卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
        {list.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setActive(ex)}
            className="card text-left hover:shadow-pop transition-shadow duration-200 active:scale-[.98]"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-11 h-11 rounded-xl grid place-items-center text-white bg-gradient-to-br ${GROUP_COLORS[ex.group]} shrink-0`}
              >
                <Dumbbell size={20} strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-ink-900 truncate">{ex.name}</div>
                <div className="text-xs text-ink-400 truncate">{ex.target}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="chip !cursor-default !py-1 !px-2.5 text-xs">{ex.group}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full ${DIFF_COLORS[ex.difficulty]}`}>
                {ex.difficulty}
              </span>
              <span className="text-xs text-ink-400 ml-auto">{ex.equipment}</span>
            </div>
          </button>
        ))}
      </div>

      {/* 详情弹窗 */}
      {active && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <span
                className={`w-12 h-12 rounded-2xl grid place-items-center text-white bg-gradient-to-br ${GROUP_COLORS[active.group]} shrink-0`}
              >
                <Dumbbell size={22} strokeWidth={2.2} />
              </span>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-ink-900">{active.name}</h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-ink-400 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full ${DIFF_COLORS[active.difficulty]}`}>{active.difficulty}</span>
                  <span>· {active.group}</span>
                  <span>· {active.equipment}</span>
                </div>
              </div>
              <button
                onClick={() => setActive(null)}
                aria-label="关闭"
                className="w-9 h-9 grid place-items-center rounded-full hover:bg-black/5 text-ink-400 active:scale-90 transition"
              >
                <X size={20} />
              </button>
            </div>

            <Section icon={<Target size={16} />} title="目标肌群">
              <p className="text-sm text-ink-700">{active.target}</p>
            </Section>

            <Section icon={<ListChecks size={16} />} title="动作步骤">
              <ol className="space-y-2">
                {active.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-ink-700">
                    <span className="w-5 h-5 shrink-0 rounded-full bg-brand-bg text-brand-dark text-xs font-bold grid place-items-center">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </Section>

            <Section icon={<Lightbulb size={16} />} title="要点提示">
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                {active.tips}
              </p>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`chip shrink-0 ${active ? 'chip-active' : ''}`}>
      {label}
    </button>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-ink-700 mb-2">
        <span className="text-brand-dark">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}
