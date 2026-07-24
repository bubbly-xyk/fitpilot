import { Activity } from 'lucide-react';
import { NAV_ITEMS } from './navConfig';
import type { TabKey } from './navConfig';

export type { TabKey };

export default function Nav({
  tab,
  onChange,
}: {
  tab: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <header className="lg:hidden sticky top-0 z-20 backdrop-blur-lg bg-white/75 border-b border-black/5">
      <div className="px-4">
        <div className="flex items-center gap-2 h-14">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-brand-dark grid place-items-center text-white shadow-pop">
              <Activity size={18} strokeWidth={2.5} />
            </span>
            <span className="font-extrabold text-ink-900 tracking-tight">FitPilot</span>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar ml-auto -mr-1 pr-1">
            {NAV_ITEMS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => onChange(t.key)}
                  aria-label={t.label}
                  aria-current={active ? 'page' : undefined}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 h-9 rounded-full text-sm transition-all duration-150 active:scale-95 ${
                    active
                      ? 'bg-gradient-to-r from-brand to-brand-dark text-white font-semibold shadow-sm'
                      : 'text-ink-500 hover:bg-black/5'
                  }`}
                >
                  <Icon size={16} strokeWidth={2.2} />
                  {active && <span>{t.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
