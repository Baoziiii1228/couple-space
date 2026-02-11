import { useState } from 'react';
import { trpc } from '../lib/trpc';

// 挑战类型配置
const CHALLENGE_TYPES = [
  { id: 'exercise', name: '运动挑战', icon: '🏃', color: 'from-green-500 to-teal-500', description: '一起运动，保持健康' },
  { id: 'weight', name: '减肥挑战', icon: '⚖️', color: 'from-pink-500 to-rose-500', description: '一起减肥，互相监督' },
  { id: 'habit', name: '习惯挑战', icon: '⭐', color: 'from-purple-500 to-indigo-500', description: '养成好习惯' },
  { id: 'record', name: '记录挑战', icon: '📝', color: 'from-orange-500 to-red-500', description: '坚持记录生活' },
  { id: 'custom', name: '自定义挑战', icon: '🎯', color: 'from-blue-500 to-cyan-500', description: '自由定义目标' },
];

// 挑战状态标签
const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  pending: { text: '待接受', color: 'bg-yellow-500' },
  active: { text: '进行中', color: 'bg-green-500' },
  completed: { text: '已完成', color: 'bg-blue-500' },
  failed: { text: '已失败', color: 'bg-gray-500' },
};

// 创建挑战对话框
function CreateChallengeDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [type, setType] = useState('exercise');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState(30);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  
  const createMutation = trpc.challenges.create.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      type: type as any,
      title,
      description,
      targetValue,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });
  };
  
  const selectedType = CHALLENGE_TYPES.find(t => t.id === type);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">创建挑战</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 挑战类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              挑战类型
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CHALLENGE_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    type === t.id
                      ? `border-transparent bg-gradient-to-br ${t.color} text-white`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="text-sm font-medium">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* 挑战标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              挑战标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="例如：一起跑步30天"
              required
            />
          </div>
          
          {/* 挑战描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              挑战描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="描述一下挑战的具体内容..."
              required
            />
          </div>
          
          {/* 目标值 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目标值
            </label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              min="1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {type === 'exercise' && '运动次数'}
              {type === 'weight' && '减重公斤数'}
              {type === 'habit' && '坚持天数'}
              {type === 'record' && '记录次数'}
              {type === 'custom' && '自定义单位'}
            </p>
          </div>
          
          {/* 开始日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              开始日期
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          
          {/* 结束日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              结束日期
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              min={startDate}
              required
            />
          </div>
          
          {/* 提交按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className={`flex-1 px-4 py-2 bg-gradient-to-br ${selectedType?.color} text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50`}
            >
              {createMutation.isPending ? '创建中...' : '创建挑战'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 挑战卡片组件
function ChallengeCard({ challenge }: { challenge: any }) {
  const utils = trpc.useUtils();
  const acceptMutation = trpc.challenges.accept.useMutation({
    onSuccess: () => utils.challenges.list.invalidate(),
  });
  
  const updateProgressMutation = trpc.challenges.updateProgress.useMutation({
    onSuccess: () => utils.challenges.list.invalidate(),
  });
  
  const completeMutation = trpc.challenges.complete.useMutation({
    onSuccess: () => utils.challenges.list.invalidate(),
  });
  
  const challengeType = CHALLENGE_TYPES.find(t => t.id === challenge.type);
  const status = STATUS_LABELS[challenge.status] || STATUS_LABELS.pending;
  
  // 计算进度
  const myProgress = challenge.progress?.find((p: any) => p.userId === challenge.createdBy)?.currentProgress || 0;
  const partnerProgress = challenge.progress?.find((p: any) => p.userId !== challenge.createdBy)?.currentProgress || 0;
  const totalProgress = myProgress + partnerProgress;
  const progressPercent = Math.min(100, (totalProgress / (challenge.targetValue * 2)) * 100);
  
  // 计算剩余天数
  const daysLeft = Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all`}>
      {/* 头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${challengeType?.color} flex items-center justify-center text-2xl`}>
            {challengeType?.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{challenge.title}</h3>
            <p className="text-sm text-gray-500">{challenge.description}</p>
          </div>
        </div>
        <span className={`${status.color} text-white text-xs px-3 py-1 rounded-full`}>
          {status.text}
        </span>
      </div>
      
      {/* 进度 */}
      {challenge.status === 'active' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>总进度</span>
            <span>{totalProgress} / {challenge.targetValue * 2}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${challengeType?.color} transition-all duration-300`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          {/* 双方进度 */}
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">我的进度</div>
              <div className="text-lg font-bold text-blue-600">{myProgress}</div>
            </div>
            <div className="text-center p-2 bg-pink-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">TA的进度</div>
              <div className="text-lg font-bold text-pink-600">{partnerProgress}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* 时间信息 */}
      <div className="flex justify-between text-xs text-gray-500 mb-4">
        <span>开始：{new Date(challenge.startDate).toLocaleDateString()}</span>
        <span>结束：{new Date(challenge.endDate).toLocaleDateString()}</span>
      </div>
      
      {daysLeft > 0 && challenge.status === 'active' && (
        <div className="text-center text-sm text-orange-600 font-medium mb-4">
          还剩 {daysLeft} 天
        </div>
      )}
      
      {/* 操作按钮 */}
      <div className="flex gap-2">
        {challenge.status === 'pending' && (
          <button
            onClick={() => acceptMutation.mutate({ id: challenge.id })}
            disabled={acceptMutation.isPending}
            className={`flex-1 px-4 py-2 bg-gradient-to-br ${challengeType?.color} text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50`}
          >
            {acceptMutation.isPending ? '接受中...' : '接受挑战'}
          </button>
        )}
        
        {challenge.status === 'active' && (
          <>
            <button
              onClick={() => {
                const newProgress = prompt('输入你的当前进度：', myProgress.toString());
                if (newProgress !== null) {
                  updateProgressMutation.mutate({
                    challengeId: challenge.id,
                    userId: challenge.createdBy,
                    currentProgress: Number(newProgress),
                  });
                }
              }}
              disabled={updateProgressMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              更新进度
            </button>
            
            {totalProgress >= challenge.targetValue * 2 && (
              <button
                onClick={() => completeMutation.mutate({ id: challenge.id })}
                disabled={completeMutation.isPending}
                className={`flex-1 px-4 py-2 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50`}
              >
                {completeMutation.isPending ? '完成中...' : '完成挑战'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// 主页面
export default function Challenges() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const { data: challenges, refetch } = trpc.challenges.list.useQuery();
  
  const filteredChallenges = challenges?.filter((c: any) => {
    if (filter === 'all') return true;
    return c.status === filter;
  }) || [];
  
  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      {/* 头部 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">情侣挑战</h1>
        <p className="text-gray-600">一起挑战，共同成长</p>
      </div>
      
      {/* 创建按钮 */}
      <button
        onClick={() => setShowCreateDialog(true)}
        className="w-full mb-6 p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
      >
        <span className="text-2xl">+</span>
        <span className="text-lg font-semibold">创建新挑战</span>
      </button>
      
      {/* 筛选器 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'all', label: '全部' },
          { id: 'pending', label: '待接受' },
          { id: 'active', label: '进行中' },
          { id: 'completed', label: '已完成' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              filter === f.id
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      
      {/* 挑战列表 */}
      <div className="space-y-4">
        {filteredChallenges.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🎯</div>
            <p>暂无挑战</p>
            <p className="text-sm mt-2">创建一个挑战，开始你们的共同目标吧！</p>
          </div>
        ) : (
          filteredChallenges.map((challenge: any) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))
        )}
      </div>
      
      {/* 创建挑战对话框 */}
      {showCreateDialog && (
        <CreateChallengeDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
