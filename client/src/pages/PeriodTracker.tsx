import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Calendar as CalendarIcon, Heart, AlertCircle, Trash2, CheckSquare, Zap } from "lucide-react";
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
  { value: 1, label: "轻微", emoji: "🙂", color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
  { value: 2, label: "轻度", emoji: "😐", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: 3, label: "中度", emoji: "😟", color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { value: 4, label: "中重度", emoji: "😣", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: 5, label: "严重", emoji: "😭", color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
];

const moodLevels = [
  { value: 1, label: "很好", emoji: "😄", color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
  { value: 2, label: "还行", emoji: "😊", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: 3, label: "一般", emoji: "😐", color: "bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400" },
  { value: 4, label: "不好", emoji: "😞", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: 5, label: "很差", emoji: "😢", color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
];

// 辅助函数：将日期转为本地 YYYY-MM-DD 字符串
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 辅助函数：将日期字符串或Date对象转为本地日期显示
function formatDateDisplay(dateInput: string | Date): string {
  const dateStr = typeof dateInput === "string" ? dateInput : dateInput.toISOString();
  // 尝试提取 YYYY-MM-DD 部分
  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}年${parseInt(match[2])}月${parseInt(match[3])}日`;
  }
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

// 辅助函数：计算两个日期字符串之间的天数差
function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = new Date(typeof date1 === "string" ? date1 : date1.toISOString());
  const d2 = new Date(typeof date2 === "string" ? date2 : date2.toISOString());
  // 归一化到UTC午夜
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export default function PeriodTracker() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [painLevel, setPainLevel] = useState<number>(0);
  const [moodLevel, setMoodLevel] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: rawRecords, refetch } = trpc.periodTracker.list.useQuery();

  // 确保记录按开始日期排序（从早到晚）
  const records = useMemo(() => {
    if (!rawRecords) return null;
    return [...rawRecords].sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [rawRecords]);

  const createRecord = trpc.periodTracker.create.useMutation({
    onSuccess: () => {
      toast.success("经期记录已添加 💕");
      setIsCreateOpen(false);
      resetForm();
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

  const resetForm = () => {
    setStartDateStr("");
    setEndDateStr("");
    setSelectedSymptoms([]);
    setPainLevel(0);
    setMoodLevel(0);
    setNotes("");
  };

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

  // 快速记录：今天来了
  const handleQuickRecord = () => {
    const todayStr = toLocalDateStr(new Date());
    createRecord.mutate({
      startDate: todayStr + "T12:00:00.000Z",
      symptoms: [],
      notes: "",
    } as any);
  };

  const handleCreate = () => {
    if (!startDateStr) {
      toast.error("请选择开始日期");
      return;
    }

    const periodLength = endDateStr && startDateStr
      ? daysBetween(startDateStr, endDateStr) + 1
      : undefined;

    // 使用中午12:00避免时区偏移问题
    createRecord.mutate({
      startDate: startDateStr + "T12:00:00.000Z",
      endDate: endDateStr ? endDateStr + "T12:00:00.000Z" : undefined,
      periodLength: periodLength && periodLength > 0 ? periodLength : undefined,
      symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : undefined,
      painLevel: painLevel || undefined,
      moodLevel: moodLevel || undefined,
      notes: notes || undefined,
    } as any);
  };

  // 计算平均周期和预测
  const prediction = useMemo(() => {
    if (!records || records.length < 2) return null;

    const cycles: number[] = [];
    for (let i = 1; i < records.length; i++) {
      const cycleDays = daysBetween(records[i - 1].startDate, records[i].startDate);
      if (cycleDays > 15 && cycleDays < 60) {
        // 只计算合理范围内的周期（15-60天）
        cycles.push(cycleDays);
      }
    }

    if (cycles.length === 0) return null;

    const avgCycle = Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length);

    const periodLengths = records
      .filter(r => r.periodLength && r.periodLength > 0 && r.periodLength <= 15)
      .map(r => r.periodLength as number);
    const avgPeriodLength = periodLengths.length > 0
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : 5;

    const lastRecord = records[records.length - 1];
    const lastStartDate = new Date(lastRecord.startDate);
    const nextStartDate = new Date(lastStartDate);
    nextStartDate.setDate(nextStartDate.getDate() + avgCycle);

    const today = new Date();
    const todayNorm = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const nextNorm = new Date(Date.UTC(nextStartDate.getFullYear(), nextStartDate.getMonth(), nextStartDate.getDate()));
    const daysUntilNext = Math.round((nextNorm.getTime() - todayNorm.getTime()) / (1000 * 60 * 60 * 24));

    return {
      avgCycle,
      avgPeriodLength,
      nextStartDate,
      daysUntilNext,
      lastStartDate,
      cycleRegularity: cycles.length > 1 
        ? Math.round(100 - (Math.max(...cycles) - Math.min(...cycles)) / avgCycle * 100)
        : null,
    };
  }, [records]);

  // 计算当前状态
  const currentStatus = useMemo(() => {
    if (!records || records.length === 0) return null;

    const lastRecord = records[records.length - 1];
    const today = new Date();
    const daysSinceStart = daysBetween(lastRecord.startDate, today);

    // 如果有结束日期且还在经期中
    if (lastRecord.endDate) {
      const daysToEnd = daysBetween(today, lastRecord.endDate);
      if (daysToEnd >= 0) {
        return { status: "period", day: daysSinceStart + 1, message: `经期第${daysSinceStart + 1}天`, color: "text-red-500", bgColor: "from-red-500/10 to-pink-500/10" };
      }
    }

    if (prediction) {
      const { avgCycle, avgPeriodLength } = prediction;

      if (!lastRecord.endDate && daysSinceStart < avgPeriodLength) {
        return { status: "period", day: daysSinceStart + 1, message: `经期第${daysSinceStart + 1}天`, color: "text-red-500", bgColor: "from-red-500/10 to-pink-500/10" };
      } else if (daysSinceStart >= avgCycle - 3 && daysSinceStart < avgCycle) {
        return { status: "pms", day: avgCycle - daysSinceStart, message: `预计${avgCycle - daysSinceStart}天后来`, color: "text-orange-500", bgColor: "from-orange-500/10 to-yellow-500/10" };
      } else if (daysSinceStart >= avgCycle) {
        return { status: "late", day: daysSinceStart - avgCycle, message: `已延迟${daysSinceStart - avgCycle}天`, color: "text-yellow-600", bgColor: "from-yellow-500/10 to-orange-500/10" };
      } else {
        const safeDay = daysSinceStart - avgPeriodLength + 1;
        return { status: "normal", day: safeDay, message: "安全期", color: "text-green-500", bgColor: "from-green-500/10 to-emerald-500/10" };
      }
    }

    return null;
  }, [records, prediction]);

  // 今天的日期字符串
  const todayStr = toLocalDateStr(new Date());

  return (
    <div className="min-h-screen gradient-warm-subtle">
      <header className="sticky top-0 z-50 glass border-b border-white/20 dark:border-gray-700/30">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="dark:text-gray-300 dark:hover:bg-gray-700/50">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold dark:text-white">🌸 经期记录</h1>
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
                className="dark:text-gray-300 dark:hover:bg-gray-700/50"
              >
                <CheckSquare className="w-4 h-4 mr-1" />
                {isSelectMode ? "取消" : "管理"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 快速操作区 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleQuickRecord}
              disabled={createRecord.isPending}
              className="h-14 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl shadow-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              {createRecord.isPending ? "记录中..." : "今天来了"}
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl shadow-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  详细记录
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">添加经期记录</DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  {/* 日期选择 - 使用紧凑的输入框 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="dark:text-gray-300">开始日期 *</Label>
                      <input
                        type="date"
                        value={startDateStr}
                        onChange={(e) => setStartDateStr(e.target.value)}
                        max={todayStr}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="dark:text-gray-300">结束日期</Label>
                      <input
                        type="date"
                        value={endDateStr}
                        onChange={(e) => setEndDateStr(e.target.value)}
                        min={startDateStr || undefined}
                        max={todayStr}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  {startDateStr && endDateStr && (
                    <p className="text-xs text-muted-foreground text-center dark:text-gray-400">
                      经期长度：{daysBetween(startDateStr, endDateStr) + 1} 天
                    </p>
                  )}

                  {/* 痛经程度 */}
                  <div className="space-y-2">
                    <Label className="dark:text-gray-300">痛经程度</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {painLevels.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          className={`p-2 rounded-lg text-center text-xs transition-all ${
                            painLevel === level.value
                              ? "ring-2 ring-pink-500 scale-105 shadow-md"
                              : "hover:scale-105"
                          } ${level.color}`}
                          onClick={() => setPainLevel(painLevel === level.value ? 0 : level.value)}
                        >
                          <div className="text-xl mb-1">{level.emoji}</div>
                          <div>{level.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 情绪状态 */}
                  <div className="space-y-2">
                    <Label className="dark:text-gray-300">情绪状态</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {moodLevels.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          className={`p-2 rounded-lg text-center text-xs transition-all ${
                            moodLevel === level.value
                              ? "ring-2 ring-purple-500 scale-105 shadow-md"
                              : "hover:scale-105"
                          } ${level.color}`}
                          onClick={() => setMoodLevel(moodLevel === level.value ? 0 : level.value)}
                        >
                          <div className="text-xl mb-1">{level.emoji}</div>
                          <div>{level.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 症状选择 */}
                  <div className="space-y-2">
                    <Label className="dark:text-gray-300">症状（可多选）</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {symptoms.map((symptom) => (
                        <button
                          key={symptom.value}
                          type="button"
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${
                            selectedSymptoms.includes(symptom.value)
                              ? "bg-pink-500 text-white shadow-md"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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

                  {/* 备注 */}
                  <div className="space-y-2">
                    <Label className="dark:text-gray-300">备注</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="记录一些备注..."
                      rows={3}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>

                  {/* 按钮 */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                      className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleCreate}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                      disabled={createRecord.isPending}
                    >
                      {createRecord.isPending ? "保存中..." : "保存记录"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* 批量操作栏 */}
        {isSelectMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-3 flex items-center justify-between dark:bg-gray-800/50"
          >
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={selectAll} className="dark:border-gray-600 dark:text-gray-300">
                {records && selectedIds.length === records.length ? "取消全选" : "全选"}
              </Button>
              <span className="text-sm text-muted-foreground dark:text-gray-400">
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

        {/* 当前状态卡片 */}
        {currentStatus && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="glass border-white/40 dark:border-gray-700/40 overflow-hidden">
              <div className={`bg-gradient-to-r ${currentStatus.bgColor} p-5`}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-lg dark:text-white">当前状态</h3>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full bg-white/60 dark:bg-gray-800/60 ${currentStatus.color}`}>
                    {currentStatus.message}
                  </span>
                </div>
                {currentStatus.status === "period" && (
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                    记得注意保暖，多喝热水哦 💕
                  </p>
                )}
                {currentStatus.status === "pms" && (
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                    快来了，提前准备好经期用品哦 🌸
                  </p>
                )}
                {currentStatus.status === "late" && (
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                    经期延迟了，注意观察身体状况 💗
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* 预测卡片 */}
        {prediction && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass border-white/40 dark:border-gray-700/40 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 p-5">
                <h3 className="font-semibold text-lg mb-4 dark:text-white">📊 周期分析</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-pink-500">{prediction.avgCycle}</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">平均周期(天)</p>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-purple-500">{prediction.avgPeriodLength}</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">平均经期(天)</p>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-blue-500">
                      {prediction.daysUntilNext > 0 ? prediction.daysUntilNext : prediction.daysUntilNext === 0 ? "今天" : `延${Math.abs(prediction.daysUntilNext)}`}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                      {prediction.daysUntilNext > 0 ? "距下次(天)" : prediction.daysUntilNext === 0 ? "预计今天来" : "已延迟(天)"}
                    </p>
                  </div>
                  {prediction.cycleRegularity !== null && (
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                      <p className={`text-2xl font-bold ${prediction.cycleRegularity >= 80 ? "text-green-500" : prediction.cycleRegularity >= 60 ? "text-yellow-500" : "text-red-500"}`}>
                        {prediction.cycleRegularity}%
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">周期规律度</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground dark:text-gray-400 mt-4 text-center">
                  预计下次经期：{formatDateDisplay(prediction.nextStartDate)}
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* 关怀提示 */}
        {currentStatus && (currentStatus.status === "period" || currentStatus.status === "pms") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="glass border-pink-500/30 dark:border-pink-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                  <Heart className="w-5 h-5 text-pink-500" />
                  {currentStatus.status === "period" ? "经期关怀" : "经前期关怀"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentStatus.status === "period" ? (
                  <>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-2">🤗 给她的建议</p>
                      <ul className="text-sm text-muted-foreground dark:text-gray-400 space-y-1">
                        <li>• 多喝热水，保持身体温暖</li>
                        <li>• 避免剧烈运动，可以散步或瑜伽</li>
                        <li>• 充足睡眠，不要熬夜</li>
                        <li>• 吃些温热的食物，避免生冷</li>
                      </ul>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">👦 给男友的建议</p>
                      <ul className="text-sm text-muted-foreground dark:text-gray-400 space-y-1">
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
                      <ul className="text-sm text-muted-foreground dark:text-gray-400 space-y-1">
                        <li>• 注意保持心情愉快</li>
                        <li>• 适当运动，缓解压力</li>
                        <li>• 准备好经期用品</li>
                      </ul>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">👦 给男友的建议</p>
                      <ul className="text-sm text-muted-foreground dark:text-gray-400 space-y-1">
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
          <Card className="glass border-yellow-500/40 dark:border-yellow-500/20">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm mb-1 dark:text-white">需要更多数据</p>
                <p className="text-xs text-muted-foreground dark:text-gray-400">
                  至少记录 2 次经期才能进行周期预测和分析哦
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 历史记录 */}
        <div>
          <h2 className="text-lg font-semibold mb-4 dark:text-white">📋 历史记录</h2>
          {records && records.length > 0 ? (
            <div className="space-y-3">
              {[...records].reverse().map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    className={`glass border-white/40 dark:border-gray-700/40 transition-all ${
                      isSelectMode && selectedIds.includes(record.id) ? "ring-2 ring-pink-500" : ""
                    }`}
                    onClick={isSelectMode ? () => toggleSelect(record.id) : undefined}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {isSelectMode && (
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                              selectedIds.includes(record.id)
                                ? "bg-pink-500 border-pink-500 text-white"
                                : "border-gray-300 dark:border-gray-600"
                            }`}>
                              {selectedIds.includes(record.id) && <span className="text-xs">✓</span>}
                            </div>
                          )}
                          <div className="flex-1">
                            {/* 日期行 */}
                            <div className="flex items-center gap-2 mb-2">
                              <CalendarIcon className="w-4 h-4 text-pink-500" />
                              <p className="font-medium dark:text-white">
                                {formatDateDisplay(record.startDate)}
                                {record.endDate && ` ~ ${formatDateDisplay(record.endDate)}`}
                              </p>
                            </div>

                            {/* 信息标签行 */}
                            <div className="flex flex-wrap gap-2 mb-2">
                              {record.periodLength && record.periodLength > 0 && (
                                <span className="text-xs px-2 py-1 rounded-full bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
                                  📅 {record.periodLength}天
                                </span>
                              )}
                              {record.painLevel && (
                                <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                                  {painLevels.find(p => p.value === record.painLevel)?.emoji} 痛经{painLevels.find(p => p.value === record.painLevel)?.label}
                                </span>
                              )}
                              {record.moodLevel && (
                                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                  {moodLevels.find(m => m.value === record.moodLevel)?.emoji} 情绪{moodLevels.find(m => m.value === record.moodLevel)?.label}
                                </span>
                              )}
                            </div>

                            {/* 症状 */}
                            {record.symptoms && record.symptoms.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {record.symptoms.map((symptom) => {
                                  const symptomInfo = symptoms.find(s => s.value === symptom);
                                  return symptomInfo ? (
                                    <span key={symptom} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                      {symptomInfo.emoji} {symptomInfo.label}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            )}

                            {/* 备注 */}
                            {record.notes && (
                              <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">{record.notes}</p>
                            )}
                          </div>
                        </div>
                        {!isSelectMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDelete(record.id)}
                            disabled={deleteRecord.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="glass border-white/40 dark:border-gray-700/40">
              <CardContent className="p-8 text-center text-muted-foreground dark:text-gray-400">
                <div className="text-4xl mb-3">🌸</div>
                <p className="font-medium dark:text-gray-300">还没有记录</p>
                <p className="text-sm mt-1">点击上方按钮添加第一条经期记录吧</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
