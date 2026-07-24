export type MuscleGroup = '胸' | '背' | '腿' | '肩' | '手臂' | '核心' | '有氧';

export interface ExerciseGuide {
  id: string;
  name: string;
  group: MuscleGroup;
  equipment: string;
  difficulty: '入门' | '进阶' | '高级';
  target: string;
  steps: string[];
  tips: string;
}

export const MUSCLE_GROUPS: MuscleGroup[] = ['胸', '背', '腿', '肩', '手臂', '核心', '有氧'];

export const EXERCISES: ExerciseGuide[] = [
  {
    id: 'pushup',
    name: '标准俯卧撑',
    group: '胸',
    equipment: '徒手',
    difficulty: '入门',
    target: '胸大肌、三头肌、前锯肌',
    steps: [
      '双手略宽于肩,手指朝前撑地',
      '身体从头到脚跟保持一条直线,核心收紧',
      '屈肘下放,胸部接近地面,肘部约 45° 夹角',
      '推起还原,顶点不锁死手肘',
    ],
    tips: '全程收紧臀部和核心,避免塌腰或撅臀。做不动可跪姿降低难度。',
  },
  {
    id: 'db-bench',
    name: '哑铃卧推',
    group: '胸',
    equipment: '哑铃 + 卧凳',
    difficulty: '进阶',
    target: '胸大肌中束',
    steps: [
      '仰卧,双手持铃置于胸侧,肩胛后收下沉',
      '呼气推起,哑铃在胸部正上方靠拢',
      '吸气缓慢下放至胸侧,感受胸部拉伸',
      '保持手腕中立,不要晃动',
    ],
    tips: '离心(下放)比向心(推起)更慢,约 2-3 秒,充分刺激。',
  },
  {
    id: 'db-row',
    name: '哑铃单臂划船',
    group: '背',
    equipment: '哑铃 + 卧凳',
    difficulty: '入门',
    target: '背阔肌、菱形肌',
    steps: [
      '一手一膝撑凳,背部平直与地面平行',
      '另一手持铃自然下垂',
      '肘部贴身向后拉,带动哑铃到腰侧',
      '顶峰挤压背部,再缓慢下放',
    ],
    tips: '想着"用肘拉"而不是"用手拉",专注背部发力。',
  },
  {
    id: 'pullup',
    name: '引体向上',
    group: '背',
    equipment: '单杠',
    difficulty: '高级',
    target: '背阔肌、肱二头肌',
    steps: [
      '正握略宽于肩,悬垂,肩胛先下沉',
      '收紧核心,拉动身体让下巴过杠',
      '顶点挤压背部',
      '缓慢有控制地下放至手臂伸直',
    ],
    tips: '做不了标准引体可用弹力带辅助或做离心引体(只慢放)。',
  },
  {
    id: 'goblet-squat',
    name: '高脚杯深蹲',
    group: '腿',
    equipment: '哑铃/壶铃',
    difficulty: '入门',
    target: '股四头肌、臀大肌',
    steps: [
      '双手捧铃于胸前,双脚略宽于肩',
      '挺胸收腹,臀部后坐下蹲',
      '蹲到大腿至少与地面平行,膝盖对准脚尖方向',
      '脚跟发力站起还原',
    ],
    tips: '全程膝盖不要内扣,重心落在脚掌中后段。',
  },
  {
    id: 'lunge',
    name: '哑铃箭步蹲',
    group: '腿',
    equipment: '哑铃',
    difficulty: '进阶',
    target: '股四头肌、臀部',
    steps: [
      '双手持铃自然下垂,一脚向前跨出一大步',
      '下蹲至后腿膝盖接近地面',
      '前脚膝盖不超过脚尖',
      '前脚发力蹬起还原,换腿',
    ],
    tips: '上身保持直立,核心收紧维持平衡。',
  },
  {
    id: 'ohp',
    name: '哑铃站姿推举',
    group: '肩',
    equipment: '哑铃',
    difficulty: '进阶',
    target: '三角肌前束/中束',
    steps: [
      '站姿,双手持铃于肩两侧,掌心朝前',
      '核心收紧,呼气垂直上推至手臂接近伸直',
      '吸气缓慢下放至耳侧',
      '全程不借助腿部惯性',
    ],
    tips: '避免过度后仰,肋骨下沉、臀腹收紧保护腰椎。',
  },
  {
    id: 'lateral-raise',
    name: '哑铃侧平举',
    group: '肩',
    equipment: '哑铃',
    difficulty: '入门',
    target: '三角肌中束',
    steps: [
      '站姿,双手持轻铃置于体侧',
      '微屈肘,向两侧抬起至与肩同高',
      '顶点略停顿,小指略高于拇指',
      '缓慢下放,控制离心',
    ],
    tips: '用小重量,别耸肩,想象"倒水"的手型。',
  },
  {
    id: 'curl',
    name: '哑铃弯举',
    group: '手臂',
    equipment: '哑铃',
    difficulty: '入门',
    target: '肱二头肌',
    steps: [
      '站姿持铃,大臂夹紧身体固定',
      '呼气屈肘将哑铃举向肩部',
      '顶峰挤压二头',
      '吸气缓慢下放至完全伸直',
    ],
    tips: '大臂全程不动,只动小臂,避免身体晃动借力。',
  },
  {
    id: 'plank',
    name: '平板支撑',
    group: '核心',
    equipment: '徒手',
    difficulty: '入门',
    target: '腹横肌、核心',
    steps: [
      '前臂与脚尖撑地,肘在肩正下方',
      '身体从头到脚成一条直线',
      '收紧腹部和臀部,骨盆后倾',
      '保持均匀呼吸,坚持规定时间',
    ],
    tips: '别塌腰也别撅臀;质量比时长重要,标准 30 秒胜过塌腰 2 分钟。',
  },
  {
    id: 'mountain-climber',
    name: '登山跑',
    group: '核心',
    equipment: '徒手',
    difficulty: '进阶',
    target: '核心、心肺',
    steps: [
      '俯撑姿势,肩在手正上方',
      '核心收紧,交替快速将膝盖收向胸口',
      '保持臀部稳定不上下起伏',
      '维持节奏与呼吸',
    ],
    tips: '核心先稳住再加速,速度服从动作质量。',
  },
  {
    id: 'burpee',
    name: '波比跳',
    group: '有氧',
    equipment: '徒手',
    difficulty: '高级',
    target: '全身、心肺',
    steps: [
      '下蹲双手撑地',
      '双脚后跳成俯撑(可加一个俯卧撑)',
      '收腿回到蹲姿',
      '爆发向上跳起,落地缓冲',
    ],
    tips: '量力而行,新手可去掉跳跃和俯卧撑,先把动作连贯做顺。',
  },
];
