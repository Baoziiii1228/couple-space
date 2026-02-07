import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Smile } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { zhCN } from "date-fns/locale";

const moodOptions = [
  { value: "happy", emoji: "😊", label: "开心", color: "bg-yellow-100 dark:bg-yellow-900/30" },
  { value: "excited", emoji: "🤩", label: "兴奋", color: "bg-orange-100 dark:bg-orange-900/30" },
  { value: "peaceful", emoji: "😌", label: "平静", color: "bg-green-100 dark:bg-green-900/30" },
  { value: "loving", emoji: "🥰", label: "甜蜜", color: "bg-pink-100 dark:bg-pink-900/30" },
  { value: "sad", emoji: "😢", label: "难过", color: "bg-blue-100 dark:bg-blue-900/30" },
  { value: "angry", emoji: "😠", label: "生气", color: "bg-red-100 dark:bg-red-900/30" },
  { value: "anxious", emoji: "😰", label: "焦虑", color: "bg-purple-100 dark:bg-purple-900/30" },
  { value: "tired", emoji: "😴", label: "疲惫", color: "bg-gray-100 dark:bg-gray-700/30" },
] as const;

type MoodValue = typeof moodOptions[number]["value"];

export default function Mood() {
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null);
  const [note, setNote] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: todayMood, refetch: refetchToday } = trpc.mood.getTodayMood.useQuery();
  const { data: moodRecords, refetch: refetchRecords } = trpc.mood.list.useQuery({
    startDate: startOfMonth(currentMonth).toISOString(),
    endDate: endOfMonth(currentMonth).toISOString(),
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
    
    // 填充前面的空白
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

  const todayMoodOption = todayMood ? moodOptions.find(m => m.value === todayMood.mood) : null;

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
            
            {/* 星期标题 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                <div key={day} className="text-center text-sm text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* 日历格子 */}
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

        {/* 心情统计 */}
        {moodRecords && moodRecords.length > 0 && (
          <Card className="glass border-white/40 dark:border-white/10">
            <CardContent className="p-6">
              <h2 className="font-semibold mb-4">本月心情统计</h2>
              <div className="flex flex-wrap gap-4">
                {moodOptions.map((mood) => {
                  const count = moodRecords.filter(r => r.mood === mood.value).length;
                  if (count === 0) return null;
                  return (
                    <div key={mood.value} className="flex items-center gap-2">
                      <span className="text-xl">{mood.emoji}</span>
                      <span className="text-sm">{count}次</span>
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
