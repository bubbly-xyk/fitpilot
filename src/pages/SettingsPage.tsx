import { useState } from 'react';
import type { ReactNode } from 'react';
import { useApp } from '../store';
import type { Settings } from '../types';
import { Card, PageTitle } from '../components/ui';

const TEXT_PRESETS: { label: string; baseURL: string; model: string }[] = [
  { label: 'DeepSeek', baseURL: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { label: 'OpenAI GPT-4o', baseURL: 'https://api.openai.com/v1', model: 'gpt-4o' },
  { label: '智谱 GLM-4', baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
];

const VISION_PRESETS: { label: string; baseURL: string; model: string }[] = [
  { label: '智谱 GLM-4V-Flash(免费)', baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4v-flash' },
  { label: '通义 Qwen-VL', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-vl-max' },
  { label: 'OpenAI GPT-4o', baseURL: 'https://api.openai.com/v1', model: 'gpt-4o' },
];

export default function SettingsPage() {
  const { settings, setSettings } = useApp();
  const [form, setForm] = useState<Settings>(settings);
  const [saved, setSaved] = useState(false);

  const upd = (k: keyof Settings, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const save = () => {
    setSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="max-w-2xl">
      <PageTitle title="设置" desc="密钥仅保存在本地浏览器,不会上传任何服务器" />

      {/* 文本模型:训练/饮食计划生成 */}
      <Card className="mb-4">
        <h3 className="font-semibold text-gray-800 mb-1">文本模型 · 训练/饮食计划</h3>
        <p className="text-xs text-gray-500 mb-3">用于 F1 训练计划、F2 饮食计划。DeepSeek 完美支持。</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {TEXT_PRESETS.map((p) => (
            <button key={p.label}
              onClick={() => setForm((prev) => ({ ...prev, baseURL: p.baseURL, model: p.model }))}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 hover:border-brand hover:text-brand-dark">
              {p.label}
            </button>
          ))}
        </div>
        <Field label="API Key">
          <input type="password" value={form.apiKey} onChange={(e) => upd('apiKey', e.target.value)} placeholder="sk-..." className="input" />
        </Field>
        <Field label="Base URL">
          <input value={form.baseURL} onChange={(e) => upd('baseURL', e.target.value)} className="input" />
        </Field>
        <Field label="模型名">
          <input value={form.model} onChange={(e) => upd('model', e.target.value)} className="input" />
        </Field>
      </Card>

      {/* 视觉模型:拍照识别(选填) */}
      <Card className="mb-4">
        <h3 className="font-semibold text-gray-800 mb-1">视觉模型 · 拍照识别（选填）</h3>
        <p className="text-xs text-amber-600 mb-3 bg-amber-50 border border-amber-200 rounded-lg p-2">
          ⚠️ DeepSeek 没有视觉模型,无法识别图片。若要用「拍照识别热量」,请单独配一个视觉模型(智谱 GLM-4V-Flash 免费)。留空则该功能降级为手动录入。
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {VISION_PRESETS.map((p) => (
            <button key={p.label}
              onClick={() => setForm((prev) => ({ ...prev, visionBaseURL: p.baseURL, visionModel: p.model }))}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 hover:border-brand hover:text-brand-dark">
              {p.label}
            </button>
          ))}
        </div>
        <Field label="视觉 API Key(留空则复用上面的 Key)">
          <input type="password" value={form.visionApiKey ?? ''} onChange={(e) => upd('visionApiKey', e.target.value)} placeholder="视觉模型的 key" className="input" />
        </Field>
        <Field label="视觉 Base URL">
          <input value={form.visionBaseURL ?? ''} onChange={(e) => upd('visionBaseURL', e.target.value)} placeholder="留空则复用文本 Base URL" className="input" />
        </Field>
        <Field label="视觉模型名">
          <input value={form.visionModel ?? ''} onChange={(e) => upd('visionModel', e.target.value)} placeholder="如 glm-4v-flash" className="input" />
        </Field>
      </Card>

      <div className="flex items-center gap-3">
        <button onClick={save} className="btn-primary">保存设置</button>
        {saved && <span className="text-sm text-brand-dark">✓ 已保存</span>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
