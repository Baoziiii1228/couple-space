import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Plus, Calendar as CalendarIcon, Heart, AlertCircle } from "lucide-react";
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

    // 计算平均周期长度
    const cycles: number[] = [];
    for (let i = 1; i < records.length; i++) {
      const prev = new Date(records[i - 1].startDate);
      const curr = new Date(records[i].startDate);
      const cycleDays = Math.ceil((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      cycles.push(cycleDays);
    }

    const avgCycle = Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length);

    // 计算平均经期长度
    const periodLengths = records
      .filter(r => r.periodLength)
      .map(r => r.periodLength as number);
    const avgPeriodLength = periodLengths.length > 0
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : 5;

    // 预测下次经期
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

    // 如果有结束日期且在经期内
    if (lastRecord.endDate) {
      const lastEndDate = new Date(lastRecord.endDate);
      if (today <= lastEndDate) {
        return { status: "period", message: "经期中", color: "text-red-500" };
      }
    }

    // 根据平均周期判断
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
                          if (selectedSymptoms.includes(symptom.value)) {
                            setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom.value));
                          } else {
                            setSelectedSymptoms([...selectedSymptoms, symptom.value]);
                          }
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
      </header>

      <main className="container py-6 space-y-6">
        {/* 当前状态 */}
        {currentStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass border-white/40">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">当前状态</p>
                    <p className={`text-2xl font-bold ${currentStatus.color}`}>
                      {currentStatus.message}
                    </p>
                  </div>
                  <Heart className={`w-12 h-12 ${currentStatus.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 预测信息 */}
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass border-white/40">
              <CardHeader>
                <CardTitle className="text-lg">📅 周期预测</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">平均周期</p>
                    <p className="text-2xl font-bold text-primary">{prediction.avgCycle} 天</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">平均经期</p>
                    <p className="text-2xl font-bold text-accent">{prediction.avgPeriodLength} 天</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">预计下次经期</p>
                  <p className="text-lg font-semibold mb-1">
                    {prediction.nextStartDate.toLocaleDateString('zh-CN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {prediction.daysUntilNext > 0 
                      ? `还有 ${prediction.daysUntilNext} 天`
                      : `已延迟 ${Math.abs(prediction.daysUntilNext)} 天`
                    }
                  </p>
                </div>
                {/* 关怀建议 */}
                {prediction.daysUntilNext > 0 && prediction.daysUntilNext <= 3 && (
                  <div className="pt-4 border-t bg-pink-50 dark:bg-pink-900/10 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                    <p className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-2">
                      💕 给男友的关怀提示
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 提前准备红糖、暖宝宝、止痛药</li>
                      <li>• 多关心她的情绪，耐心倾听</li>
                      <li>• 准备她喜欢的零食和水果</li>
                      <li>• 帮她做家务，让她多休息</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 当前状态关怀建议 */}
        {currentStatus && (currentStatus.status === "period" || currentStatus.status === "pms") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50/50 to-rose-50/50 dark:from-pink-900/10 dark:to-rose-900/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
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
                <Card key={record.id} className="glass border-white/40">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
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
