import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-brand-dark text-sm">
      <span className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      {label}
    </span>
  );
}

export function PageTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-5 animate-fade-up">
      <h1 className="text-2xl font-extrabold text-ink-900 tracking-tight">{title}</h1>
      {desc && <p className="text-sm text-ink-400 mt-1">{desc}</p>}
    </div>
  );
}

export function EmptyState({ icon, text }: { icon?: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center text-ink-400 py-10 gap-2">
      {icon}
      <span className="text-sm">{text}</span>
    </div>
  );
}
