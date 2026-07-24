import { useState } from 'react';
import { useApp } from '../store';
import { recognizeFood } from '../lib/llm';
import type { FoodItem } from '../types';
import { uid, today } from '../lib/storage';
import { Card, PageTitle, Spinner } from '../components/ui';

function compress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1024;
        let w = img.width;
        let h = img.height;
        if (w > h && w > max) {
          h = Math.round((h * max) / w);
          w = max;
        } else if (h > max) {
          w = Math.round((w * max) / h);
          h = max;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas 不可用'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

export default function PhotoPage() {
  const { settings, addFoodLog } = useApp();
  const [preview, setPreview] = useState('');
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [done, setDone] = useState(false);

  const onFile = async (file: File) => {
    setNotice('');
    setDone(false);
    setItems([]);
    try {
      const dataUrl = await compress(file);
      setPreview(dataUrl);
      setLoading(true);
      const result = await recognizeFood(settings, dataUrl);
      if (result.length === 0) {
        setNotice('未识别到食物,可手动添加一行');
      }
      setItems(result);
    } catch (e) {
      setNotice('识别失败:' + (e as Error).message + ' — 可手动添加');
    } finally {
      setLoading(false);
    }
  };

  const updItem = (i: number, k: keyof FoodItem, v: string) => {
    setItems((prev) =>
      prev.map((it, idx) =>
        idx === i ? { ...it, [k]: k === 'food' || k === 'portion' ? v : Number(v) } : it,
      ),
    );
  };
  const addRow = () =>
    setItems((prev) => [...prev, { food: '', portion: '', kcal: 0, protein: 0, carb: 0, fat: 0 }]);
  const removeRow = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const totalKcal = items.reduce((s, it) => s + (it.kcal || 0), 0);

  const record = () => {
    if (items.length === 0) return;
    addFoodLog({ id: uid(), date: today(), items, totalKcal });
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <PageTitle title="拍照识别热量" desc="上传一张食物照片,AI 估算食物与热量(结果可修正)" />

      <Card className="mb-4">
        <label className="block">
          <span className="btn-primary inline-block cursor-pointer">📷 选择 / 拍摄食物照片</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </label>
        {preview && (
          <img src={preview} alt="预览" className="mt-3 max-h-56 rounded-lg border border-gray-200" />
        )}
        {loading && (
          <div className="mt-3">
            <Spinner label="AI 正在识别食物..." />
          </div>
        )}
      </Card>

      {notice && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          {notice}
        </p>
      )}

      {(items.length > 0 || preview) && !loading && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">识别结果(可编辑)</h3>
            <span className="text-sm text-gray-500">
              合计 <b className="text-brand-dark">{totalKcal}</b> kcal
            </span>
          </div>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className="input flex-1" value={it.food} placeholder="食物名"
                  onChange={(e) => updItem(i, 'food', e.target.value)} />
                <input className="input w-20" value={it.portion} placeholder="份量"
                  onChange={(e) => updItem(i, 'portion', e.target.value)} />
                <input className="input w-24" type="number" value={it.kcal}
                  onChange={(e) => updItem(i, 'kcal', e.target.value)} />
                <span className="text-xs text-gray-400">kcal</span>
                <button onClick={() => removeRow(i)} className="text-gray-400 hover:text-red-500 px-1">✕</button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={addRow} className="text-sm text-brand-dark border border-brand-light rounded-lg px-3 py-1.5">+ 添加一行</button>
            <button onClick={record} disabled={items.length === 0} className="btn-primary">记入今日饮食</button>
            {done && <span className="text-sm text-brand-dark">✓ 已记入今日</span>}
          </div>
        </Card>
      )}
    </div>
  );
}
