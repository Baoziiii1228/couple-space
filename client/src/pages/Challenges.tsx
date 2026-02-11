import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';

// 庆祝动画组件
function CelebrationAnimation({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="relative">
        {/* 主文字 */}
        <div className="text-center animate-bounce">
          <div className="text-8xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold text-white mb-2">挑战完成！</h2>
          <p className="text-xl text-white">你们真棒！</p>
        </div>
        
        {/* 彩带效果 */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-12 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-50px',
                backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'][i % 6],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random()}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes confetti {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-confetti { animation: confetti 3s linear forwards; }
      `}</style>
    </div>
  );
}

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
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">创建挑战</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 挑战类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-800 dark:text-gray-200'
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              挑战标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="例如：一起跑步30天"
              required
            />
          </div>
          
          {/* 挑战描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              挑战描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="描述一下挑战的具体内容..."
              required
            />
          </div>
          
          {/* 目标值 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              目标值
            </label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              开始日期
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          
          {/* 结束日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              结束日期
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              min={startDate}
              required
            />
          </div>
          
          {/* 提交按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
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

// 进度更新对话框
function UpdateProgressDialog({ challenge, currentProgress, onClose, onUpdate }: {
  challenge: any;
  currentProgress: number;
  onClose: () => void;
  onUpdate: (progress: number) => void;
}) {
  const [progress, setProgress] = useState(currentProgress);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(progress);
    onClose();
  };
  
  const challengeType = CHALLENGE_TYPES.find(t => t.id === challenge.type);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">更新进度</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 挑战信息 */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${challengeType?.color} flex items-center justify-center text-2xl`}>
              {challengeType?.icon}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white">{challenge.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">目标: {challenge.targetValue}</p>
            </div>
          </div>
          
          {/* 当前进度显示 */}
          <div className="text-center">
            <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">{progress}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">当前进度</div>
          </div>
          
          {/* 滑块 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              拖动滑块调整
            </label>
            <input
              type="range"
              min="0"
              max={challenge.targetValue}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0</span>
              <span>{challenge.targetValue}</span>
            </div>
          </div>
          
          {/* 步进器 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              快速调整
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setProgress(Math.max(0, progress - 10))}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg transition-colors"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => setProgress(Math.max(0, progress - 1))}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg transition-colors"
              >
                -1
              </button>
              <input
                type="number"
                value={progress}
                onChange={(e) => setProgress(Math.max(0, Math.min(challenge.targetValue, Number(e.target.value))))}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="0"
                max={challenge.targetValue}
              />
              <button
                type="button"
                onClick={() => setProgress(Math.min(challenge.targetValue, progress + 1))}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg transition-colors"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => setProgress(Math.min(challenge.targetValue, progress + 10))}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg transition-colors"
              >
                +10
              </button>
            </div>
          </div>
          
          {/* 进度百分比 */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
              <span>完成度</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {Math.round((progress / challenge.targetValue) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${challengeType?.color} transition-all duration-300`}
                style={{ width: `${(progress / challenge.targetValue) * 100}%` }}
              />
            </div>
          </div>
          
          {/* 按钮 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 bg-gradient-to-br ${challengeType?.color} text-white rounded-lg hover:shadow-lg transition-all`}
            >
              确认更新
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 挑战卡片组件
function ChallengeCard({ challenge }: { challenge: any }) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const utils = trpc.useUtils();
  
  // 评论相关
  const { data: comments } = trpc.challenges.getComments.useQuery(
    { challengeId: challenge.id },
    { enabled: showComments }
  );
  
  const addCommentMutation = trpc.challenges.addComment.useMutation({
    onSuccess: () => {
      utils.challenges.getComments.invalidate({ challengeId: challenge.id });
      setCommentText('');
    },
  });
  
  const deleteCommentMutation = trpc.challenges.deleteComment.useMutation({
    onSuccess: () => {
      utils.challenges.getComments.invalidate({ challengeId: challenge.id });
    },
  });
  const acceptMutation = trpc.challenges.accept.useMutation({
    onSuccess: () => utils.challenges.list.invalidate(),
  });
  
  const updateProgressMutation = trpc.challenges.updateProgress.useMutation({
    onSuccess: () => utils.challenges.list.invalidate(),
  });
  
  const completeMutation = trpc.challenges.complete.useMutation({
    onSuccess: () => {
      setShowCelebration(true);
      utils.challenges.list.invalidate();
    },
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
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all`}>
      {/* 头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${challengeType?.color} flex items-center justify-center text-2xl`}>
            {challengeType?.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">{challenge.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{challenge.description}</p>
          </div>
        </div>
        <span className={`${status.color} text-white text-xs px-3 py-1 rounded-full`}>
          {status.text}
        </span>
      </div>
      
      {/* 进度 */}
      {challenge.status === 'active' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span>总进度</span>
            <span>{totalProgress} / {challenge.targetValue * 2}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${challengeType?.color} transition-all duration-300`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          {/* 双方进度 */}
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">我的进度</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{myProgress}</div>
            </div>
            <div className="text-center p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">TA的进度</div>
              <div className="text-lg font-bold text-pink-600 dark:text-pink-400">{partnerProgress}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* 时间信息 */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
        <span>开始：{new Date(challenge.startDate).toLocaleDateString()}</span>
        <span>结束：{new Date(challenge.endDate).toLocaleDateString()}</span>
      </div>
      
      {daysLeft > 0 && challenge.status === 'active' && (
        <div className="text-center text-sm text-orange-600 dark:text-orange-400 font-medium mb-4">
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
              onClick={() => setShowUpdateDialog(true)}
              disabled={updateProgressMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              更新进度
            </button>
            
            {showUpdateDialog && (
              <UpdateProgressDialog
                challenge={challenge}
                currentProgress={myProgress}
                onClose={() => setShowUpdateDialog(false)}
                onUpdate={(progress) => {
                  updateProgressMutation.mutate({
                    challengeId: challenge.id,
                    userId: challenge.createdBy,
                    currentProgress: progress,
                  });
                }}
              />
            )}
            
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
      
      {/* 评论区 */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <span>💬</span>
          <span>评论 ({comments?.length || 0})</span>
          <span className="text-xs">{showComments ? '▲' : '▼'}</span>
        </button>
        
        {showComments && (
          <div className="mt-4 space-y-3">
            {/* 评论列表 */}
            {comments && comments.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          {comment.userId === challenge.createdBy ? '👦 我' : '👧 TA'}
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-gray-800 dark:text-gray-200">{comment.content}</div>
                      </div>
                      {comment.userId === challenge.createdBy && (
                        <button
                          onClick={() => deleteCommentMutation.mutate({ id: comment.id })}
                          className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm ml-2"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* 添加评论 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="写下你的鼓励..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && commentText.trim()) {
                    addCommentMutation.mutate({
                      challengeId: challenge.id,
                      content: commentText,
                    });
                  }
                }}
              />
              <button
                onClick={() => {
                  if (commentText.trim()) {
                    addCommentMutation.mutate({
                      challengeId: challenge.id,
                      content: commentText,
                    });
                  }
                }}
                disabled={!commentText.trim() || addCommentMutation.isPending}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {addCommentMutation.isPending ? '发送中...' : '发送'}
              </button>
            </div>
            
            {/* 快捷鼓励语 */}
            <div className="flex flex-wrap gap-2">
              {['加油！💪', '你最棒！✨', '坚持住！🎉', '一起努力！❤️', '继续加油！🚀'].map((text) => (
                <button
                  key={text}
                  onClick={() => {
                    addCommentMutation.mutate({
                      challengeId: challenge.id,
                      content: text,
                    });
                  }}
                  className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-500 transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 庆祝动画 */}
      {showCelebration && (
        <CelebrationAnimation onClose={() => setShowCelebration(false)} />
      )}
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pb-20">
      {/* 头部 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">情侣挑战</h1>
        <p className="text-gray-600 dark:text-gray-400">一起挑战，共同成长</p>
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
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      
      {/* 挑战列表 */}
      <div className="space-y-4">
        {filteredChallenges.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-6xl mb-4">🎯</div>
            <p>暂无挑战</p>
            <p className="text-sm mt-2 text-gray-400 dark:text-gray-500">创建一个挑战，开始你们的共同目标吧！</p>
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
