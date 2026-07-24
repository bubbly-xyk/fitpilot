import { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Share2,
  Flame,
  Dumbbell,
  UtensilsCrossed,
  Scale,
  ArrowRight,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useApp } from '../store';
import { uid, today } from '../lib/storage';
import type { TabKey } from '../components/navConfig';
import { Card, PageTitle } from '../components/ui';
import ShareCard from '../components/ShareCard';
import type { ShareStats } from '../components/ShareCard';

const GOAL_TEXT: Record<string, string> = {
  fatloss: '减脂',
  muscle: '增肌',
  shape: '塑形',
};

function computeStreak(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  const d = new Date();
  for (;;) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    if (set.has(`${y}-${m}-${day}`)) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

function weekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface TipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit?: string;
}
function ChartTip({ active, payload, label, unit }: TipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl bg-ink-900/90 text-white px-3 py-2 shadow-lg text-xs">
      <div className="text-white/60">{label}</div>
      <div className="font-semibold tnum text-sm">
        {payload[0].value}
        {unit}
      </div>
    </div>
  );
}

export default function DashboardPage({ onNavigate }: { onNavigate: (t: TabKey) => void }) {
  const { profile, dietPlan, checkIns, foodLogs, bodyMetrics, addCheckIn, addBodyMetric } = useApp();
  const [items, setItems] = useState('');
  const [duration, setDuration] = useState('');
  const [weight, setWeight] = useState('');
  const [showShare, setShowShare] = useState(false);

  const streak = computeStreak(checkIns.map((c) => c.date));
  const weightData = bodyMetrics.map((b) => ({ date: b.date.slice(5), weight: b.weightKg }));

  const weekMap = new Map<string, number>();
  for (const c of checkIns) weekMap.set(weekLabel(c.date), (weekMap.get(weekLabel(c.date)) ?? 0) + 1);
  const weekData = Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([week, count]) => ({ week, count }));

  const todayKcal = foodLogs.filter((f) => f.date === today()).reduce((s, f) => s + f.totalKcal, 0);
  const targetKcal = profile?.targetCalories ?? dietPlan?.dailyCalories ?? 0;
  const kcalPct = targetKcal ? Math.min(100, Math.round((todayKcal / targetKcal) * 100)) : 0;

  const thisWeek = weekLabel(today());
  const weekCount = checkIns.filter((c) => weekLabel(c.date) === thisWeek).length;
  const weightDelta =
    bodyMetrics.length >= 2
      ? bodyMetrics[bodyMetrics.length - 1].weightKg - bodyMetrics[0].weightKg
      : null;
  const curWeight = bodyMetrics.length ? bodyMetrics[bodyMetrics.length - 1].weightKg : null;

  const shareStats: ShareStats = {
    streak,
    weekCount,
    totalCheckins: checkIns.length,
    weightDelta,
    goalText: profile ? GOAL_TEXT[profile.goal] ?? '保持健康' : '保持健康',
  };

  const checkIn = () => {
    addCheckIn({
      id: uid(),
      date: today(),
      items: items || '训练',
      durationMin: duration ? Number(duration) : undefined,
    });
    if (weight) addBodyMetric({ date: today(), weightKg: Number(weight) });
    setItems('');
    setDuration('');
    setWeight('');
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <PageTitle title="仪表盘" desc="打卡记录你的每一次训练,见证进步" />
        <button
          onClick={() => setShowShare(true)}
          disabled={checkIns.length === 0}
          className="btn-ghost shrink-0 mt-1"
        >
          <Share2 size={16} /> 分享战报
        </button>
      </div>

      {!profile && (
        <Card className="mb-5 flex items-center justify-between gap-3 border-brand-light/60 bg-gradient-to-r from-brand-bg to-white">
          <span className="text-sm text-ink-700">填好资料,解锁专属训练与饮食计划。</span>
          <button onClick={() => onNavigate('profile')} className="btn-primary">
            去填资料 <ArrowRight size={16} />
          </button>
        </Card>
      )}

      {/* KPI 卡片行 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 stagger">
        <StatCard
          icon={<Flame size={18} />}
          tint="bg-orange-50 text-orange-500"
          value={String(streak)}
          unit="天"
          label="连续打卡"
        />
        <StatCard
          icon={<Dumbbell size={18} />}
          tint="bg-sky-50 text-sky-500"
          value={String(weekCount)}
          unit="次"
          label="本周训练"
        />
        <StatCard
          icon={<UtensilsCrossed size={18} />}
          tint="bg-emerald-50 text-emerald-500"
          value={String(todayKcal)}
          unit={targetKcal ? ` / ${targetKcal}` : ' kcal'}
          label="今日摄入"
          progress={targetKcal ? kcalPct : undefined}
        />
        <StatCard
          icon={<Scale size={18} />}
          tint="bg-violet-50 text-violet-500"
          value={
            weightDelta === null ? '—' : `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)}`
          }
          unit={weightDelta === null ? '' : ' kg'}
          label="体重变化"
          valueClass={
            weightDelta === null
              ? ''
              : weightDelta < 0
                ? 'text-emerald-600'
                : 'text-rose-500'
          }
        />
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <Card>
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-semibold text-ink-900">体重趋势</h3>
            {curWeight !== null && (
              <span className="text-sm text-ink-400">
                当前 <b className="text-ink-900 tnum">{curWeight}</b> kg
              </span>
            )}
          </div>
          {weightData.length === 0 ? (
            <ChartEmpty text="打卡时填入体重,曲线会画在这里" />
          ) : (
            <div style={{ height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightData} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#eef2f0" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} stroke="#9ca3af" dy={6} />
                  <YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} fontSize={11} stroke="#9ca3af" width={38} />
                  <Tooltip content={<ChartTip unit=" kg" />} cursor={{ stroke: '#16a34a', strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    fill="url(#wg)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-semibold text-ink-900">每周训练次数</h3>
            <span className="text-sm text-ink-400">近 6 周</span>
          </div>
          {weekData.length === 0 ? (
            <ChartEmpty text="打卡后,这里按周统计训练次数" />
          ) : (
            <div style={{ height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} margin={{ top: 6, right: 6, bottom: 0, left: -18 }} barCategoryGap="30%">
                  <CartesianGrid vertical={false} stroke="#eef2f0" />
                  <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={11} stroke="#9ca3af" dy={6} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="#9ca3af" width={38} />
                  <Tooltip content={<ChartTip unit=" 次" />} cursor={{ fill: 'rgba(16,163,74,.06)' }} />
                  <Bar dataKey="count" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* 打卡 */}
      <Card>
        <h3 className="font-semibold text-ink-900 mb-3">今日打卡</h3>
        <div className="grid sm:grid-cols-4 gap-2.5">
          <input
            className="input sm:col-span-2"
            placeholder="完成的训练项目(如:胸+三头)"
            value={items}
            onChange={(e) => setItems(e.target.value)}
          />
          <input
            className="input"
            type="number"
            placeholder="时长(分)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
          <input
            className="input"
            type="number"
            placeholder="今日体重(kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={checkIn} className="btn-primary">
            <Flame size={16} /> 打卡
          </button>
          <span className="text-xs text-ink-400">同一天重复打卡会更新当天记录。</span>
        </div>
      </Card>

      {showShare && <ShareCard stats={shareStats} onClose={() => setShowShare(false)} />}
    </div>
  );
}

function StatCard({
  icon,
  tint,
  value,
  unit,
  label,
  progress,
  valueClass = '',
}: {
  icon: ReactNode;
  tint: string;
  value: string;
  unit?: string;
  label: string;
  progress?: number;
  valueClass?: string;
}) {
  return (
    <div className="card !p-4">
      <div className={`w-9 h-9 rounded-xl grid place-items-center ${tint}`}>{icon}</div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className={`text-2xl font-extrabold tnum ${valueClass || 'text-ink-900'}`}>{value}</span>
        {unit && <span className="text-sm text-ink-400 tnum">{unit}</span>}
      </div>
      <div className="text-xs text-ink-400 mt-0.5">{label}</div>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 bg-black/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand to-brand-dark rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="grid place-items-center text-center text-ink-400 text-sm" style={{ height: 210 }}>
      {text}
    </div>
  );
}
