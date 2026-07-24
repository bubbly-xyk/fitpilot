import { Activity } from 'lucide-react';
import { NAV_ITEMS } from './navConfig';
import type { TabKey } from './navConfig';

export default function Sidebar({
  tab,
  onChange,
}: {
  tab: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-black/5 bg-white/60 backdrop-blur-xl sticky top-0 h-dvh px-4 py-6">
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-dark grid place-items-center text-white shadow-pop">
          <Activity size={20} strokeWidth={2.5} />
        </span>
        <div className="leading-tight">
          <div className="font-extrabold text-ink-900 tracking-tight">FitPilot</div>
          <div className="text-[11px] text-ink-400">AI 私人健身教练</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              aria-current={active ? 'page' : undefined}
              className={`group relative flex items-center gap-3 px-3 h-11 rounded-xl text-sm transition-all duration-150 active:scale-[.98] ${
                active
                  ? 'bg-brand-bg text-brand-700 font-semibold'
                  : 'text-ink-500 hover:bg-black/[.04] hover:text-ink-900'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-brand" />
              )}
              <Icon size={18} strokeWidth={2.2} />
              {t.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-2 text-[11px] text-ink-400 leading-relaxed">
        数据仅存本地浏览器
        <br />
        Demo · 2026
      </div>
    </aside>
  );
}
