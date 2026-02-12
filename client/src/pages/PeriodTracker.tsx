import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Calendar as CalendarIcon, Heart, AlertCircle, Trash2, CheckSquare, TrendingUp, Utensils, BarChart3 } from "lucide-react";
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
  { value: "insomnia", label: "失眠", emoji: "😵" },
  { value: "appetite", label: "食欲变化", emoji: "🍽️" },
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

// 辅助函数
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(dateInput: string | Date): string {
  const dateStr = typeof dateInput === "string" ? dateInput : dateInput.toISOString();
  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}年${parseInt(match[2])}月${parseInt(match[3])}日`;
  }
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

function formatShortDate(dateInput: string | Date): string {
  const dateStr = typeof dateInput === "string" ? dateInput : dateInput.toISOString();
  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${parseInt(match[2])}/${parseInt(match[3])}`;
  }
  return "";
}

function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = new Date(typeof date1 === "string" ? date1 : date1.toISOString());
  const d2 = new Date(typeof date2 === "string" ? date2 : date2.toISOString());
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

// 周期曲线图组件
function CycleChart({ cycles, avgCycle }: { cycles: { date: string; days: number }[]; avgCycle: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cycles.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 20, right: 20, bottom: 35, left: 35 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // 清除
    ctx.clearRect(0, 0, w, h);

    const minVal = Math.min(...cycles.map(c => c.days), avgCycle) - 3;
    const maxVal = Math.max(...cycles.map(c => c.days), avgCycle) + 3;
    const range = maxVal - minVal || 1;

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#9ca3af" : "#6b7280";
    const gridColor = isDark ? "rgba(75,85,99,0.3)" : "rgba(209,213,219,0.5)";
    const lineColor = "#ec4899";
    const avgLineColor = isDark ? "rgba(168,85,247,0.6)" : "rgba(168,85,247,0.5)";
    const dotColor = "#ec4899";
    const fillGradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    fillGradient.addColorStop(0, isDark ? "rgba(236,72,153,0.3)" : "rgba(236,72,153,0.15)");
    fillGradient.addColorStop(1, "rgba(236,72,153,0)");

    // 网格线
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + (chartH / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      const val = Math.round(maxVal - (range / gridSteps) * i);
      ctx.fillStyle = textColor;
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(String(val), padding.left - 5, y + 3);
    }

    // X轴标签
    ctx.textAlign = "center";
    ctx.fillStyle = textColor;
    ctx.font = "9px sans-serif";
    cycles.forEach((c, i) => {
      const x = padding.left + (chartW / (cycles.length - 1)) * i;
      ctx.fillText(c.date, x, h - padding.bottom + 15);
    });

    // 平均线
    const avgY = padding.top + chartH * (1 - (avgCycle - minVal) / range);
    ctx.strokeStyle = avgLineColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(padding.left, avgY);
    ctx.lineTo(w - padding.right, avgY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = isDark ? "#a855f7" : "#9333ea";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`平均${avgCycle}天`, w - padding.right + 2, avgY - 3);

    // 数据线 + 填充
    const points = cycles.map((c, i) => ({
      x: padding.left + (chartW / (cycles.length - 1)) * i,
      y: padding.top + chartH * (1 - (c.days - minVal) / range),
    }));

    // 填充区域
    ctx.beginPath();
    ctx.moveTo(points[0].x, h - padding.bottom);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = fillGradient;
    ctx.fill();

    // 曲线
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else {
        const prev = points[i - 1];
        const cpx = (prev.x + p.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
      }
    });
    ctx.stroke();

    // 数据点
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = dotColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 数值标签
      ctx.fillStyle = isDark ? "#f9a8d4" : "#ec4899";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(cycles[i].days), p.x, p.y - 10);
    });

  }, [cycles, avgCycle]);

  if (cycles.length < 2) return null;

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: "200px" }}
    />
  );
}

// 痛经趋势图组件
function PainChart({ data }: { data: { date: string; pain: number; mood: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 20, right: 20, bottom: 35, left: 35 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#9ca3af" : "#6b7280";
    const gridColor = isDark ? "rgba(75,85,99,0.3)" : "rgba(209,213,219,0.5)";

    // 网格线 (1-5)
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 5; i++) {
      const y = padding.top + chartH * (1 - (i - 1) / 4);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(String(i), padding.left - 5, y + 3);
    }

    // X轴标签
    ctx.textAlign = "center";
    ctx.fillStyle = textColor;
    ctx.font = "9px sans-serif";
    data.forEach((d, i) => {
      const x = padding.left + (chartW / (data.length - 1)) * i;
      ctx.fillText(d.date, x, h - padding.bottom + 15);
    });

    // 绘制痛经线
    const drawLine = (values: number[], color: string) => {
      const points = values.map((v, i) => ({
        x: padding.left + (chartW / (data.length - 1)) * i,
        y: padding.top + chartH * (1 - (v - 1) / 4),
      }));

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else {
          const prev = points[i - 1];
          const cpx = (prev.x + p.x) / 2;
          ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
        }
      });
      ctx.stroke();

      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    };

    drawLine(data.map(d => d.pain), "#f97316");
    drawLine(data.map(d => d.mood), "#8b5cf6");

  }, [data]);

  if (data.length < 2) return null;

  return (
    <div>
      <canvas ref={canvasRef} className="w-full" style={{ height: "180px" }} />
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-orange-500 rounded" />
          <span className="text-xs text-muted-foreground dark:text-gray-400">痛经程度</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-purple-500 rounded" />
          <span className="text-xs text-muted-foreground dark:text-gray-400">情绪状态</span>
        </div>
      </div>
    </div>
  );
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
  const [activeTab, setActiveTab] = useState<"overview" | "analysis" | "diet" | "history">("overview");

  const { data: rawRecords, refetch } = trpc.periodTracker.list.useQuery();

  const records = useMemo(() => {
    if (!rawRecords) return null;
    return [...rawRecords].sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
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
    onSuccess: () => { toast.success("记录已删除"); refetch(); },
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
    setStartDateStr(""); setEndDateStr(""); setSelectedSymptoms([]);
    setPainLevel(0); setMoodLevel(0); setNotes("");
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这条记录吗？")) deleteRecord.mutate({ id });
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) { toast.error("请先选择要删除的记录"); return; }
    if (confirm(`确定要删除选中的 ${selectedIds.length} 条记录吗？`)) {
      batchDeleteRecords.mutate({ ids: selectedIds });
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (records && selectedIds.length === records.length) setSelectedIds([]);
    else if (records) setSelectedIds(records.map(r => r.id));
  };

  const handleCreate = () => {
    if (!startDateStr) { toast.error("请选择开始日期"); return; }
    const periodLength = endDateStr && startDateStr ? daysBetween(startDateStr, endDateStr) + 1 : undefined;
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

  // 详细周期分析
  const analysis = useMemo(() => {
    if (!records || records.length < 2) return null;

    const cycles: { date: string; days: number }[] = [];
    for (let i = 1; i < records.length; i++) {
      const cycleDays = daysBetween(records[i - 1].startDate, records[i].startDate);
      if (cycleDays > 15 && cycleDays < 60) {
        cycles.push({ date: formatShortDate(records[i].startDate), days: cycleDays });
      }
    }
    if (cycles.length === 0) return null;

    const cycleDays = cycles.map(c => c.days);
    const avgCycle = Math.round(cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length);
    const minCycle = Math.min(...cycleDays);
    const maxCycle = Math.max(...cycleDays);
    const stdDev = Math.round(Math.sqrt(cycleDays.reduce((sum, d) => sum + Math.pow(d - avgCycle, 2), 0) / cycleDays.length) * 10) / 10;

    const periodLengths = records.filter(r => r.periodLength && r.periodLength > 0 && r.periodLength <= 15).map(r => r.periodLength as number);
    const avgPeriodLength = periodLengths.length > 0 ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length) : 5;
    const minPeriod = periodLengths.length > 0 ? Math.min(...periodLengths) : null;
    const maxPeriod = periodLengths.length > 0 ? Math.max(...periodLengths) : null;

    const regularity = cycles.length > 1 ? Math.max(0, Math.round(100 - (maxCycle - minCycle) / avgCycle * 100)) : null;

    const lastRecord = records[records.length - 1];
    const nextStartDate = new Date(lastRecord.startDate);
    nextStartDate.setDate(nextStartDate.getDate() + avgCycle);
    const nextEndDate = new Date(nextStartDate);
    nextEndDate.setDate(nextEndDate.getDate() + avgPeriodLength - 1);

    const today = new Date();
    const todayNorm = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const nextNorm = new Date(Date.UTC(nextStartDate.getFullYear(), nextStartDate.getMonth(), nextStartDate.getDate()));
    const daysUntilNext = Math.round((nextNorm.getTime() - todayNorm.getTime()) / (1000 * 60 * 60 * 24));

    // 排卵期预测（周期中间前14天）
    const ovulationDate = new Date(nextStartDate);
    ovulationDate.setDate(ovulationDate.getDate() - 14);
    const ovulationStart = new Date(ovulationDate);
    ovulationStart.setDate(ovulationStart.getDate() - 2);
    const ovulationEnd = new Date(ovulationDate);
    ovulationEnd.setDate(ovulationEnd.getDate() + 2);

    // 症状统计
    const symptomCount: Record<string, number> = {};
    records.forEach(r => {
      if (r.symptoms) {
        r.symptoms.forEach((s: string) => {
          symptomCount[s] = (symptomCount[s] || 0) + 1;
        });
      }
    });
    const topSymptoms = Object.entries(symptomCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({
        ...symptoms.find(s => s.value === value),
        count,
        percent: Math.round((count / records.length) * 100),
      }));

    // 痛经和情绪趋势数据
    const painMoodData = records
      .filter(r => r.painLevel || r.moodLevel)
      .slice(-8)
      .map(r => ({
        date: formatShortDate(r.startDate),
        pain: r.painLevel || 0,
        mood: r.moodLevel || 0,
      }));

    // 平均痛经和情绪
    const painRecords = records.filter(r => r.painLevel);
    const moodRecords = records.filter(r => r.moodLevel);
    const avgPain = painRecords.length > 0 ? Math.round(painRecords.reduce((a, r) => a + (r.painLevel || 0), 0) / painRecords.length * 10) / 10 : null;
    const avgMood = moodRecords.length > 0 ? Math.round(moodRecords.reduce((a, r) => a + (r.moodLevel || 0), 0) / moodRecords.length * 10) / 10 : null;

    return {
      cycles,
      avgCycle, minCycle, maxCycle, stdDev,
      avgPeriodLength, minPeriod, maxPeriod,
      regularity,
      nextStartDate, nextEndDate, daysUntilNext,
      ovulationDate, ovulationStart, ovulationEnd,
      topSymptoms,
      painMoodData,
      avgPain, avgMood,
      totalRecords: records.length,
      totalCycles: cycles.length,
    };
  }, [records]);

  // 当前状态
  const currentStatus = useMemo(() => {
    if (!records || records.length === 0 || !analysis) return null;
    const lastRecord = records[records.length - 1];
    const today = new Date();
    const daysSinceStart = daysBetween(lastRecord.startDate, today);
    const { avgCycle, avgPeriodLength } = analysis;

    if (lastRecord.endDate) {
      const daysToEnd = daysBetween(today, lastRecord.endDate);
      if (daysToEnd >= 0) return { status: "period", day: daysSinceStart + 1, message: `经期第${daysSinceStart + 1}天`, color: "text-red-500", bgColor: "from-red-500/10 to-pink-500/10", emoji: "🩸" };
    }
    if (!lastRecord.endDate && daysSinceStart < avgPeriodLength) {
      return { status: "period", day: daysSinceStart + 1, message: `经期第${daysSinceStart + 1}天`, color: "text-red-500", bgColor: "from-red-500/10 to-pink-500/10", emoji: "🩸" };
    } else if (daysSinceStart >= avgCycle - 3 && daysSinceStart < avgCycle) {
      return { status: "pms", day: avgCycle - daysSinceStart, message: `预计${avgCycle - daysSinceStart}天后来`, color: "text-orange-500", bgColor: "from-orange-500/10 to-yellow-500/10", emoji: "⚠️" };
    } else if (daysSinceStart >= avgCycle) {
      return { status: "late", day: daysSinceStart - avgCycle, message: `已延迟${daysSinceStart - avgCycle}天`, color: "text-yellow-600", bgColor: "from-yellow-500/10 to-orange-500/10", emoji: "⏰" };
    } else {
      return { status: "normal", day: daysSinceStart, message: "安全期", color: "text-green-500", bgColor: "from-green-500/10 to-emerald-500/10", emoji: "✨" };
    }
  }, [records, analysis]);

  const todayStr = toLocalDateStr(new Date());
  const tabs = [
    { key: "overview" as const, label: "总览", icon: "📊" },
    { key: "analysis" as const, label: "分析", icon: "📈" },
    { key: "diet" as const, label: "饮食", icon: "🍽️" },
    { key: "history" as const, label: "记录", icon: "📋" },
  ];

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
            {activeTab === "history" && records && records.length > 0 && (
              <Button variant={isSelectMode ? "default" : "ghost"} size="sm"
                onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds([]); }}
                className="dark:text-gray-300 dark:hover:bg-gray-700/50">
                <CheckSquare className="w-4 h-4 mr-1" />
                {isSelectMode ? "取消" : "管理"}
              </Button>
            )}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white">
                  <Plus className="w-4 h-4 mr-1" /> 记录
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">添加经期记录</DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="dark:text-gray-300">开始日期 *</Label>
                      <input type="date" value={startDateStr} onChange={(e) => setStartDateStr(e.target.value)} max={todayStr}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
                    </div>
                    <div className="space-y-2">
                      <Label className="dark:text-gray-300">结束日期</Label>
                      <input type="date" value={endDateStr} onChange={(e) => setEndDateStr(e.target.value)} min={startDateStr || undefined} max={todayStr}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
                    </div>
                  </div>
                  {startDateStr && endDateStr && (
                    <p className="text-xs text-muted-foreground text-center dark:text-gray-400">经期长度：{daysBetween(startDateStr, endDateStr) + 1} 天</p>
                  )}
                  <div className="space-y-2">
                    <Label className="dark:text-gray-300">痛经程度</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {painLevels.map((level) => (
                        <button key={level.value} type="button"
                          className={`p-2 rounded-lg text-center text-xs transition-all ${painLevel === level.value ? "ring-2 ring-pink-500 scale-105 shadow-md" : "hover:scale-105"} ${level.color}`}
                          onClick={() => setPainLevel(painLevel === level.value ? 0 : level.value)}>
                          <div className="text-xl mb-1">{level.emoji}</div>
                          <div>{level.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-gray-300">情绪状态</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {moodLevels.map((level) => (
                        <button key={level.value} type="button"
                          className={`p-2 rounded-lg text-center text-xs transition-all ${moodLevel === level.value ? "ring-2 ring-purple-500 scale-105 shadow-md" : "hover:scale-105"} ${level.color}`}
                          onClick={() => setMoodLevel(moodLevel === level.value ? 0 : level.value)}>
                          <div className="text-xl mb-1">{level.emoji}</div>
                          <div>{level.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-gray-300">症状（可多选）</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {symptoms.map((symptom) => (
                        <button key={symptom.value} type="button"
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${selectedSymptoms.includes(symptom.value) ? "bg-pink-500 text-white shadow-md" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                          onClick={() => setSelectedSymptoms(prev => prev.includes(symptom.value) ? prev.filter(s => s !== symptom.value) : [...prev, symptom.value])}>
                          {symptom.emoji} {symptom.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-gray-300">备注</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="记录一些备注..." rows={3}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">取消</Button>
                    <Button onClick={handleCreate} className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white" disabled={createRecord.isPending}>
                      {createRecord.isPending ? "保存中..." : "保存记录"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Tab 导航 */}
      <div className="sticky top-16 z-40 glass border-b border-white/20 dark:border-gray-700/30">
        <div className="container flex">
          {tabs.map(tab => (
            <button key={tab.key}
              className={`flex-1 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === tab.key ? "border-pink-500 text-pink-600 dark:text-pink-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
              onClick={() => { setActiveTab(tab.key); setIsSelectMode(false); setSelectedIds([]); }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="container py-6 space-y-6">

        {/* ===== 总览 Tab ===== */}
        {activeTab === "overview" && (
          <>
            {/* 当前状态 */}
            {currentStatus && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="glass border-white/40 dark:border-gray-700/40 overflow-hidden">
                  <div className={`bg-gradient-to-r ${currentStatus.bgColor} p-6`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">当前状态</p>
                        <p className={`text-2xl font-bold mt-1 ${currentStatus.color}`}>{currentStatus.emoji} {currentStatus.message}</p>
                      </div>
                      {analysis && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground dark:text-gray-400">下次预计</p>
                          <p className="text-lg font-semibold dark:text-white">{formatDateDisplay(analysis.nextStartDate)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* 核心数据 */}
            {analysis && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="glass border-white/40 dark:border-gray-700/40">
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-pink-500">{analysis.avgCycle}</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">平均周期(天)</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{analysis.minCycle}~{analysis.maxCycle}天</p>
                    </CardContent>
                  </Card>
                  <Card className="glass border-white/40 dark:border-gray-700/40">
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-purple-500">{analysis.avgPeriodLength}</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">平均经期(天)</p>
                      {analysis.minPeriod !== null && <p className="text-xs text-gray-400 dark:text-gray-500">{analysis.minPeriod}~{analysis.maxPeriod}天</p>}
                    </CardContent>
                  </Card>
                  <Card className="glass border-white/40 dark:border-gray-700/40">
                    <CardContent className="p-4 text-center">
                      <p className={`text-3xl font-bold ${analysis.daysUntilNext > 0 ? "text-blue-500" : "text-yellow-500"}`}>
                        {analysis.daysUntilNext > 0 ? analysis.daysUntilNext : analysis.daysUntilNext === 0 ? "今天" : Math.abs(analysis.daysUntilNext)}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                        {analysis.daysUntilNext > 0 ? "距下次(天)" : analysis.daysUntilNext === 0 ? "预计今天" : "已延迟(天)"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="glass border-white/40 dark:border-gray-700/40">
                    <CardContent className="p-4 text-center">
                      {analysis.regularity !== null ? (
                        <>
                          <p className={`text-3xl font-bold ${analysis.regularity >= 80 ? "text-green-500" : analysis.regularity >= 60 ? "text-yellow-500" : "text-red-500"}`}>
                            {analysis.regularity}%
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">周期规律度</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{analysis.regularity >= 80 ? "非常规律" : analysis.regularity >= 60 ? "较为规律" : "不太规律"}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-3xl font-bold text-gray-400">--</p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">周期规律度</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* 预测时间线 */}
            {analysis && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="glass border-white/40 dark:border-gray-700/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base dark:text-white">📅 预测时间线</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <span className="text-2xl">🩸</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">下次经期</p>
                        <p className="text-xs text-red-500/70 dark:text-red-400/70">{formatDateDisplay(analysis.nextStartDate)} ~ {formatDateDisplay(analysis.nextEndDate)}</p>
                      </div>
                      <span className="text-sm font-bold text-red-500">{analysis.avgPeriodLength}天</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <span className="text-2xl">🥚</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">预计排卵期</p>
                        <p className="text-xs text-purple-500/70 dark:text-purple-400/70">{formatDateDisplay(analysis.ovulationStart)} ~ {formatDateDisplay(analysis.ovulationEnd)}</p>
                      </div>
                      <span className="text-sm font-bold text-purple-500">5天</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <span className="text-2xl">✨</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">安全期</p>
                        <p className="text-xs text-green-500/70 dark:text-green-400/70">经期结束后 ~ 排卵期前</p>
                      </div>
                    </div>
                  </CardContent>
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
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-2">🤗 给她的建议</p>
                      <ul className="text-sm text-muted-foreground dark:text-gray-400 space-y-1">
                        {currentStatus.status === "period" ? (
                          <><li>• 多喝热水，保持身体温暖</li><li>• 避免剧烈运动，可以散步或瑜伽</li><li>• 充足睡眠，不要熬夜</li><li>• 吃些温热的食物，避免生冷</li></>
                        ) : (
                          <><li>• 注意保持心情愉快</li><li>• 适当运动，缓解压力</li><li>• 准备好经期用品</li></>
                        )}
                      </ul>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">👦 给男友的建议</p>
                      <ul className="text-sm text-muted-foreground dark:text-gray-400 space-y-1">
                        {currentStatus.status === "period" ? (
                          <><li>• 今天她可能会痛经，多关心她</li><li>• 帮她冲一杯红糖姜茶或热牛奶</li><li>• 情绪可能波动，请耐心一些</li><li>• 主动承担家务，让她好好休息</li></>
                        ) : (
                          <><li>• 她可能会情绪敏感，多关心她</li><li>• 准备一些小惊喜或礼物</li><li>• 耐心倾听，给予鼓励</li></>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {(!records || records.length < 2) && (
              <Card className="glass border-yellow-500/40 dark:border-yellow-500/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1 dark:text-white">需要更多数据</p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">至少记录 2 次经期才能进行周期预测和分析</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ===== 分析 Tab ===== */}
        {activeTab === "analysis" && (
          <>
            {analysis ? (
              <>
                {/* 周期趋势图 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="glass border-white/40 dark:border-gray-700/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                        <TrendingUp className="w-5 h-5 text-pink-500" /> 周期趋势
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CycleChart cycles={analysis.cycles} avgCycle={analysis.avgCycle} />
                    </CardContent>
                  </Card>
                </motion.div>

                {/* 详细数据表格 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <Card className="glass border-white/40 dark:border-gray-700/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                        <BarChart3 className="w-5 h-5 text-purple-500" /> 详细数据
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-2 px-2 text-muted-foreground dark:text-gray-400 font-medium">指标</th>
                              <th className="text-center py-2 px-2 text-muted-foreground dark:text-gray-400 font-medium">平均</th>
                              <th className="text-center py-2 px-2 text-muted-foreground dark:text-gray-400 font-medium">最短</th>
                              <th className="text-center py-2 px-2 text-muted-foreground dark:text-gray-400 font-medium">最长</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-gray-100 dark:border-gray-700/50">
                              <td className="py-2.5 px-2 dark:text-gray-300">月经周期</td>
                              <td className="py-2.5 px-2 text-center font-semibold text-pink-500">{analysis.avgCycle}天</td>
                              <td className="py-2.5 px-2 text-center dark:text-gray-300">{analysis.minCycle}天</td>
                              <td className="py-2.5 px-2 text-center dark:text-gray-300">{analysis.maxCycle}天</td>
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-gray-700/50">
                              <td className="py-2.5 px-2 dark:text-gray-300">经期长度</td>
                              <td className="py-2.5 px-2 text-center font-semibold text-purple-500">{analysis.avgPeriodLength}天</td>
                              <td className="py-2.5 px-2 text-center dark:text-gray-300">{analysis.minPeriod ?? "--"}天</td>
                              <td className="py-2.5 px-2 text-center dark:text-gray-300">{analysis.maxPeriod ?? "--"}天</td>
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-gray-700/50">
                              <td className="py-2.5 px-2 dark:text-gray-300">周期波动</td>
                              <td className="py-2.5 px-2 text-center font-semibold text-blue-500" colSpan={3}>标准差 {analysis.stdDev} 天</td>
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-gray-700/50">
                              <td className="py-2.5 px-2 dark:text-gray-300">规律度</td>
                              <td className="py-2.5 px-2 text-center font-semibold" colSpan={3}>
                                <span className={analysis.regularity !== null ? (analysis.regularity >= 80 ? "text-green-500" : analysis.regularity >= 60 ? "text-yellow-500" : "text-red-500") : "text-gray-400"}>
                                  {analysis.regularity !== null ? `${analysis.regularity}%` : "数据不足"}
                                </span>
                              </td>
                            </tr>
                            {analysis.avgPain !== null && (
                              <tr className="border-b border-gray-100 dark:border-gray-700/50">
                                <td className="py-2.5 px-2 dark:text-gray-300">平均痛经</td>
                                <td className="py-2.5 px-2 text-center font-semibold text-orange-500" colSpan={3}>
                                  {analysis.avgPain}/5 {painLevels.find(p => p.value === Math.round(analysis.avgPain!))?.emoji}
                                </td>
                              </tr>
                            )}
                            {analysis.avgMood !== null && (
                              <tr className="border-b border-gray-100 dark:border-gray-700/50">
                                <td className="py-2.5 px-2 dark:text-gray-300">平均情绪</td>
                                <td className="py-2.5 px-2 text-center font-semibold text-purple-500" colSpan={3}>
                                  {analysis.avgMood}/5 {moodLevels.find(m => m.value === Math.round(analysis.avgMood!))?.emoji}
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td className="py-2.5 px-2 dark:text-gray-300">总记录数</td>
                              <td className="py-2.5 px-2 text-center font-semibold dark:text-white" colSpan={3}>{analysis.totalRecords} 次</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* 痛经和情绪趋势 */}
                {analysis.painMoodData.length >= 2 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="glass border-white/40 dark:border-gray-700/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base dark:text-white">😣 痛经 & 情绪趋势</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <PainChart data={analysis.painMoodData} />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* 常见症状排行 */}
                {analysis.topSymptoms.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Card className="glass border-white/40 dark:border-gray-700/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base dark:text-white">🏥 常见症状排行</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysis.topSymptoms.map((s, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-lg w-8 text-center">{s?.emoji}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium dark:text-gray-300">{s?.label}</span>
                                <span className="text-xs text-muted-foreground dark:text-gray-400">{s?.count}次 ({s?.percent}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div className="bg-gradient-to-r from-pink-400 to-pink-600 h-2 rounded-full transition-all" style={{ width: `${s?.percent}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* 周期历史表格 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="glass border-white/40 dark:border-gray-700/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base dark:text-white">📊 周期历史</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-2 px-2 text-muted-foreground dark:text-gray-400 font-medium">#</th>
                              <th className="text-left py-2 px-2 text-muted-foreground dark:text-gray-400 font-medium">开始日期</th>
                              <th className="text-center py-2 px-2 text-muted-foreground dark:text-gray-400 font-medium">经期</th>
                              <th className="text-center py-2 px-2 text-muted-foreground dark:text-gray-400 font-medium">周期</th>
                              <th className="text-center py-2 px-2 text-muted-foreground dark:text-gray-400 font-medium">痛经</th>
                            </tr>
                          </thead>
                          <tbody>
                            {records && [...records].reverse().map((r, i) => {
                              const cycleInfo = i < (records.length - 1) ? analysis.cycles.find(c => c.date === formatShortDate(r.startDate)) : null;
                              return (
                                <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/50">
                                  <td className="py-2 px-2 text-muted-foreground dark:text-gray-500">{records.length - i}</td>
                                  <td className="py-2 px-2 dark:text-gray-300">{formatShortDate(r.startDate)}</td>
                                  <td className="py-2 px-2 text-center dark:text-gray-300">{r.periodLength ? `${r.periodLength}天` : "--"}</td>
                                  <td className="py-2 px-2 text-center">
                                    {cycleInfo ? (
                                      <span className={cycleInfo.days >= analysis.avgCycle - 3 && cycleInfo.days <= analysis.avgCycle + 3 ? "text-green-500" : "text-orange-500"}>
                                        {cycleInfo.days}天
                                      </span>
                                    ) : "--"}
                                  </td>
                                  <td className="py-2 px-2 text-center">{r.painLevel ? painLevels.find(p => p.value === r.painLevel)?.emoji : "--"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            ) : (
              <Card className="glass border-yellow-500/40 dark:border-yellow-500/20">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                  <p className="font-medium dark:text-white">数据不足</p>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">至少记录 2 次经期才能生成分析报告</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ===== 饮食 Tab ===== */}
        {activeTab === "diet" && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass border-white/40 dark:border-gray-700/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                    <Utensils className="w-5 h-5 text-green-500" /> 经期推荐饮食
                  </CardTitle>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">经期期间身体比较虚弱，合理饮食有助于缓解不适</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 推荐食物 */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                    <h4 className="font-medium text-green-700 dark:text-green-400 mb-3">✅ 推荐食物</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex gap-3">
                        <span className="text-xl">🥩</span>
                        <div>
                          <p className="text-sm font-medium dark:text-gray-300">补铁食物</p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">红肉、猪肝、鸭血、菠菜、黑木耳 — 补充经期流失的铁元素</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xl">🍵</span>
                        <div>
                          <p className="text-sm font-medium dark:text-gray-300">暖身饮品</p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">红糖姜茶、桂圆红枣茶、热牛奶、玫瑰花茶 — 暖宫驱寒</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xl">🐟</span>
                        <div>
                          <p className="text-sm font-medium dark:text-gray-300">优质蛋白</p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">鱼肉、鸡蛋、豆腐、鸡胸肉 — 补充营养，增强体力</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xl">🥜</span>
                        <div>
                          <p className="text-sm font-medium dark:text-gray-300">坚果类</p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">核桃、杏仁、腰果 — 富含维生素E，缓解痛经</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xl">🍌</span>
                        <div>
                          <p className="text-sm font-medium dark:text-gray-300">富钾水果</p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">香蕉、樱桃、苹果、葡萄 — 缓解腹胀和情绪波动</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xl">🥣</span>
                        <div>
                          <p className="text-sm font-medium dark:text-gray-300">温热粥品</p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">红豆薏米粥、小米粥、黑米粥、银耳莲子羹 — 养胃暖身</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 禁忌食物 */}
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                    <h4 className="font-medium text-red-700 dark:text-red-400 mb-3">❌ 禁忌食物</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex gap-3">
                        <span className="text-xl">🧊</span>
                        <div>
                          <p className="text-sm font-medium dark:text-gray-300">生冷食物</p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">冰淇淋、冷饮、冰镇水果、凉拌菜 — 会加重痛经和腹泻</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xl">🌶️</span>
                        <div>
                          <p className="text-sm font-medium dark:text-gray-300">辛辣刺激</p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">辣椒、花椒、麻辣火锅、烧烤 — 刺激子宫收缩，加重痛经</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xl">☕</span>
                        <div>
                          <p className="text-sm font-medium dark:text-gray-300">咖啡因饮品</p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">咖啡、浓茶、可乐 — 会导致乳房胀痛，加重焦虑和失眠</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xl">🍺</span>
                        <div>
                          <p className="text-sm font-medium dark:text-gray-300">酒精</p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">啤酒、白酒、红酒 — 影响经血排出，加重水肿</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xl">🍰</span>
                        <div>
                          <p className="text-sm font-medium dark:text-gray-300">高糖食物</p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">蛋糕、巧克力、糖果（少量黑巧可以）— 血糖波动加重情绪不稳</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xl">🦀</span>
                        <div>
                          <p className="text-sm font-medium dark:text-gray-300">寒性海鲜</p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">螃蟹、田螺、生蚝 — 性寒，容易引起宫寒和痛经</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 不同阶段饮食建议 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="glass border-white/40 dark:border-gray-700/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base dark:text-white">🔄 不同阶段饮食指南</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-red-50/50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
                    <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">🩸 经期（第1-7天）</h4>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">以温补为主，多吃补铁食物。推荐红糖姜茶、当归鸡汤、红枣桂圆粥。避免生冷和辛辣。</p>
                  </div>
                  <div className="bg-pink-50/50 dark:bg-pink-900/10 rounded-xl p-4 border border-pink-100 dark:border-pink-900/30">
                    <h4 className="font-medium text-pink-600 dark:text-pink-400 mb-2">🌱 卵泡期（第8-14天）</h4>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">身体恢复期，适合滋阴补血。推荐银耳莲子羹、枸杞乌鸡汤、黑芝麻糊。可以适当运动。</p>
                  </div>
                  <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-900/30">
                    <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-2">🥚 排卵期（第14-16天）</h4>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">精力最旺盛的阶段。推荐高蛋白食物、新鲜蔬果。可以多吃豆制品，补充植物雌激素。</p>
                  </div>
                  <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-100 dark:border-orange-900/30">
                    <h4 className="font-medium text-orange-600 dark:text-orange-400 mb-2">⚠️ 黄体期/经前期（第17-28天）</h4>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">容易水肿和情绪波动。推荐低盐饮食、富含B6的食物（香蕉、鸡胸肉）。少吃甜食，多喝水。</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 缓解痛经小贴士 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="glass border-white/40 dark:border-gray-700/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base dark:text-white">💡 缓解痛经小贴士</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { emoji: "🌡️", title: "热敷腹部", desc: "用热水袋或暖宝宝敷在小腹" },
                      { emoji: "🧘", title: "轻柔瑜伽", desc: "猫牛式、婴儿式缓解腰腹疼痛" },
                      { emoji: "🛁", title: "热水泡脚", desc: "加入艾草或生姜，促进血液循环" },
                      { emoji: "💆", title: "穴位按摩", desc: "按揉三阴交、合谷穴缓解疼痛" },
                      { emoji: "😴", title: "充足睡眠", desc: "保证8小时睡眠，侧卧最舒适" },
                      { emoji: "🎵", title: "放松心情", desc: "听音乐、看剧，转移注意力" },
                    ].map((tip, i) => (
                      <div key={i} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                        <div className="text-xl mb-1">{tip.emoji}</div>
                        <p className="text-sm font-medium dark:text-gray-300">{tip.title}</p>
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-0.5">{tip.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* ===== 记录 Tab ===== */}
        {activeTab === "history" && (
          <>
            {isSelectMode && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-3 flex items-center justify-between dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={selectAll} className="dark:border-gray-600 dark:text-gray-300">
                    {records && selectedIds.length === records.length ? "取消全选" : "全选"}
                  </Button>
                  <span className="text-sm text-muted-foreground dark:text-gray-400">已选 {selectedIds.length} 项</span>
                </div>
                <Button variant="destructive" size="sm" onClick={handleBatchDelete} disabled={selectedIds.length === 0 || batchDeleteRecords.isPending}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  {batchDeleteRecords.isPending ? "删除中..." : `删除 (${selectedIds.length})`}
                </Button>
              </motion.div>
            )}

            {records && records.length > 0 ? (
              <div className="space-y-3">
                {[...records].reverse().map((record, index) => (
                  <motion.div key={record.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                    <Card className={`glass border-white/40 dark:border-gray-700/40 transition-all ${isSelectMode && selectedIds.includes(record.id) ? "ring-2 ring-pink-500" : ""}`}
                      onClick={isSelectMode ? () => toggleSelect(record.id) : undefined}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {isSelectMode && (
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${selectedIds.includes(record.id) ? "bg-pink-500 border-pink-500 text-white" : "border-gray-300 dark:border-gray-600"}`}>
                                {selectedIds.includes(record.id) && <span className="text-xs">✓</span>}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CalendarIcon className="w-4 h-4 text-pink-500" />
                                <p className="font-medium dark:text-white">
                                  {formatDateDisplay(record.startDate)}
                                  {record.endDate && ` ~ ${formatDateDisplay(record.endDate)}`}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {record.periodLength && record.periodLength > 0 && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">📅 {record.periodLength}天</span>
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
                              {record.notes && <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">{record.notes}</p>}
                            </div>
                          </div>
                          {!isSelectMode && (
                            <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleDelete(record.id)} disabled={deleteRecord.isPending}>
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
                  <p className="text-sm mt-1">点击右上角按钮添加第一条经期记录吧</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
