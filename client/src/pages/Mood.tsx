import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths } from "date-fns";
import { zhCN } from "date-fns/locale";

const moodOptions = [
  { value: "happy", emoji: "😊", label: "开心", color: "bg-yellow-100 dark:bg-yellow-900/30", score: 5 },
  { value: "excited", emoji: "🤩", label: "兴奋", color: "bg-orange-100 dark:bg-orange-900/30", score: 5 },
  { value: "peaceful", emoji: "😌", label: "平静", color: "bg-green-100 dark:bg-green-900/30", score: 4 },
  { value: "loving", emoji: "🥰", label: "甜蜜", color: "bg-pink-100 dark:bg-pink-900/30", score: 5 },
  { value: "sad", emoji: "😢", label: "难过", color: "bg-blue-100 dark:bg-blue-900/30", score: 2 },
  { value: "angry", emoji: "😠", label: "生气", color: "bg-red-100 dark:bg-red-900/30", score: 1 },
  { value: "anxious", emoji: "😰", label: "焦虑", color: "bg-purple-100 dark:bg-purple-900/30", score: 2 },
  { value: "tired", emoji: "😴", label: "疲惫", color: "bg-gray-100 dark:bg-gray-700/30", score: 3 },
] as const;

type MoodValue = typeof moodOptions[number]["value"];

export default function Mood() {
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null);
  const [note, setNote] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showTrend, setShowTrend] = useState(false);

  const { data: todayMood, refetch: refetchToday } = trpc.mood.getTodayMood.useQuery();
  const { data: moodRecords, refetch: refetchRecords } = trpc.mood.list.useQuery({
    startDate: startOfMonth(currentMonth).toISOString(),
    endDate: endOfMonth(currentMonth).toISOString(),
  });

  // 获取最近3个月的数据用于趋势图
  const { data: trendRecords } = trpc.mood.list.useQuery({
    startDate: startOfMonth(subMonths(new Date(), 2)).toISOString(),
    endDate: endOfMonth(new Date()).toISOString(),
  });

  const recordMood = trpc.mood.record.useMutation({
    onSuccess: () => {
      toast.success("心情已记录！");
      setSelectedMood(null);
      setNote("");
      refetchToday();
      refetchRecords();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleRecord = () => {
    if (!selectedMood) {
      toast.error("请选择今天的心情");
      return;
    }
    recordMood.mutate({ mood: selectedMood, note: note || undefined });
  };

  // 生成日历数据
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const startDay = start.getDay();
    const paddingDays = Array(startDay).fill(null);
    return [...paddingDays, ...days];
  }, [currentMonth]);

  // 获取某天的心情
  const getMoodForDay = (day: Date) => {
    if (!moodRecords) return null;
    const record = moodRecords.find(r => isSameDay(new Date(r.date), day));
    if (!record) return null;
    return moodOptions.find(m => m.value === record.mood);
  };

  // 心情趋势数据（按周统计平均分）
  const trendData = useMemo(() => {
    if (!trendRecords || trendRecords.length === 0) return [];
    
    // 按周分组
    const weeks: Record<string, { scores: number[]; label: string }> = {};
    trendRecords.forEach(r => {
      const date = new Date(r.date);
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const key = format(weekStart, "MM/dd");
      if (!weeks[key]) weeks[key] = { scores: [], label: key };
      const moodOpt = moodOptions.find(m => m.value === r.mood);
      if (moodOpt) weeks[key].scores.push(moodOpt.score);
    });

    return Object.values(weeks).map(w => ({
      label: w.label,
      avg: w.scores.reduce((a, b) => a + b, 0) / w.scores.length,
    })).slice(-8); // 最近8周
  }, [trendRecords]);

  // 心情统计
  const moodStats = useMemo(() => {
    if (!moodRecords || moodRecords.length === 0) return null;
    const total = moodRecords.length;
    const counts: Record<string, number> = {};
    moodRecords.forEach(r => {
      counts[r.mood] = (counts[r.mood] || 0) + 1;
    });
    
    // 计算平均心情分
    let totalScore = 0;
    moodRecords.forEach(r => {
      const opt = moodOptions.find(m => m.value === r.mood);
      if (opt) totalScore += opt.score;
    });
    const avgScore = totalScore / total;
    
    // 最常见心情
    const topMood = Object.entries(counts).sort(([,a],[,b]) => b - a)[0];
    const topMoodOption = moodOptions.find(m => m.value === topMood[0]);
    
    return { total, counts, avgScore, topMoodOption, topCount: topMood[1] };
  }, [moodRecords]);

  const todayMoodOption = todayMood ? moodOptions.find(m => m.value === todayMood.mood) : null;
  const maxTrendScore = 5;

  return (
    <div className="min-h-screen gradient-warm-subtle">
      <header className="sticky top-0 z-50 glass border-b border-white/20 dark:border-white/10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">心情打卡</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setShowTrend(!showTrend)}
          >
            <TrendingUp className="w-4 h-4" />
            趋势
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 今日心情 */}
        <Card className="glass border-white/40 dark:border-white/10">
          <CardContent className="p-6">
            {todayMoodOption ? (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">今天的心情</p>
                <div className="text-6xl mb-2">{todayMoodOption.emoji}</div>
                <p className="font-medium">{todayMoodOption.label}</p>
                {todayMood?.note && (
                  <p className="text-sm text-muted-foreground mt-2">"{todayMood.note}"</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-center text-muted-foreground mb-4">今天心情怎么样？</p>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.value}
                      className={`p-3 rounded-xl text-center transition-all ${
                        selectedMood === mood.value
                          ? "ring-2 ring-primary bg-primary/10 scale-105"
                          : `${mood.color} hover:scale-105`
                      }`}
                      onClick={() => setSelectedMood(mood.value)}
                    >
                      <div className="text-2xl mb-1">{mood.emoji}</div>
                      <div className="text-xs">{mood.label}</div>
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="写点什么吧...（可选）"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mb-4"
                  rows={2}
                />
                <Button 
                  className="w-full" 
                  onClick={handleRecord}
                  disabled={!selectedMood || recordMood.isPending}
                >
                  {recordMood.isPending ? "记录中..." : "记录心情"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 心情趋势图 */}
        {showTrend && trendData.length > 0 && (
          <Card className="glass border-white/40 dark:border-white/10">
            <CardContent className="p-6">
              <h2 className="font-semibold mb-4">心情趋势（近8周平均）</h2>
              <div className="flex items-end gap-2 h-40">
                {trendData.map((week, i) => {
                  const height = (week.avg / maxTrendScore) * 100;
                  const getBarColor = (score: number) => {
                    if (score >= 4.5) return "bg-green-400";
                    if (score >= 3.5) return "bg-yellow-400";
                    if (score >= 2.5) return "bg-orange-400";
                    return "bg-red-400";
                  };
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">{week.avg.toFixed(1)}</span>
                      <div className="w-full flex items-end" style={{ height: '120px' }}>
                        <div
                          className={`w-full rounded-t-md transition-all duration-500 ${getBarColor(week.avg)}`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{week.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400" /> 很好</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400" /> 不错</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400" /> 一般</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" /> 低落</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 本月统计概览 */}
        {moodStats && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="glass border-white/40 dark:border-white/10">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">打卡天数</p>
                <p className="text-2xl font-bold text-primary">{moodStats.total}</p>
              </CardContent>
            </Card>
            <Card className="glass border-white/40 dark:border-white/10">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">平均心情</p>
                <p className="text-2xl font-bold text-primary">{moodStats.avgScore.toFixed(1)}</p>
              </CardContent>
            </Card>
            <Card className="glass border-white/40 dark:border-white/10">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">最多心情</p>
                <p className="text-2xl">{moodStats.topMoodOption?.emoji}</p>
                <p className="text-xs text-muted-foreground">{moodStats.topCount}次</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 心情日历 */}
        <Card className="glass border-white/40 dark:border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                ←
              </Button>
              <h2 className="font-semibold">
                {format(currentMonth, "yyyy年MM月", { locale: zhCN })}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                →
              </Button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                <div key={day} className="text-center text-sm text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }
                
                const mood = getMoodForDay(day);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm ${
                      isToday ? "ring-2 ring-primary" : ""
                    } ${mood ? mood.color : "bg-secondary/30"}`}
                  >
                    <span className={isToday ? "font-bold" : ""}>{day.getDate()}</span>
                    {mood && <span className="text-lg leading-none">{mood.emoji}</span>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 心情分布 */}
        {moodRecords && moodRecords.length > 0 && (
          <Card className="glass border-white/40 dark:border-white/10">
            <CardContent className="p-6">
              <h2 className="font-semibold mb-4">本月心情分布</h2>
              <div className="space-y-3">
                {moodOptions.map((mood) => {
                  const count = moodRecords.filter(r => r.mood === mood.value).length;
                  if (count === 0) return null;
                  const percentage = (count / moodRecords.length) * 100;
                  return (
                    <div key={mood.value} className="flex items-center gap-3">
                      <span className="text-xl w-8 text-center">{mood.emoji}</span>
                      <span className="text-sm w-10">{mood.label}</span>
                      <div className="flex-1 h-6 bg-secondary/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${mood.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">{count}次 ({percentage.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
