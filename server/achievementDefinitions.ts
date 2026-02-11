// 成就系统定义文件

export interface AchievementTier {
  level: 1 | 2 | 3; // 档次：1星/2星/3星
  name: string; // 档次名称
  description: string; // 档次描述
  requirement: number; // 要求数量
  icon: string; // 图标emoji
}

export interface Achievement {
  id: string; // 成就ID
  category: string; // 所属大类
  name: string; // 成就名称
  description: string; // 成就描述
  icon: string; // 图标emoji
  tiers: AchievementTier[]; // 三个档次
  checkType: 'count' | 'streak' | 'total' | 'custom'; // 检查类型
  dataSource: string; // 数据来源（表名或自定义）
}

export interface AchievementCategory {
  id: string; // 大类ID
  name: string; // 大类名称
  icon: string; // 图标emoji
  color: string; // 颜色（渐变色类名）
  description: string; // 大类描述
}

// ==================== 8大类成就分类 ====================

export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  {
    id: 'fitness',
    name: '运动达人',
    icon: '🏃',
    color: 'from-orange-400 to-red-500',
    description: '坚持运动，健康生活',
  },
  {
    id: 'weight',
    name: '体重管理',
    icon: '⚖️',
    color: 'from-green-400 to-teal-500',
    description: '科学管理体重，达成目标',
  },
  {
    id: 'persistence',
    name: '坚持之星',
    icon: '⭐',
    color: 'from-yellow-400 to-amber-500',
    description: '持之以恒，永不放弃',
  },
  {
    id: 'interaction',
    name: '情侣互动',
    icon: '💑',
    color: 'from-pink-400 to-rose-500',
    description: '互相鼓励，共同进步',
  },
  {
    id: 'record',
    name: '记录达人',
    icon: '📝',
    color: 'from-blue-400 to-indigo-500',
    description: '记录生活，留住美好',
  },
  {
    id: 'romance',
    name: '浪漫时刻',
    icon: '💝',
    color: 'from-purple-400 to-pink-500',
    description: '创造浪漫，珍惜时光',
  },
  {
    id: 'explore',
    name: '探索世界',
    icon: '🗺️',
    color: 'from-cyan-400 to-blue-500',
    description: '走遍天下，留下足迹',
  },
  {
    id: 'time',
    name: '时光见证',
    icon: '⏰',
    color: 'from-gray-400 to-slate-500',
    description: '时光流转，见证成长',
  },
];

// ==================== 40+小成就定义 ====================

export const ACHIEVEMENTS: Achievement[] = [
  // ==================== 运动达人类 ====================
  {
    id: 'running_master',
    category: 'fitness',
    name: '跑步达人',
    description: '累计跑步里程',
    icon: '🏃',
    tiers: [
      { level: 1, name: '初级跑者', description: '累计跑步10公里', requirement: 10, icon: '🥉' },
      { level: 2, name: '中级跑者', description: '累计跑步50公里', requirement: 50, icon: '🥈' },
      { level: 3, name: '高级跑者', description: '累计跑步100公里', requirement: 100, icon: '🥇' },
    ],
    checkType: 'total',
    dataSource: 'fitnessRecords:running',
  },
  {
    id: 'yoga_master',
    category: 'fitness',
    name: '瑜伽之星',
    description: '累计瑜伽练习次数',
    icon: '🧘',
    tiers: [
      { level: 1, name: '瑜伽新手', description: '练习瑜伽10次', requirement: 10, icon: '🥉' },
      { level: 2, name: '瑜伽达人', description: '练习瑜伽30次', requirement: 30, icon: '🥈' },
      { level: 3, name: '瑜伽大师', description: '练习瑜伽100次', requirement: 100, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'fitnessRecords:yoga',
  },
  {
    id: 'gym_master',
    category: 'fitness',
    name: '健身房常客',
    description: '累计健身房训练次数',
    icon: '💪',
    tiers: [
      { level: 1, name: '健身新手', description: '去健身房30次', requirement: 30, icon: '🥉' },
      { level: 2, name: '健身达人', description: '去健身房100次', requirement: 100, icon: '🥈' },
      { level: 3, name: '健身狂人', description: '去健身房365次', requirement: 365, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'fitnessRecords:gym',
  },
  {
    id: 'swimming_master',
    category: 'fitness',
    name: '游泳健将',
    description: '累计游泳次数',
    icon: '🏊',
    tiers: [
      { level: 1, name: '游泳新手', description: '游泳10次', requirement: 10, icon: '🥉' },
      { level: 2, name: '游泳达人', description: '游泳30次', requirement: 30, icon: '🥈' },
      { level: 3, name: '游泳健将', description: '游泳100次', requirement: 100, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'fitnessRecords:swimming',
  },
  {
    id: 'cycling_master',
    category: 'fitness',
    name: '骑行爱好者',
    description: '累计骑行次数',
    icon: '🚴',
    tiers: [
      { level: 1, name: '骑行新手', description: '骑行10次', requirement: 10, icon: '🥉' },
      { level: 2, name: '骑行达人', description: '骑行30次', requirement: 30, icon: '🥈' },
      { level: 3, name: '骑行专家', description: '骑行100次', requirement: 100, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'fitnessRecords:cycling',
  },
  {
    id: 'exercise_allrounder',
    category: 'fitness',
    name: '运动全能',
    description: '尝试多种运动类型',
    icon: '🏅',
    tiers: [
      { level: 1, name: '运动探索者', description: '尝试3种运动', requirement: 3, icon: '🥉' },
      { level: 2, name: '运动多面手', description: '尝试5种运动', requirement: 5, icon: '🥈' },
      { level: 3, name: '运动全能王', description: '尝试8种运动', requirement: 8, icon: '🥇' },
    ],
    checkType: 'custom',
    dataSource: 'fitnessRecords:types',
  },

  // ==================== 体重管理类 ====================
  {
    id: 'weight_loss',
    category: 'weight',
    name: '减重达人',
    description: '成功减重',
    icon: '📉',
    tiers: [
      { level: 1, name: '减重新手', description: '减重3公斤', requirement: 3, icon: '🥉' },
      { level: 2, name: '减重达人', description: '减重5公斤', requirement: 5, icon: '🥈' },
      { level: 3, name: '减重冠军', description: '减重10公斤', requirement: 10, icon: '🥇' },
    ],
    checkType: 'custom',
    dataSource: 'fitnessGoals:weightLoss',
  },
  {
    id: 'weight_gain',
    category: 'weight',
    name: '增重达人',
    description: '成功增重',
    icon: '📈',
    tiers: [
      { level: 1, name: '增重新手', description: '增重3公斤', requirement: 3, icon: '🥉' },
      { level: 2, name: '增重达人', description: '增重5公斤', requirement: 5, icon: '🥈' },
      { level: 3, name: '增重冠军', description: '增重10公斤', requirement: 10, icon: '🥇' },
    ],
    checkType: 'custom',
    dataSource: 'fitnessGoals:weightGain',
  },
  {
    id: 'weight_stable',
    category: 'weight',
    name: '体重稳定',
    description: '保持体重稳定',
    icon: '⚖️',
    tiers: [
      { level: 1, name: '稳定新手', description: '保持30天', requirement: 30, icon: '🥉' },
      { level: 2, name: '稳定达人', description: '保持90天', requirement: 90, icon: '🥈' },
      { level: 3, name: '稳定大师', description: '保持180天', requirement: 180, icon: '🥇' },
    ],
    checkType: 'streak',
    dataSource: 'fitnessRecords:weightStable',
  },
  {
    id: 'goal_achiever',
    category: 'weight',
    name: '目标达成',
    description: '达成体重目标',
    icon: '🎯',
    tiers: [
      { level: 1, name: '目标新手', description: '达成1个目标', requirement: 1, icon: '🥉' },
      { level: 2, name: '目标达人', description: '达成3个目标', requirement: 3, icon: '🥈' },
      { level: 3, name: '目标大师', description: '达成5个目标', requirement: 5, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'fitnessGoals:achieved',
  },

  // ==================== 坚持之星类 ====================
  {
    id: 'daily_checkin',
    category: 'persistence',
    name: '每日打卡',
    description: '连续打卡天数',
    icon: '📅',
    tiers: [
      { level: 1, name: '打卡新手', description: '连续打卡7天', requirement: 7, icon: '🥉' },
      { level: 2, name: '打卡达人', description: '连续打卡30天', requirement: 30, icon: '🥈' },
      { level: 3, name: '打卡大师', description: '连续打卡100天', requirement: 100, icon: '🥇' },
    ],
    checkType: 'streak',
    dataSource: 'fitnessRecords:streak',
  },
  {
    id: 'early_bird',
    category: 'persistence',
    name: '早起运动',
    description: '早上运动次数',
    icon: '🌅',
    tiers: [
      { level: 1, name: '早起新手', description: '早起运动10次', requirement: 10, icon: '🥉' },
      { level: 2, name: '早起达人', description: '早起运动30次', requirement: 30, icon: '🥈' },
      { level: 3, name: '早起冠军', description: '早起运动100次', requirement: 100, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'fitnessRecords:morning',
  },
  {
    id: 'weekend_warrior',
    category: 'persistence',
    name: '周末不懈',
    description: '周末运动次数',
    icon: '🎉',
    tiers: [
      { level: 1, name: '周末新手', description: '周末运动10次', requirement: 10, icon: '🥉' },
      { level: 2, name: '周末达人', description: '周末运动30次', requirement: 30, icon: '🥈' },
      { level: 3, name: '周末冠军', description: '周末运动52次', requirement: 52, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'fitnessRecords:weekend',
  },
  {
    id: 'year_round',
    category: 'persistence',
    name: '全年无休',
    description: '一年内运动天数',
    icon: '🗓️',
    tiers: [
      { level: 1, name: '全年新手', description: '运动100天', requirement: 100, icon: '🥉' },
      { level: 2, name: '全年达人', description: '运动200天', requirement: 200, icon: '🥈' },
      { level: 3, name: '全年冠军', description: '运动365天', requirement: 365, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'fitnessRecords:yearRound',
  },

  // ==================== 情侣互动类 ====================
  {
    id: 'mutual_encouragement',
    category: 'interaction',
    name: '互相鼓励',
    description: '给对方点赞次数',
    icon: '👍',
    tiers: [
      { level: 1, name: '鼓励新手', description: '点赞10次', requirement: 10, icon: '🥉' },
      { level: 2, name: '鼓励达人', description: '点赞50次', requirement: 50, icon: '🥈' },
      { level: 3, name: '鼓励大师', description: '点赞100次', requirement: 100, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'fitnessLikes',
  },
  {
    id: 'warm_comments',
    category: 'interaction',
    name: '暖心评论',
    description: '给对方评论次数',
    icon: '💬',
    tiers: [
      { level: 1, name: '评论新手', description: '评论10次', requirement: 10, icon: '🥉' },
      { level: 2, name: '评论达人', description: '评论50次', requirement: 50, icon: '🥈' },
      { level: 3, name: '评论大师', description: '评论100次', requirement: 100, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'fitnessComments',
  },
  {
    id: 'couple_challenge',
    category: 'interaction',
    name: '情侣挑战',
    description: '完成情侣挑战次数',
    icon: '🏆',
    tiers: [
      { level: 1, name: '挑战新手', description: '完成1个挑战', requirement: 1, icon: '🥉' },
      { level: 2, name: '挑战达人', description: '完成3个挑战', requirement: 3, icon: '🥈' },
      { level: 3, name: '挑战大师', description: '完成10个挑战', requirement: 10, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'challenges:completed',
  },
  {
    id: 'together_progress',
    category: 'interaction',
    name: '共同进步',
    description: '同一天都运动的次数',
    icon: '🤝',
    tiers: [
      { level: 1, name: '进步新手', description: '同时运动10天', requirement: 10, icon: '🥉' },
      { level: 2, name: '进步达人', description: '同时运动30天', requirement: 30, icon: '🥈' },
      { level: 3, name: '进步大师', description: '同时运动100天', requirement: 100, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'fitnessRecords:together',
  },

  // ==================== 记录达人类 ====================
  {
    id: 'diary_writer',
    category: 'record',
    name: '日记达人',
    description: '写日记次数',
    icon: '📔',
    tiers: [
      { level: 1, name: '日记新手', description: '写10篇日记', requirement: 10, icon: '🥉' },
      { level: 2, name: '日记达人', description: '写50篇日记', requirement: 50, icon: '🥈' },
      { level: 3, name: '日记大师', description: '写100篇日记', requirement: 100, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'diaries',
  },
  {
    id: 'photo_collector',
    category: 'record',
    name: '相册达人',
    description: '上传照片数量',
    icon: '📷',
    tiers: [
      { level: 1, name: '相册新手', description: '上传50张照片', requirement: 50, icon: '🥉' },
      { level: 2, name: '相册达人', description: '上传100张照片', requirement: 100, icon: '🥈' },
      { level: 3, name: '相册大师', description: '上传500张照片', requirement: 500, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'photos',
  },
  {
    id: 'mood_tracker',
    category: 'record',
    name: '心情记录',
    description: '记录心情次数',
    icon: '😊',
    tiers: [
      { level: 1, name: '心情新手', description: '记录30次', requirement: 30, icon: '🥉' },
      { level: 2, name: '心情达人', description: '记录100次', requirement: 100, icon: '🥈' },
      { level: 3, name: '心情大师', description: '记录365次', requirement: 365, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'moods',
  },
  {
    id: 'ledger_keeper',
    category: 'record',
    name: '账本达人',
    description: '记账次数',
    icon: '💰',
    tiers: [
      { level: 1, name: '记账新手', description: '记账30次', requirement: 30, icon: '🥉' },
      { level: 2, name: '记账达人', description: '记账100次', requirement: 100, icon: '🥈' },
      { level: 3, name: '记账大师', description: '记账365次', requirement: 365, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'ledger',
  },

  // ==================== 浪漫时刻类 ====================
  {
    id: 'anniversary_keeper',
    category: 'romance',
    name: '纪念日守护',
    description: '创建纪念日数量',
    icon: '🎂',
    tiers: [
      { level: 1, name: '纪念新手', description: '创建3个纪念日', requirement: 3, icon: '🥉' },
      { level: 2, name: '纪念达人', description: '创建5个纪念日', requirement: 5, icon: '🥈' },
      { level: 3, name: '纪念大师', description: '创建10个纪念日', requirement: 10, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'anniversaries',
  },
  {
    id: 'promise_keeper',
    category: 'romance',
    name: '承诺守护',
    description: '兑现承诺次数',
    icon: '🤞',
    tiers: [
      { level: 1, name: '承诺新手', description: '兑现3个承诺', requirement: 3, icon: '🥉' },
      { level: 2, name: '承诺达人', description: '兑现10个承诺', requirement: 10, icon: '🥈' },
      { level: 3, name: '承诺大师', description: '兑现30个承诺', requirement: 30, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'promises:fulfilled',
  },
  {
    id: 'wish_granter',
    category: 'romance',
    name: '愿望实现',
    description: '实现愿望次数',
    icon: '⭐',
    tiers: [
      { level: 1, name: '愿望新手', description: '实现3个愿望', requirement: 3, icon: '🥉' },
      { level: 2, name: '愿望达人', description: '实现10个愿望', requirement: 10, icon: '🥈' },
      { level: 3, name: '愿望大师', description: '实现30个愿望', requirement: 30, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'wishes:completed',
  },
  {
    id: 'hundred_things',
    category: 'romance',
    name: '百事达成',
    description: '完成100件事进度',
    icon: '💯',
    tiers: [
      { level: 1, name: '百事新手', description: '完成30件事', requirement: 30, icon: '🥉' },
      { level: 2, name: '百事达人', description: '完成60件事', requirement: 60, icon: '🥈' },
      { level: 3, name: '百事大师', description: '完成100件事', requirement: 100, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'hundredThings:completed',
  },

  // ==================== 探索世界类 ====================
  {
    id: 'footprint_collector',
    category: 'explore',
    name: '足迹收集',
    description: '记录足迹数量',
    icon: '👣',
    tiers: [
      { level: 1, name: '足迹新手', description: '记录10个足迹', requirement: 10, icon: '🥉' },
      { level: 2, name: '足迹达人', description: '记录30个足迹', requirement: 30, icon: '🥈' },
      { level: 3, name: '足迹大师', description: '记录100个足迹', requirement: 100, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'footprints',
  },
  {
    id: 'city_explorer',
    category: 'explore',
    name: '城市探索',
    description: '去过的城市数量',
    icon: '🏙️',
    tiers: [
      { level: 1, name: '城市新手', description: '去过5个城市', requirement: 5, icon: '🥉' },
      { level: 2, name: '城市达人', description: '去过10个城市', requirement: 10, icon: '🥈' },
      { level: 3, name: '城市大师', description: '去过30个城市', requirement: 30, icon: '🥇' },
    ],
    checkType: 'custom',
    dataSource: 'footprints:cities',
  },
  {
    id: 'country_explorer',
    category: 'explore',
    name: '国家探索',
    description: '去过的国家数量',
    icon: '🌍',
    tiers: [
      { level: 1, name: '国家新手', description: '去过3个国家', requirement: 3, icon: '🥉' },
      { level: 2, name: '国家达人', description: '去过5个国家', requirement: 5, icon: '🥈' },
      { level: 3, name: '国家大师', description: '去过10个国家', requirement: 10, icon: '🥇' },
    ],
    checkType: 'custom',
    dataSource: 'footprints:countries',
  },

  // ==================== 时光见证类 ====================
  {
    id: 'time_together',
    category: 'time',
    name: '相识纪念',
    description: '在一起的时间',
    icon: '💕',
    tiers: [
      { level: 1, name: '相识百天', description: '在一起100天', requirement: 100, icon: '🥉' },
      { level: 2, name: '相识一年', description: '在一起365天', requirement: 365, icon: '🥈' },
      { level: 3, name: '相识千天', description: '在一起1000天', requirement: 1000, icon: '🥇' },
    ],
    checkType: 'custom',
    dataSource: 'couples:togetherDays',
  },
  {
    id: 'app_usage',
    category: 'time',
    name: '使用时长',
    description: '使用app天数',
    icon: '📱',
    tiers: [
      { level: 1, name: '使用新手', description: '使用30天', requirement: 30, icon: '🥉' },
      { level: 2, name: '使用达人', description: '使用100天', requirement: 100, icon: '🥈' },
      { level: 3, name: '使用大师', description: '使用365天', requirement: 365, icon: '🥇' },
    ],
    checkType: 'custom',
    dataSource: 'users:usageDays',
  },
  {
    id: 'time_capsule',
    category: 'time',
    name: '时光胶囊',
    description: '创建时光胶囊数量',
    icon: '⏳',
    tiers: [
      { level: 1, name: '胶囊新手', description: '创建3个胶囊', requirement: 3, icon: '🥉' },
      { level: 2, name: '胶囊达人', description: '创建10个胶囊', requirement: 10, icon: '🥈' },
      { level: 3, name: '胶囊大师', description: '创建30个胶囊', requirement: 30, icon: '🥇' },
    ],
    checkType: 'count',
    dataSource: 'timeCapsules',
  },
];

// 根据大类ID获取该大类下的所有成就
export function getAchievementsByCategory(categoryId: string): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === categoryId);
}

// 根据成就ID获取成就定义
export function getAchievementById(achievementId: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === achievementId);
}

// 获取大类信息
export function getCategoryById(categoryId: string): AchievementCategory | undefined {
  return ACHIEVEMENT_CATEGORIES.find(c => c.id === categoryId);
}
