import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Plus, Calendar as CalendarIcon, Heart, AlertCircle, Trash2, CheckSquare } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion } from "framer-motion";

const symptoms = [
  { value: "cramps", label: "痛经", emoji: "😣" },
  { value: "headache", label: "头痛", emoji: "🤕" },
  { value: "mood", label: "情绪波动", emoji: "😢" },
  { value: "fatigue", label: "疲劳", emoji: "😴" },
  { value: "bloating", label: "腹胀", emoji: "🤰" },
  { value: "acne", label: "痘痘", emoji: "😖" },
  { value: "backache", label: "腰痛", emoji: "🧘" },
  { value: "nausea", label: "恶心", emoji: "🤢" },
];

const painLevels = [
  { value: 1, label: "轻微", emoji: "🙂", color: "bg-green-100 text-green-600 dark:bg-green-900/30" },
  { value: 2, label: "轻度", emoji: "😐", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30" },
  { value: 3, label: "中度", emoji: "😟", color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30" },
  { value: 4, label: "中重度", emoji: "😣", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30" },
  { value: 5, label: "严重", emoji: "😭", color: "bg-red-100 text-red-600 dark:bg-red-900/30" },
];

const moodLevels = [
  { value: 1, label: "很好", emoji: "😄", color: "bg-green-100 text-green-600 dark:bg-green-900/30" },
  { value: 2, label: "还行", emoji: "😊", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30" },
  { value: 3, label: "一般", emoji: "😐", color: "bg-gray-100 text-gray-600 dark:bg-gray-700/30" },
  { value: 4, label: "不好", emoji: "😞", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30" },
  { value: 5, label: "很差", emoji: "😢", color: "bg-red-100 text-red-600 dark:bg-red-900/30" },
];

export default function PeriodTracker() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [painLevel, setPainLevel] = useState<number>(0);
  const [moodLevel, setMoodLevel] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: records, refetch } = trpc.periodTracker.list.useQuery();

  const createRecord = trpc.periodTracker.create.useMutation({
    onSuccess: () => {
      toast.success("记录已添加");
      setIsCreateOpen(false);
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedSymptoms([]);
      setPainLevel(0);
      setMoodLevel(0);
      setNotes("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteRecord = trpc.periodTracker.delete.useMutation({
    onSuccess: () => {
      toast.success("记录已删除");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const batchDeleteRecords = trpc.periodTracker.batchDelete.useMutation({
    onSuccess: () => {
      toast.success(`已删除 ${selectedIds.length} 条记录`);
      setSelectedIds([]);
      setIsSelectMode(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这条记录吗？")) {
      deleteRecord.mutate({ id });
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("请先选择要删除的记录");
      return;
    }
    if (confirm(`确定要删除选中的 ${selectedIds.length} 条记录吗？`)) {
      batchDeleteRecords.mutate({ ids: selectedIds });
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (records && selectedIds.length === records.length) {
      setSelectedIds([]);
    } else if (records) {
      setSelectedIds(records.map(r => r.id));
    }
  };

  const handleCreate = () => {
    if (!startDate) {
      toast.error("请选择开始日期");
      return;
    }

    const periodLength = endDate && startDate
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : undefined;

    createRecord.mutate({
      startDate: startDate.toISOString(),
      endDate: endDate?.toISOString(),
      periodLength,
      symptoms: selectedSymptoms,
      painLevel: painLevel || undefined,
      moodLevel: moodLevel || undefined,
      notes,
    } as any);
  };

  // 计算平均周期和预测
  const prediction = useMemo(() => {
    if (!records || records.length < 2) return null;

    const cycles: number[] = [];
    for (let i = 1; i < records.length; i++) {
      const prev = new Date(records[i - 1].startDate);
      const curr = new Date(records[i].startDate);
      const cycleDays = Math.ceil((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      cycles.push(cycleDays);
    }

    const avgCycle = Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length);

    const periodLengths = records
      .filter(r => r.periodLength)
      .map(r => r.periodLength as number);
    const avgPeriodLength = periodLengths.length > 0
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : 5;

    const lastRecord = records[records.length - 1];
    const lastStartDate = new Date(lastRecord.startDate);
    const nextStartDate = new Date(lastStartDate);
    nextStartDate.setDate(nextStartDate.getDate() + avgCycle);

    const today = new Date();
    const daysUntilNext = Math.ceil((nextStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      avgCycle,
      avgPeriodLength,
      nextStartDate,
      daysUntilNext,
      lastStartDate,
    };
  }, [records]);

  // 计算当前状态
  const currentStatus = useMemo(() => {
    if (!records || records.length === 0) return null;

    const lastRecord = records[records.length - 1];
    const lastStartDate = new Date(lastRecord.startDate);
    const today = new Date();
    const daysSinceStart = Math.ceil((today.getTime() - lastStartDate.getTime()) / (1000 * 60 * 60 * 24));

    if (lastRecord.endDate) {
      const lastEndDate = new Date(lastRecord.endDate);
      if (today <= lastEndDate) {
        return { status: "period", message: "经期中", color: "text-red-500" };
      }
    }

    if (prediction) {
      const { avgCycle, avgPeriodLength } = prediction;
      
      if (daysSinceStart < avgPeriodLength) {
        return { status: "period", message: "经期中", color: "text-red-500" };
      } else if (daysSinceStart >= avgCycle - 7 && daysSinceStart < avgCycle) {
        return { status: "pms", message: "经前期", color: "text-orange-500" };
      } else if (daysSinceStart >= avgCycle) {
        return { status: "late", message: "经期延迟", color: "text-yellow-500" };
      } else {
        return { status: "normal", message: "安全期", color: "text-green-500" };
      }
    }

    return null;
  }, [records, prediction]);

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
            <h1 className="text-xl font-semibold">💖 经期记录</h1>
          </div>
          <div className="flex items-center gap-2">
            {records && records.length > 0 && (
              <Button
                variant={isSelectMode ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  setSelectedIds([]);
                }}
              >
                <CheckSquare className="w-4 h-4 mr-1" />
                {isSelectMode ? "取消" : "管理"}
              </Button>
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
                  <DialogTitle>添加经期记录</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>开始日期 *</Label>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      className="rounded-md border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>结束日期（可选）</Label>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      className="rounded-md border"
                      disabled={(date) => startDate ? date < startDate : false}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>痛经程度</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {painLevels.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          className={`p-2 rounded-lg text-center text-xs transition-all ${
                            painLevel === level.value
                              ? "ring-2 ring-primary scale-105"
                              : "hover:scale-105"
                          } ${level.color}`}
                          onClick={() => setPainLevel(level.value)}
                        >
                          <div className="text-xl mb-1">{level.emoji}</div>
                          <div>{level.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>情绪状态</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {moodLevels.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          className={`p-2 rounded-lg text-center text-xs transition-all ${
                            moodLevel === level.value
                              ? "ring-2 ring-primary scale-105"
                              : "hover:scale-105"
                          } ${level.color}`}
                          onClick={() => setMoodLevel(level.value)}
                        >
                          <div className="text-xl mb-1">{level.emoji}</div>
                          <div>{level.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>症状</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {symptoms.map((symptom) => (
                        <button
                          key={symptom.value}
                          type="button"
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${
                            selectedSymptoms.includes(symptom.value)
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary/50 hover:bg-secondary"
                          }`}
                          onClick={() => {
                            setSelectedSymptoms(prev =>
                              prev.includes(symptom.value)
                                ? prev.filter(s => s !== symptom.value)
                                : [...prev, symptom.value]
                            );
                          }}
                        >
                          {symptom.emoji} {symptom.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>备注</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="记录一些备注..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleCreate} className="w-full" disabled={createRecord.isPending}>
                    {createRecord.isPending ? "保存中..." : "保存记录"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 批量操作栏 */}
        {isSelectMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={selectAll}>
                {records && selectedIds.length === records.length ? "取消全选" : "全选"}
              </Button>
              <span className="text-sm text-muted-foreground">
                已选 {selectedIds.length} 项
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              disabled={selectedIds.length === 0 || batchDeleteRecords.isPending}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {batchDeleteRecords.isPending ? "删除中..." : `删除 (${selectedIds.length})`}
            </Button>
          </motion.div>
        )}

        {/* 预测卡片 */}
        {prediction && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass border-white/40 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">周期预测</h3>
                  {currentStatus && (
                    <span className={`text-sm font-medium ${currentStatus.color}`}>
                      {currentStatus.message}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-pink-500">{prediction.avgCycle}</p>
                    <p className="text-xs text-muted-foreground">平均周期(天)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-500">{prediction.avgPeriodLength}</p>
                    <p className="text-xs text-muted-foreground">平均经期(天)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-500">
                      {prediction.daysUntilNext > 0 ? prediction.daysUntilNext : "今天"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {prediction.daysUntilNext > 0 ? "距下次(天)" : "预计今天"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  预计下次经期：{prediction.nextStartDate.toLocaleDateString('zh-CN')}
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* 关怀提示 */}
        {currentStatus && (currentStatus.status === "period" || currentStatus.status === "pms") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass border-pink-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  {currentStatus.status === "period" ? "经期关怀" : "经前期关怀"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentStatus.status === "period" ? (
                  <>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-2">🤗 给她的建议</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 多喝热水，保持身体温暖</li>
                        <li>• 避免剧烈运动，可以散步或瑜伽</li>
                        <li>• 充足睡眠，不要熬夜</li>
                        <li>• 吃些温热的食物，避免生冷</li>
                      </ul>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">👦 给男友的建议</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 今天她可能会痛经，多关心她</li>
                        <li>• 帮她冲一杯红糖姜茶或热牛奶</li>
                        <li>• 情绪可能波动，请耐心一些</li>
                        <li>• 主动承担家务，让她好好休息</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-2">🤗 给她的建议</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 注意保持心情愉快</li>
                        <li>• 适当运动，缓解压力</li>
                        <li>• 准备好经期用品</li>
                      </ul>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">👦 给男友的建议</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 她可能会情绪敏感，多关心她</li>
                        <li>• 准备一些小惊喜或礼物</li>
                        <li>• 耐心倾听，给予鼓励</li>
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 提示信息 */}
        {(!records || records.length < 2) && (
          <Card className="glass border-yellow-500/40">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm mb-1">需要更多数据</p>
                <p className="text-xs text-muted-foreground">
                  至少记录 2 次经期才能进行周期预测哦
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 历史记录 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">历史记录</h2>
          {records && records.length > 0 ? (
            <div className="space-y-3">
              {records.map((record) => (
                <Card
                  key={record.id}
                  className={`glass border-white/40 transition-all ${
                    isSelectMode && selectedIds.includes(record.id) ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={isSelectMode ? () => toggleSelect(record.id) : undefined}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {isSelectMode && (
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                            selectedIds.includes(record.id)
                              ? "bg-primary border-primary text-white"
                              : "border-gray-300 dark:border-gray-600"
                          }`}>
                            {selectedIds.includes(record.id) && <span className="text-xs">✓</span>}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CalendarIcon className="w-4 h-4 text-primary" />
                            <p className="font-medium">
                              {new Date(record.startDate).toLocaleDateString('zh-CN')}
                              {record.endDate && ` - ${new Date(record.endDate).toLocaleDateString('zh-CN')}`}
                            </p>
                          </div>
                          {record.periodLength && (
                            <p className="text-sm text-muted-foreground mb-2">
                              经期长度：{record.periodLength} 天
                            </p>
                          )}
                          {record.symptoms && record.symptoms.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {record.symptoms.map((symptom) => {
                                const symptomInfo = symptoms.find(s => s.value === symptom);
                                return symptomInfo ? (
                                  <span key={symptom} className="text-xs px-2 py-1 rounded-full bg-secondary/50">
                                    {symptomInfo.emoji} {symptomInfo.label}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                          {record.notes && (
                            <p className="text-sm text-muted-foreground">{record.notes}</p>
                          )}
                        </div>
                      </div>
                      {!isSelectMode && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(record.id)}
                          disabled={deleteRecord.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass border-white/40">
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>还没有记录，点击右上角添加第一条记录吧</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
