import { useState, useMemo } from 'react';
import { trpc } from '../lib/trpc';

// 成就分类配置
const CATEGORIES = [
  { id: '记录', name: '记录达人', icon: '📝', color: 'from-blue-500 to-cyan-500', description: '记录美好时光' },
  { id: '任务', name: '任务大师', icon: '🎯', color: 'from-purple-500 to-pink-500', description: '完成情侣任务' },
  { id: '探索', name: '探索世界', icon: '🗺️', color: 'from-green-500 to-teal-500', description: '留下足迹' },
  { id: '互动', name: '互动之星', icon: '💬', color: 'from-orange-500 to-red-500', description: '增进感情' },
  { id: '里程碑', name: '时光见证', icon: '⏰', color: 'from-indigo-500 to-purple-500', description: '见证成长' },
];

// 成就勋章组件（网易云风格）
function AchievementBadge({ achievement }: { achievement: any }) {
  const isUnlocked = achievement.isUnlocked;
  const progress = achievement.progress;
  const progressPercent = Math.min(100, progress * 100);
  
  // 勋章颜色（根据解锁状态）
  const getBadgeColor = () => {
    if (!isUnlocked) return 'from-gray-300 to-gray-400';
    return 'from-amber-400 to-yellow-500';
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
            stroke={isUnlocked ? "url(#gradient)" : "#d1d5db"}
            strokeWidth="4"
            strokeDasharray={`${(progressPercent / 100) * 226} 226`}
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
        <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${getBadgeColor()} rounded-full m-2 ${!isUnlocked && 'grayscale opacity-60'}`}>
          <div className="text-2xl">{achievement.emoji}</div>
        </div>
        
        {/* 解锁标记 */}
        {isUnlocked && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>
      
      {/* 成就名称 */}
      <h4 className="text-sm font-semibold text-gray-800 text-center mb-1">
        {achievement.title}
      </h4>
      
      {/* 描述 */}
      <p className="text-xs text-gray-500 text-center mb-2 line-clamp-2">
        {achievement.description}
      </p>
      
      {/* 进度信息 */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{achievement.current}</span>
          <span>{achievement.target}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${isUnlocked ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gray-400'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {!isUnlocked && (
          <p className="text-xs text-gray-500 text-center mt-1">
            还差 {achievement.target - achievement.current}
          </p>
        )}
      </div>
    </div>
  );
}

// 分类卡片组件
function CategoryCard({ category, count, total, onClick }: { 
  category: any; 
  count: number; 
  total: number; 
  onClick: () => void;
}) {
  const completionPercent = total > 0 ? Math.round((count / total) * 100) : 0;
  
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
          <span>已完成 {count}/{total}</span>
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
  const completedCount = categoryAchievements.filter(a => a.isUnlocked).length;
  const totalCount = categoryAchievements.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
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
          <div className="flex justify-between text-xs mt-2 opacity-90">
            <span>已完成 {completedCount}/{totalCount}</span>
          </div>
        </div>
      </div>
      
      {/* 成就列表 */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">成就列表</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryAchievements.map((achievement: any) => (
            <AchievementBadge key={achievement.key} achievement={achievement} />
          ))}
        </div>
      </div>
    </div>
  );
}

// 主页面
export default function Achievements() {
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const { data: achievements, isLoading } = trpc.achievement.list.useQuery();
  
  // 按分类统计
  const categoryStats = useMemo(() => {
    if (!achievements) return {};
    const stats: any = {};
    CATEGORIES.forEach(cat => {
      const catAchievements = achievements.filter((a: any) => a.category === cat.id);
      const completed = catAchievements.filter((a: any) => a.isUnlocked).length;
      stats[cat.id] = { total: catAchievements.length, completed };
    });
    return stats;
  }, [achievements]);
  
  // 总体统计
  const totalStats = useMemo(() => {
    if (!achievements) return { total: 0, completed: 0, stars: 0 };
    const completed = achievements.filter((a: any) => a.isUnlocked).length;
    const total = achievements.length;
    // 计算总星数（每个完成的成就算1星）
    const stars = completed;
    return { total, completed, stars };
  }, [achievements]);
  
  if (selectedCategory) {
    return (
      <AchievementDetail
        category={selectedCategory}
        achievements={achievements || []}
        onBack={() => setSelectedCategory(null)}
      />
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
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
            <div className="text-3xl font-bold">{totalStats.completed}</div>
            <div className="text-sm opacity-90">已解锁</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{totalStats.stars}</div>
            <div className="text-sm opacity-90">总星数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {totalStats.total > 0 ? Math.round((totalStats.completed / totalStats.total) * 100) : 0}%
            </div>
            <div className="text-sm opacity-90">完成度</div>
          </div>
        </div>
      </div>
      
      {/* 大类列表 */}
      <div className="space-y-4">
        {CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            count={categoryStats[category.id]?.completed || 0}
            total={categoryStats[category.id]?.total || 0}
            onClick={() => setSelectedCategory(category)}
          />
        ))}
      </div>
    </div>
  );
}
