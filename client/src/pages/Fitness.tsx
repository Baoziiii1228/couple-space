import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, TrendingDown, TrendingUp, Dumbbell, Heart, Target, ThumbsUp, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion } from "framer-motion";

const exerciseTypes = [
  { value: "running", label: "跑步", emoji: "🏃", calories: 300 },
  { value: "yoga", label: "瑜伽", emoji: "🧘", calories: 150 },
  { value: "gym", label: "健身房", emoji: "💪", calories: 400 },
  { value: "swimming", label: "游泳", emoji: "🏊", calories: 350 },
  { value: "cycling", label: "骑行", emoji: "🚴", calories: 250 },
  { value: "walking", label: "散步", emoji: "🚶", calories: 100 },
  { value: "dancing", label: "跳舞", emoji: "💃", calories: 200 },
  { value: "other", label: "其他", emoji: "🎯", calories: 200 },
];

export default function Fitness() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGoalOpen, setIsGoalOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [weight, setWeight] = useState("");
  const [exerciseType, setExerciseType] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  // 目标设置
  const [targetWeight, setTargetWeight] = useState("");
  const [startWeight, setStartWeight] = useState("");
  const [targetDate, setTargetDate] = useState<Date>();
  const [weeklyExerciseGoal, setWeeklyExerciseGoal] = useState("3");

  const { data: records, refetch: refetchRecords } = trpc.fitness.listRecords.useQuery();
  const { data: goal, refetch: refetchGoal } = trpc.fitness.getGoal.useQuery();

  const createRecord = trpc.fitness.createRecord.useMutation({
    onSuccess: () => {
      toast.success("记录已添加");
      setIsCreateOpen(false);
      setDate(new Date());
      setWeight("");
      setExerciseType("");
      setDuration("");
      setNotes("");
      refetchRecords();
    },
    onError: (err) => toast.error(err.message),
  });

  const createGoal = trpc.fitness.createGoal.useMutation({
    onSuccess: () => {
      toast.success("目标已设置");
      setIsGoalOpen(false);
      setTargetWeight("");
      setStartWeight("");
      setTargetDate(undefined);
      setWeeklyExerciseGoal("3");
      refetchGoal();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteRecord = trpc.fitness.deleteRecord.useMutation({
    onSuccess: () => {
      toast.success("记录已删除");
      refetchRecords();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!date) {
      toast.error("请选择日期");
      return;
    }

    const selectedExercise = exerciseTypes.find(e => e.value === exerciseType);
    const estimatedCalories = selectedExercise && duration 
      ? Math.round((selectedExercise.calories / 60) * parseInt(duration))
      : undefined;

    createRecord.mutate({
      date: date.toISOString(),
      weight: weight ? parseFloat(weight) : undefined,
      exerciseType: exerciseType || undefined,
      duration: duration ? parseInt(duration) : undefined,
      calories: estimatedCalories,
      notes,
    } as any);
  };

  const handleCreateGoal = () => {
    if (!targetWeight || !startWeight) {
      toast.error("请填写目标体重和起始体重");
      return;
    }

    createGoal.mutate({
      targetWeight: parseFloat(targetWeight),
      startWeight: parseFloat(startWeight),
      startDate: new Date().toISOString(),
      targetDate: targetDate?.toISOString(),
      weeklyExerciseGoal: parseInt(weeklyExerciseGoal),
    } as any);
  };

  // 计算统计数据
  const stats = useMemo(() => {
    if (!records || records.length === 0) return null;

    const weightRecords = records.filter(r => r.weight).map(r => ({
      date: new Date(r.date),
      weight: parseFloat(r.weight as string),
    })).sort((a, b) => a.date.getTime() - b.date.getTime());

    const latestWeight = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1].weight : null;
    const firstWeight = weightRecords.length > 0 ? weightRecords[0].weight : null;
    const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : null;

    // 本周运动次数
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyExercises = records.filter(r => 
      r.exerciseType && new Date(r.date) >= oneWeekAgo
    ).length;

    // 总运动时长和卡路里
    const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0);
    const totalCalories = records.reduce((sum, r) => sum + (r.calories || 0), 0);

    return {
      latestWeight,
      weightChange,
      weeklyExercises,
      totalDuration,
      totalCalories,
      weightRecords,
    };
  }, [records]);

  // 计算目标进度
  const goalProgress = useMemo(() => {
    if (!goal || !stats?.latestWeight) return null;

    const target = parseFloat(goal.targetWeight as string);
    const start = parseFloat(goal.startWeight as string);
    const current = stats.latestWeight;

    const totalChange = target - start;
    const currentChange = current - start;
    const progress = totalChange !== 0 ? (currentChange / totalChange) * 100 : 0;

    return {
      target,
      start,
      current,
      progress: Math.min(Math.max(progress, 0), 100),
      remaining: Math.abs(target - current),
    };
  }, [goal, stats]);

  return (
    <div className="min-h-screen gradient-warm-subtle">
      <header className="sticky top-0 z-50 glass border-b border-white/20">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">💪 健身记录</h1>
          </div>
          <div className="flex gap-2">
            {!goal && (
              <Dialog open={isGoalOpen} onOpenChange={setIsGoalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Target className="w-4 h-4" />
                    设置目标
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>设置健身目标</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>起始体重 (kg) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="例如: 60.5"
                        value={startWeight}
                        onChange={(e) => setStartWeight(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>目标体重 (kg) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="例如: 55.0"
                        value={targetWeight}
                        onChange={(e) => setTargetWeight(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>目标日期（可选）</Label>
                      <Calendar
                        mode="single"
                        selected={targetDate}
                        onSelect={setTargetDate}
                        className="rounded-md border"
                        disabled={(date) => date < new Date()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>每周运动目标（次）</Label>
                      <Input
                        type="number"
                        value={weeklyExerciseGoal}
                        onChange={(e) => setWeeklyExerciseGoal(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" onClick={handleCreateGoal} disabled={createGoal.isPending}>
                      {createGoal.isPending ? "设置中..." : "设置目标"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  添加记录
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>添加健身记录</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>日期 *</Label>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      className="rounded-md border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>体重 (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="例如: 60.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>运动类型</Label>
                    <Select value={exerciseType} onValueChange={setExerciseType}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择运动类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {exerciseTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.emoji} {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {exerciseType && (
                    <div className="space-y-2">
                      <Label>运动时长 (分钟)</Label>
                      <Input
                        type="number"
                        placeholder="例如: 30"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>备注</Label>
                    <Textarea
                      placeholder="记录一些额外的信息..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleCreate} disabled={createRecord.isPending}>
                    {createRecord.isPending ? "添加中..." : "添加记录"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 目标进度卡片 */}
        {goal && goalProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  我的目标
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">起始</p>
                    <p className="text-2xl font-bold text-gray-500">{goalProgress.start} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">当前</p>
                    <p className="text-2xl font-bold text-primary">{goalProgress.current} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">目标</p>
                    <p className="text-2xl font-bold text-green-500">{goalProgress.target} kg</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">完成度</span>
                    <span className="text-sm font-medium">{Math.round(goalProgress.progress)}%</span>
                  </div>
                  <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${goalProgress.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    还需 {goalProgress.remaining.toFixed(1)} kg
                  </p>
                </div>
                {goal.weeklyExerciseGoal && stats && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">本周运动</span>
                      <span className="text-sm font-medium">
                        {stats.weeklyExercises} / {goal.weeklyExerciseGoal} 次
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 统计卡片 */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Dumbbell className="w-5 h-5 text-primary" />
                    {stats.weightChange !== null && (
                      stats.weightChange < 0 ? (
                        <TrendingDown className="w-5 h-5 text-green-500" />
                      ) : (
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                      )
                    )}
                  </div>
                  <p className="text-2xl font-bold">
                    {stats.latestWeight ? `${stats.latestWeight} kg` : "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">当前体重</p>
                  {stats.weightChange !== null && (
                    <p className={`text-xs mt-1 ${stats.weightChange < 0 ? "text-green-500" : "text-orange-500"}`}>
                      {stats.weightChange > 0 ? "+" : ""}{stats.weightChange.toFixed(1)} kg
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-4">
                  <Heart className="w-5 h-5 text-red-500 mb-2" />
                  <p className="text-2xl font-bold">{stats.weeklyExercises}</p>
                  <p className="text-sm text-muted-foreground">本周运动</p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold">{Math.round(stats.totalDuration / 60)}h</p>
                  <p className="text-sm text-muted-foreground">总运动时长</p>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold">{Math.round(stats.totalCalories / 1000)}k</p>
                  <p className="text-sm text-muted-foreground">总消耗卡路里</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* 记录列表 */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg">记录列表</CardTitle>
          </CardHeader>
          <CardContent>
            {(!records || records.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>还没有记录，开始添加吧！</p>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((record: any) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-muted-foreground">
                          {new Date(record.date).toLocaleDateString('zh-CN')}
                        </span>
                        {record.weight && (
                          <span className="text-sm font-medium text-primary">
                            {parseFloat(record.weight).toFixed(1)} kg
                          </span>
                        )}
                      </div>
                      {record.exerciseType && (
                        <div className="flex items-center gap-2 text-sm">
                          <span>
                            {exerciseTypes.find(e => e.value === record.exerciseType)?.emoji}
                            {exerciseTypes.find(e => e.value === record.exerciseType)?.label}
                          </span>
                          {record.duration && (
                            <span className="text-muted-foreground">
                              {record.duration} 分钟
                            </span>
                          )}
                          {record.calories && (
                            <span className="text-muted-foreground">
                              {record.calories} 卡
                            </span>
                          )}
                        </div>
                      )}
                      {record.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{record.notes}</p>
                      )}
                      <FitnessRecordActions recordId={record.id} />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRecord.mutate({ id: record.id })}
                      disabled={deleteRecord.isPending}
                    >
                      删除
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// 点赞和评论组件
function FitnessRecordActions({ recordId }: { recordId: number }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showLikesList, setShowLikesList] = useState(false);

  const utils = trpc.useUtils();
  const { data: likes = [] } = trpc.fitness.getLikes.useQuery({ recordId });
  const { data: comments = [] } = trpc.fitness.getComments.useQuery({ recordId });

  const likeMutation = trpc.fitness.like.useMutation({
    onSuccess: () => {
      utils.fitness.getLikes.invalidate({ recordId });
      toast.success("点赞成功");
    },
  });

  const unlikeMutation = trpc.fitness.unlike.useMutation({
    onSuccess: () => {
      utils.fitness.getLikes.invalidate({ recordId });
      toast.success("取消点赞");
    },
  });

  const addCommentMutation = trpc.fitness.addComment.useMutation({
    onSuccess: () => {
      utils.fitness.getComments.invalidate({ recordId });
      setCommentText("");
      toast.success("评论成功");
    },
  });

  const deleteCommentMutation = trpc.fitness.deleteComment.useMutation({
    onSuccess: () => {
      utils.fitness.getComments.invalidate({ recordId });
      toast.success("评论已删除");
    },
  });

  const isLiked = likes.some((like: any) => like.userId === user?.id);

  const handleLike = () => {
    if (isLiked) {
      unlikeMutation.mutate({ recordId });
    } else {
      likeMutation.mutate({ recordId });
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ recordId, content: commentText });
  };

  const quickEncouragements = [
    "加油！你最棒！💪",
    "坚持就是胜利！🏆",
    "今天也很努力呢！⭐",
    "继续保持！👍",
    "为你骄傲！❤️",
  ];

  return (
    <div className="mt-3 space-y-2">
      {/* 点赞和评论按钮 */}
      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 transition-colors ${
            isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-red-500" : ""}`} />
          <span
            onClick={(e) => {
              if (likes.length > 0) {
                e.stopPropagation();
                setShowLikesList(true);
              }
            }}
            className={likes.length > 0 ? "cursor-pointer hover:underline" : ""}
          >
            {likes.length > 0 ? likes.length : "点赞"}
          </span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{comments.length > 0 ? comments.length : "评论"}</span>
        </button>
      </div>

      {/* 评论区域 */}
      {showComments && (
        <div className="space-y-2 pt-2 border-t">
          {/* 快捷鼓励语 */}
          <div className="flex flex-wrap gap-2">
            {quickEncouragements.map((text) => (
              <button
                key={text}
                onClick={() => {
                  addCommentMutation.mutate({ recordId, content: text });
                }}
                className="px-3 py-1 text-xs bg-gradient-to-r from-pink-100 to-purple-100 text-gray-700 rounded-full hover:shadow-md transition"
              >
                {text}
              </button>
            ))}
          </div>

          {/* 评论列表 */}
          {comments.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {comments.map((comment: any) => (
                <div key={comment.id} className="text-sm bg-gray-50 rounded-lg p-2 flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-gray-700">{comment.content}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  {comment.userId === user?.id && (
                    <button
                      onClick={() => {
                        if (confirm("确定要删除这条评论吗？")) {
                          deleteCommentMutation.mutate({ id: comment.id });
                        }
                      }}
                      className="text-red-500 hover:text-red-700 text-xs ml-2"
                    >
                      删除
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 评论输入框 */}
          <div className="flex gap-2">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="写下你的鼓励..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!commentText.trim() || addCommentMutation.isPending}
            >
              发送
            </Button>
          </div>
        </div>
      )}

      {/* 点赞用户列表对话框 */}
      {showLikesList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLikesList(false)}>
          <div className="bg-white rounded-xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">点赞列表 ({likes.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {likes.map((like: any) => (
                <div key={like.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                    {like.userId === user?.id ? "我" : "TA"}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{like.userId === user?.id ? "我" : "TA"}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(like.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowLikesList(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
