import { useState, useMemo } from 'react';
import { trpc } from '../lib/trpc';

// 8大类成就分类
const ACHIEVEMENT_CATEGORIES = [
  { id: 'fitness', name: '运动达人', icon: '🏃', color: 'from-orange-400 to-red-500', description: '坚持运动，健康生活' },
  { id: 'weight', name: '体重管理', icon: '⚖️', color: 'from-green-400 to-teal-500', description: '科学管理体重，达成目标' },
  { id: 'persistence', name: '坚持之星', icon: '⭐', color: 'from-yellow-400 to-amber-500', description: '持之以恒，永不放弃' },
  { id: 'interaction', name: '情侣互动', icon: '💑', color: 'from-pink-400 to-rose-500', description: '互相鼓励，共同进步' },
  { id: 'record', name: '记录达人', icon: '📝', color: 'from-blue-400 to-indigo-500', description: '记录生活，留住美好' },
  { id: 'romance', name: '浪漫时刻', icon: '💝', color: 'from-purple-400 to-pink-500', description: '创造浪漫，珍惜时光' },
  { id: 'explore', name: '探索世界', icon: '🗺️', color: 'from-cyan-400 to-blue-500', description: '走遍天下，留下足迹' },
  { id: 'time', name: '时光见证', icon: '⏰', color: 'from-gray-400 to-slate-500', description: '时光流转，见证成长' },
];

// 成就勋章组件（网易云风格，三档合并）
function AchievementBadge({ achievement, currentValue = 0 }: { achievement: any; currentValue?: number }) {
  // 计算当前达到的档次
  const getCurrentTier = () => {
    if (currentValue >= achievement.tier3) return 3;
    if (currentValue >= achievement.tier2) return 2;
    if (currentValue >= achievement.tier1) return 1;
    return 0;
  };
  const currentTier = getCurrentTier();
  
  // 计算下一档次的进度
  const getProgress = () => {
    if (currentTier === 0) {
      return (currentValue / achievement.tier1) * 100;
    } else if (currentTier === 1) {
      return ((currentValue - achievement.tier1) / (achievement.tier2 - achievement.tier1)) * 100 + 100;
    } else if (currentTier === 2) {
      return ((currentValue - achievement.tier2) / (achievement.tier3 - achievement.tier2)) * 100 + 200;
    }
    return 300; // 全部完成
  };
  const progress = Math.min(300, getProgress());
  
  // 勋章颜色
  const getBadgeColor = () => {
    if (currentTier === 0) return 'from-gray-300 to-gray-400';
    if (currentTier === 1) return 'from-amber-300 to-yellow-400';
    if (currentTier === 2) return 'from-amber-400 to-yellow-500';
    return 'from-amber-500 to-yellow-600';
  };
  
  // 获取下一目标
  const getNextTarget = () => {
    if (currentTier === 0) return achievement.tier1;
    if (currentTier === 1) return achievement.tier2;
    if (currentTier === 2) return achievement.tier3;
    return achievement.tier3;
  };
  
  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
      {/* 圆形勋章 */}
      <div className="relative w-20 h-20 mb-3">
        {/* 背景圆环 */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="4"
          />
          {/* 进度圆环 */}
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={currentTier > 0 ? "url(#gradient)" : "#d1d5db"}
            strokeWidth="4"
            strokeDasharray={`${(progress / 300) * 226} 226`}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* 中心图标 */}
        <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${getBadgeColor()} rounded-full m-2 ${currentTier === 0 && 'grayscale opacity-60'}`}>
          <div className="text-2xl">{achievement.icon}</div>
        </div>
        
        {/* 星级标记（网易云风格） */}
        {currentTier > 0 && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5 bg-white rounded-full px-2 py-0.5 shadow-md">
            {[...Array(currentTier)].map((_, i) => (
              <span key={i} className="text-yellow-400 text-xs">⭐</span>
            ))}
          </div>
        )}
      </div>
      
      {/* 成就名称 */}
      <h4 className="text-sm font-semibold text-gray-800 text-center mb-1">
        {achievement.name}
      </h4>
      
      {/* 描述 */}
      <p className="text-xs text-gray-500 text-center mb-2 line-clamp-2">
        {achievement.description}
      </p>
      
      {/* 三档进度信息 */}
      <div className="w-full space-y-1">
        {[
          { tier: 1, target: achievement.tier1, label: '初级', icon: '🥉' },
          { tier: 2, target: achievement.tier2, label: '中级', icon: '🥈' },
          { tier: 3, target: achievement.tier3, label: '高级', icon: '🥇' },
        ].map((t) => (
          <div key={t.tier} className="flex items-center justify-between text-xs">
            <span className={`flex items-center gap-1 ${currentTier >= t.tier ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </span>
            <span className={currentTier >= t.tier ? 'text-green-600 font-medium' : 'text-gray-400'}>
              {currentTier >= t.tier ? '✓' : `${t.target}`}
            </span>
          </div>
        ))}
      </div>
      
      {/* 当前进度 */}
      {currentTier < 3 && (
        <div className="w-full mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600 text-center">
            当前: {currentValue} / 下一档: {getNextTarget()}
          </div>
        </div>
      )}
      
      {currentTier === 3 && (
        <div className="w-full mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-green-600 font-medium text-center">
            🎉 全部完成！
          </div>
        </div>
      )}
    </div>
  );
}

// 分类卡片组件
function CategoryCard({ category, stats, onClick }: { 
  category: any; 
  stats: { total: number; tier1: number; tier2: number; tier3: number };
  onClick: () => void;
}) {
  const totalStars = stats.tier1 + stats.tier2 + stats.tier3;
  const maxStars = stats.total * 3; // 每个成就最多3星
  const completionPercent = maxStars > 0 ? Math.round((totalStars / maxStars) * 100) : 0;
  
  // 计算星级
  const getStarLevel = () => {
    if (completionPercent < 30) return 0;
    if (completionPercent < 60) return 1;
    if (completionPercent < 90) return 2;
    return 3;
  };
  const starLevel = getStarLevel();
  
  return (
    <button
      onClick={onClick}
      className={`w-full p-6 rounded-2xl bg-gradient-to-br ${category.color} text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{category.icon}</div>
          <div className="text-left">
            <h3 className="text-2xl font-bold">{category.name}</h3>
            <p className="text-sm opacity-90 mt-1">{category.description}</p>
          </div>
        </div>
        <div className="text-3xl">→</div>
      </div>
      
      {/* 进度条 */}
      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm">完成度</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{completionPercent}%</span>
            {starLevel > 0 && (
              <div className="flex gap-0.5">
                {[...Array(starLevel)].map((_, i) => (
                  <span key={i} className="text-yellow-300 text-base">⭐</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-2 opacity-90">
          <span>总星数: {totalStars}/{maxStars}</span>
          <span>成就: {stats.total}个</span>
        </div>
      </div>
    </button>
  );
}

// 成就详情页面
function AchievementDetail({ category, achievements, onBack }: { 
  category: any; 
  achievements: any[]; 
  onBack: () => void;
}) {
  const categoryAchievements = achievements.filter(a => a.category === category.id);
  
  // 计算统计
  const stats = useMemo(() => {
    let tier1 = 0, tier2 = 0, tier3 = 0;
    categoryAchievements.forEach(a => {
      const currentValue = a.currentValue || 0;
      if (currentValue >= a.tier3) tier3++;
      else if (currentValue >= a.tier2) tier2++;
      else if (currentValue >= a.tier1) tier1++;
    });
    return { total: categoryAchievements.length, tier1, tier2, tier3 };
  }, [categoryAchievements]);
  
  const totalStars = stats.tier1 + stats.tier2 + stats.tier3;
  const maxStars = stats.total * 3;
  const completionPercent = maxStars > 0 ? Math.round((totalStars / maxStars) * 100) : 0;
  
  const getStarLevel = () => {
    if (completionPercent < 30) return 0;
    if (completionPercent < 60) return 1;
    if (completionPercent < 90) return 2;
    return 3;
  };
  const starLevel = getStarLevel();
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <div className={`bg-gradient-to-br ${category.color} text-white p-6 rounded-b-3xl shadow-lg`}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white mb-4 hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">←</span>
          <span>返回</span>
        </button>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="text-6xl">{category.icon}</div>
          <div>
            <h2 className="text-3xl font-bold">{category.name}</h2>
            <p className="text-sm opacity-90 mt-1">{category.description}</p>
          </div>
        </div>
        
        {/* 大类进度 */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">完成度</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{completionPercent}%</span>
              {starLevel > 0 && (
                <div className="flex gap-0.5">
                  {[...Array(starLevel)].map((_, i) => (
                    <span key={i} className="text-yellow-300 text-lg">⭐</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs mt-3 opacity-90">
            <div className="text-center">
              <div className="font-bold">{stats.total}</div>
              <div>总成就</div>
            </div>
            <div className="text-center">
              <div className="font-bold">{stats.tier1}</div>
              <div>🥉 初级</div>
            </div>
            <div className="text-center">
              <div className="font-bold">{stats.tier2}</div>
              <div>🥈 中级</div>
            </div>
            <div className="text-center">
              <div className="font-bold">{stats.tier3}</div>
              <div>🥇 高级</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 成就列表 */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">成就列表</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryAchievements.map((achievement: any) => (
            <AchievementBadge 
              key={achievement.id} 
              achievement={achievement}
              currentValue={achievement.currentValue || 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// 主页面
export default function Achievements() {
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  // 模拟成就数据（实际应该从后端获取）
  const achievements = useMemo(() => {
    const mockAchievements = [
      // 运动达人类
      { id: 'running', category: 'fitness', name: '跑步达人', description: '累计跑步里程', icon: '🏃', tier1: 10, tier2: 50, tier3: 100, currentValue: 25 },
      { id: 'yoga', category: 'fitness', name: '瑜伽之星', description: '累计瑜伽练习', icon: '🧘', tier1: 10, tier2: 30, tier3: 100, currentValue: 15 },
      { id: 'gym', category: 'fitness', name: '健身房常客', description: '累计健身训练', icon: '💪', tier1: 30, tier2: 100, tier3: 365, currentValue: 50 },
      { id: 'swimming', category: 'fitness', name: '游泳健将', description: '累计游泳次数', icon: '🏊', tier1: 10, tier2: 30, tier3: 100, currentValue: 5 },
      { id: 'cycling', category: 'fitness', name: '骑行爱好者', description: '累计骑行次数', icon: '🚴', tier1: 10, tier2: 30, tier3: 100, currentValue: 0 },
      
      // 体重管理类
      { id: 'weight_loss', category: 'weight', name: '减重达人', description: '成功减重', icon: '📉', tier1: 3, tier2: 5, tier3: 10, currentValue: 4 },
      { id: 'weight_stable', category: 'weight', name: '体重稳定', description: '保持体重稳定', icon: '⚖️', tier1: 30, tier2: 90, tier3: 180, currentValue: 45 },
      { id: 'goal_achiever', category: 'weight', name: '目标达成', description: '达成体重目标', icon: '🎯', tier1: 1, tier2: 3, tier3: 5, currentValue: 1 },
      
      // 坚持之星类
      { id: 'daily_checkin', category: 'persistence', name: '每日打卡', description: '连续打卡天数', icon: '📅', tier1: 7, tier2: 30, tier3: 100, currentValue: 12 },
      { id: 'early_bird', category: 'persistence', name: '早起运动', description: '早上运动次数', icon: '🌅', tier1: 10, tier2: 30, tier3: 100, currentValue: 8 },
      { id: 'weekend_warrior', category: 'persistence', name: '周末不懈', description: '周末运动次数', icon: '🎉', tier1: 10, tier2: 30, tier3: 52, currentValue: 15 },
      
      // 情侣互动类
      { id: 'mutual_encouragement', category: 'interaction', name: '互相鼓励', description: '给对方点赞', icon: '👍', tier1: 10, tier2: 50, tier3: 100, currentValue: 20 },
      { id: 'warm_comments', category: 'interaction', name: '暖心评论', description: '给对方评论', icon: '💬', tier1: 10, tier2: 50, tier3: 100, currentValue: 12 },
      { id: 'couple_challenge', category: 'interaction', name: '情侣挑战', description: '完成挑战次数', icon: '🏆', tier1: 1, tier2: 3, tier3: 5, currentValue: 1 },
      
      // 记录达人类
      { id: 'diary_master', category: 'record', name: '日记达人', description: '写日记次数', icon: '📔', tier1: 10, tier2: 50, tier3: 100, currentValue: 30 },
      { id: 'photo_master', category: 'record', name: '摄影达人', description: '上传照片数', icon: '📷', tier1: 50, tier2: 200, tier3: 500, currentValue: 80 },
      { id: 'mood_tracker', category: 'record', name: '心情记录', description: '记录心情次数', icon: '😊', tier1: 30, tier2: 100, tier3: 365, currentValue: 45 },
      
      // 浪漫时刻类
      { id: 'anniversary', category: 'romance', name: '纪念日', description: '添加纪念日', icon: '💑', tier1: 5, tier2: 10, tier3: 20, currentValue: 8 },
      { id: 'promise', category: 'romance', name: '承诺达人', description: '完成承诺', icon: '💍', tier1: 5, tier2: 10, tier3: 20, currentValue: 6 },
      { id: 'wish', category: 'romance', name: '愿望实现', description: '实现愿望', icon: '🌟', tier1: 3, tier2: 10, tier3: 30, currentValue: 5 },
      
      // 探索世界类
      { id: 'footprint', category: 'explore', name: '足迹达人', description: '留下足迹', icon: '👣', tier1: 10, tier2: 30, tier3: 100, currentValue: 15 },
      { id: 'city_explorer', category: 'explore', name: '城市探索', description: '去过的城市', icon: '🏙️', tier1: 5, tier2: 10, tier3: 20, currentValue: 7 },
      { id: 'country_explorer', category: 'explore', name: '国家探索', description: '去过的国家', icon: '🌍', tier1: 3, tier2: 5, tier3: 10, currentValue: 2 },
      
      // 时光见证类
      { id: 'together_days', category: 'time', name: '相识纪念', description: '在一起天数', icon: '❤️', tier1: 100, tier2: 365, tier3: 1000, currentValue: 200 },
      { id: 'app_usage', category: 'time', name: '使用时长', description: '使用天数', icon: '📱', tier1: 30, tier2: 100, tier3: 365, currentValue: 50 },
      { id: 'time_capsule', category: 'time', name: '时光胶囊', description: '创建胶囊', icon: '⏳', tier1: 5, tier2: 10, tier3: 20, currentValue: 3 },
    ];
    return mockAchievements;
  }, []);
  
  // 按分类统计
  const categoryStats = useMemo(() => {
    const stats: any = {};
    ACHIEVEMENT_CATEGORIES.forEach(cat => {
      const catAchievements = achievements.filter(a => a.category === cat.id);
      let tier1 = 0, tier2 = 0, tier3 = 0;
      catAchievements.forEach(a => {
        const currentValue = a.currentValue || 0;
        if (currentValue >= a.tier3) tier3++;
        else if (currentValue >= a.tier2) tier2++;
        else if (currentValue >= a.tier1) tier1++;
      });
      stats[cat.id] = { total: catAchievements.length, tier1, tier2, tier3 };
    });
    return stats;
  }, [achievements]);
  
  // 总体统计
  const totalStats = useMemo(() => {
    let totalStars = 0;
    let maxStars = 0;
    Object.values(categoryStats).forEach((stat: any) => {
      totalStars += stat.tier1 + stat.tier2 + stat.tier3;
      maxStars += stat.total * 3;
    });
    return { totalStars, maxStars, achievements: achievements.length };
  }, [categoryStats, achievements]);
  
  if (selectedCategory) {
    return (
      <AchievementDetail
        category={selectedCategory}
        achievements={achievements}
        onBack={() => setSelectedCategory(null)}
      />
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      {/* 头部 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">成就中心</h1>
        <p className="text-gray-600">解锁成就，见证成长</p>
      </div>
      
      {/* 总览卡片 */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl p-6 shadow-lg mb-6">
        <h2 className="text-2xl font-bold mb-4">我的成就</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{totalStats.totalStars}</div>
            <div className="text-sm opacity-90">总星数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{totalStats.achievements}</div>
            <div className="text-sm opacity-90">成就数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {totalStats.maxStars > 0 ? Math.round((totalStats.totalStars / totalStats.maxStars) * 100) : 0}%
            </div>
            <div className="text-sm opacity-90">完成度</div>
          </div>
        </div>
      </div>
      
      {/* 大类列表 */}
      <div className="space-y-4">
        {ACHIEVEMENT_CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            stats={categoryStats[category.id] || { total: 0, tier1: 0, tier2: 0, tier3: 0 }}
            onClick={() => setSelectedCategory(category)}
          />
        ))}
      </div>
    </div>
  );
}
