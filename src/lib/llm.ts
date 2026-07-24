import type {
  Settings,
  UserProfile,
  WorkoutPlan,
  WorkoutDay,
  DietPlan,
  Meal,
  FoodItem,
} from '../types';
import { calcTargetCalories } from './tdee';
import { uid } from './storage';

interface ChatMessage {
  role: 'system' | 'user';
  content: unknown;
}

async function chat(
  settings: Settings,
  messages: ChatMessage[],
  jsonMode: boolean,
): Promise<string> {
  if (!settings.apiKey) throw new Error('未配置 API Key,请到「设置」页填写');
  const url = settings.baseURL.replace(/\/$/, '') + '/chat/completions';
  const body: Record<string, unknown> = {
    model: settings.model,
    messages,
    temperature: 0.6,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    throw new Error(`API ${res.status}: ${detail}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('模型返回内容为空');
  return content;
}

function extractJSON(text: string): unknown {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through to regex extraction
  }
  const match = cleaned.match(/[[{][\s\S]*[\]}]/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      // give up below
    }
  }
  throw new Error('无法解析模型返回的 JSON');
}

async function chatJSON(
  settings: Settings,
  system: string,
  user: string,
): Promise<unknown> {
  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
  try {
    return extractJSON(await chat(settings, messages, true));
  } catch {
    // 有些兼容端点不支持 json 模式,或首次解析失败 —— 重试一次
    return extractJSON(await chat(settings, messages, false));
  }
}

const GOAL_CN: Record<UserProfile['goal'], string> = {
  fatloss: '减脂',
  muscle: '增肌',
  shape: '塑形',
};
const LEVEL_CN: Record<UserProfile['level'], string> = {
  beginner: '新手',
  intermediate: '进阶',
  advanced: '高级',
};
const EQUIP_CN: Record<UserProfile['equipment'], string> = {
  bodyweight: '徒手无器械',
  dumbbell: '一对哑铃',
  gym: '全套健身房器械',
};
const PREF_CN: Record<UserProfile['dietPref'], string> = {
  none: '无特殊偏好',
  halal: '清真',
  vegetarian: '素食',
};

export async function generateWorkoutPlan(
  settings: Settings,
  p: UserProfile,
): Promise<WorkoutPlan> {
  const system =
    '你是一名专业健身教练。只返回一个 JSON 对象,不要输出任何解释文字或 markdown 代码块。';
  const user = `请为以下用户生成一份每周 ${p.daysPerWeek} 天的科学训练计划。
用户:${p.gender === 'male' ? '男' : '女'},${p.age}岁,${p.heightCm}cm,${p.weightKg}kg,目标${GOAL_CN[p.goal]},水平${LEVEL_CN[p.level]},器械条件:${EQUIP_CN[p.equipment]}。
严格返回如下 JSON 结构(days 数组长度必须等于 ${p.daysPerWeek}):
{"days":[{"day":1,"focus":"训练部位","exercises":[{"name":"动作名","sets":4,"reps":"8-12","restSec":90,"note":"动作要点"}]}]}
每天安排 4-6 个动作,note 用中文简述动作要点,restSec 为组间休息秒数。`;
  const raw = (await chatJSON(settings, system, user)) as { days?: WorkoutDay[] };
  if (!raw || !Array.isArray(raw.days) || raw.days.length === 0) {
    throw new Error('训练计划结构不正确');
  }
  return { id: uid(), createdAt: Date.now(), days: raw.days };
}

export async function generateDietPlan(
  settings: Settings,
  p: UserProfile,
): Promise<DietPlan> {
  const target = p.targetCalories ?? calcTargetCalories(p);
  const system =
    '你是一名专业营养师。只返回一个 JSON 对象,不要输出任何解释文字或 markdown 代码块。';
  const user = `请为以下用户生成一份每日饮食计划,每日总热量约 ${target} kcal。
用户:${p.gender === 'male' ? '男' : '女'},${p.weightKg}kg,目标${GOAL_CN[p.goal]},饮食偏好:${PREF_CN[p.dietPref]}。
严格返回如下 JSON 结构:
{"dailyCalories":${target},"meals":[{"name":"早餐","items":[{"food":"食物名","portion":"份量","kcal":300,"protein":20,"carb":30,"fat":10}]}]}
必须包含 早餐/午餐/晚餐 三餐,可含一个加餐;各餐热量之和应接近 ${target};protein/carb/fat 单位为克。`;
  const raw = (await chatJSON(settings, system, user)) as {
    dailyCalories?: number;
    meals?: Meal[];
  };
  if (!raw || !Array.isArray(raw.meals) || raw.meals.length === 0) {
    throw new Error('饮食计划结构不正确');
  }
  return {
    id: uid(),
    createdAt: Date.now(),
    dailyCalories: raw.dailyCalories ?? target,
    meals: raw.meals,
  };
}

export async function recognizeFood(
  settings: Settings,
  imageDataUrl: string,
): Promise<FoodItem[]> {
  // 拍照识别需要视觉模型;优先用单独的视觉配置,否则复用主配置。
  const vis: Settings = {
    apiKey: settings.visionApiKey || settings.apiKey,
    baseURL: settings.visionBaseURL || settings.baseURL,
    model: settings.visionModel || settings.model,
  };
  const system =
    '你是一名营养师。识别图片中的食物并估算热量与营养。只返回一个 JSON 数组,不要输出任何解释文字或 markdown。';
  const userText = `识别这张图片里的食物,逐项估算份量、热量(kcal)、蛋白质、碳水、脂肪(克)。
严格返回 JSON 数组:[{"food":"食物名","portion":"份量","kcal":200,"protein":10,"carb":20,"fat":5}]
如果图中不是食物,返回空数组 []。`;
  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    {
      role: 'user',
      content: [
        { type: 'text', text: userText },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ],
    },
  ];
  const raw = extractJSON(await chat(vis, messages, false));
  const arr = Array.isArray(raw)
    ? raw
    : (raw as { items?: unknown; foods?: unknown }).items ??
      (raw as { foods?: unknown }).foods;
  if (!Array.isArray(arr)) throw new Error('识别结果解析失败');
  return arr as FoodItem[];
}
