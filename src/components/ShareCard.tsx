import { useEffect, useRef, useState } from 'react';
import { X, Download } from 'lucide-react';

export interface ShareStats {
  streak: number;
  weekCount: number;
  totalCheckins: number;
  weightDelta: number | null; // 负=下降
  goalText: string;
}

const MOTIVATIONS = [
  '坚持,是普通人最强的超能力。',
  '你今天流的汗,是明天更好的自己。',
  '自律给你自由。',
  '每一次打卡,都是对自己的兑现。',
];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function ShareCard({ stats, onClose }: { stats: ShareStats; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 背景渐变
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#16a34a');
    bg.addColorStop(0.55, '#059669');
    bg.addColorStop(1, '#0d9488');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 顶部品牌
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.font = '700 44px -apple-system, "Segoe UI", "Noto Sans SC", sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('FitPilot', 80, 90);
    ctx.font = '400 30px "Segoe UI", "Noto Sans SC", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.fillText('AI 私人健身教练 · 我的训练战报', 80, 150);

    // 大数字:连续打卡
    ctx.fillStyle = '#fff';
    ctx.font = '800 220px -apple-system, "Segoe UI", sans-serif';
    ctx.fillText(String(stats.streak), 80, 250);
    ctx.font = '600 46px "Segoe UI", "Noto Sans SC", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillText('天连续打卡 🔥', 80, 500);

    // 统计卡
    const cards: { label: string; value: string }[] = [
      { label: '本周训练', value: `${stats.weekCount} 次` },
      { label: '累计打卡', value: `${stats.totalCheckins} 次` },
      {
        label: '体重变化',
        value:
          stats.weightDelta === null
            ? '—'
            : `${stats.weightDelta > 0 ? '+' : ''}${stats.weightDelta.toFixed(1)} kg`,
      },
    ];
    const cardW = 300;
    const gap = 30;
    const startX = 80;
    const y = 620;
    cards.forEach((c, i) => {
      const x = startX + i * (cardW + gap);
      ctx.fillStyle = 'rgba(255,255,255,.14)';
      roundRect(ctx, x, y, cardW, 220, 28);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '700 64px -apple-system, "Segoe UI", sans-serif';
      ctx.fillText(c.value, x + 32, y + 44);
      ctx.font = '400 32px "Segoe UI", "Noto Sans SC", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.fillText(c.label, x + 32, y + 140);
    });

    // 目标标签
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    roundRect(ctx, 80, 920, 380, 76, 38);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '600 34px "Segoe UI", "Noto Sans SC", sans-serif';
    ctx.fillText('🎯 ' + stats.goalText, 116, 940);

    // 激励语(按 streak 选一句,稳定不随机)
    const quote = MOTIVATIONS[stats.streak % MOTIVATIONS.length];
    ctx.font = '700 48px "Segoe UI", "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(quote, 80, 1080);

    // 底部
    ctx.font = '400 28px "Segoe UI", "Noto Sans SC", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.fillText('由 FitPilot 生成 · 扫码开启你的健身计划', 80, 1240);

    setUrl(canvas.toDataURL('image/png'));
  }, [stats]);

  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-4 max-w-sm w-full animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="font-semibold text-ink-900">训练战报</span>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="w-8 h-8 grid place-items-center rounded-full hover:bg-black/5 text-ink-400 active:scale-90 transition"
          >
            <X size={18} />
          </button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        {url && (
          <img src={url} alt="训练战报" className="w-full rounded-2xl shadow-card" />
        )}
        <a
          href={url}
          download="fitpilot-战报.png"
          className="btn-primary w-full mt-4"
        >
          <Download size={16} /> 保存图片分享
        </a>
      </div>
    </div>
  );
}
