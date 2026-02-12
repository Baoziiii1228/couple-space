import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Calendar as CalendarIcon, Heart, AlertCircle, Trash2, CheckSquare, TrendingUp, Utensils, BarChart3, AlertTriangle, Thermometer, Droplets, Pill, Scale } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion } from "framer-motion";

// ==================== 常量定义 ====================

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
  { value: "breast_tender", label: "乳房胀痛", emoji: "💔" },
  { value: "dizziness", label: "头晕", emoji: "💫" },
  { value: "constipation", label: "便秘", emoji: "😤" },
  { value: "diarrhea", label: "腹泻", emoji: "😰" },
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

const flowLevels = [
  { value: 1, label: "少量", emoji: "💧", color: "bg-pink-50 text-pink-400 dark:bg-pink-900/20 dark:text-pink-300" },
  { value: 2, label: "正常", emoji: "💧💧", color: "bg-pink-100 text-pink-500 dark:bg-pink-900/30 dark:text-pink-400" },
  { value: 3, label: "偏多", emoji: "💧💧💧", color: "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400" },
  { value: 4, label: "极多", emoji: "💧💧💧💧", color: "bg-red-200 text-red-600 dark:bg-red-900/40 dark:text-red-300" },
];

const dischargeTypes = [
  { value: "none", label: "无", emoji: "⚪" },
  { value: "dry", label: "干燥", emoji: "🔵" },
  { value: "sticky", label: "粘稠", emoji: "🟡" },
  { value: "creamy", label: "乳白色", emoji: "⚪" },
  { value: "watery", label: "水样", emoji: "💧" },
  { value: "egg_white", label: "蛋清样", emoji: "🥚" },
  { value: "spotting", label: "点滴出血", emoji: "🔴" },
];

const medications = [
  { value: "ibuprofen", label: "布洛芬", emoji: "💊" },
  { value: "acetaminophen", label: "对乙酰氨基酚", emoji: "💊" },
  { value: "birth_control", label: "避孕药", emoji: "💊" },
  { value: "iron_supplement", label: "铁剂", emoji: "💊" },
  { value: "vitamin", label: "维生素", emoji: "💊" },
  { value: "chinese_medicine", label: "中药", emoji: "🌿" },
  { value: "other", label: "其他", emoji: "💊" },
];

// ==================== 工具函数 ====================

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(dateInput: string | Date): string {
  const dateStr = typeof dateInput === "string" ? dateInput : dateInput.toISOString();
  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}年${parseInt(match[2])}月${parseInt(match[3])}日`;
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

function formatShortDate(dateInput: string | Date): string {
  const dateStr = typeof dateInput === "string" ? dateInput : dateInput.toISOString();
  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${parseInt(match[2])}/${parseInt(match[3])}`;
  return "";
}

function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = new Date(typeof date1 === "string" ? date1 : date1.toISOString());
  const d2 = new Date(typeof date2 === "string" ? date2 : date2.toISOString());
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return toLocalDateStr(d);
}

// ==================== 图表组件 ====================

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
    const w = rect.width, h = rect.height;
    const padding = { top: 20, right: 20, bottom: 35, left: 35 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    ctx.clearRect(0, 0, w, h);
    const minVal = Math.min(...cycles.map(c => c.days), avgCycle) - 3;
    const maxVal = Math.max(...cycles.map(c => c.days), avgCycle) + 3;
    const range = maxVal - minVal || 1;
    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#9ca3af" : "#6b7280";
    const gridColor = isDark ? "rgba(75,85,99,0.3)" : "rgba(209,213,219,0.5)";
    const lineColor = "#ec4899";
    const avgLineColor = isDark ? "rgba(168,85,247,0.6)" : "rgba(168,85,247,0.5)";
    const fillGradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    fillGradient.addColorStop(0, isDark ? "rgba(236,72,153,0.3)" : "rgba(236,72,153,0.15)");
    fillGradient.addColorStop(1, "rgba(236,72,153,0)");
    // 网格线
    ctx.strokeStyle = gridColor; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH / 5) * i;
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w - padding.right, y); ctx.stroke();
      ctx.fillStyle = textColor; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(String(Math.round(maxVal - (range / 5) * i)), padding.left - 5, y + 3);
    }
    // X轴
    ctx.textAlign = "center"; ctx.fillStyle = textColor; ctx.font = "9px sans-serif";
    cycles.forEach((c, i) => {
      const x = padding.left + (chartW / (cycles.length - 1)) * i;
      ctx.fillText(c.date, x, h - padding.bottom + 15);
    });
    // 平均线
    const avgY = padding.top + chartH * (1 - (avgCycle - minVal) / range);
    ctx.strokeStyle = avgLineColor; ctx.lineWidth = 1; ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(padding.left, avgY); ctx.lineTo(w - padding.right, avgY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = isDark ? "#a855f7" : "#9333ea"; ctx.font = "9px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`平均${avgCycle}天`, w - padding.right + 2, avgY - 3);
    // 数据线
    const points = cycles.map((c, i) => ({
      x: padding.left + (chartW / (cycles.length - 1)) * i,
      y: padding.top + chartH * (1 - (c.days - minVal) / range),
    }));
    ctx.beginPath(); ctx.moveTo(points[0].x, h - padding.bottom);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, h - padding.bottom); ctx.closePath();
    ctx.fillStyle = fillGradient; ctx.fill();
    ctx.strokeStyle = lineColor; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else { const prev = points[i - 1]; const cpx = (prev.x + p.x) / 2; ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y); }
    });
    ctx.stroke();
    points.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = "#ec4899"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = isDark ? "#f9a8d4" : "#ec4899"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(String(cycles[i].days), p.x, p.y - 10);
    });
  }, [cycles, avgCycle]);
  if (cycles.length < 2) return null;
  return <canvas ref={canvasRef} className="w-full" style={{ height: "200px" }} />;
}

function PainChart({ data }: { data: { date: string; pain: number; mood: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    const padding = { top: 20, right: 20, bottom: 35, left: 35 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    ctx.clearRect(0, 0, w, h);
    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#9ca3af" : "#6b7280";
    const gridColor = isDark ? "rgba(75,85,99,0.3)" : "rgba(209,213,219,0.5)";
    ctx.strokeStyle = gridColor; ctx.lineWidth = 0.5;
    for (let i = 1; i <= 5; i++) {
      const y = padding.top + chartH * (1 - (i - 1) / 4);
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w - padding.right, y); ctx.stroke();
      ctx.fillStyle = textColor; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(String(i), padding.left - 5, y + 3);
    }
    ctx.textAlign = "center"; ctx.fillStyle = textColor; ctx.font = "9px sans-serif";
    data.forEach((d, i) => {
      const x = padding.left + (chartW / (data.length - 1)) * i;
      ctx.fillText(d.date, x, h - padding.bottom + 15);
    });
    const drawLine = (values: number[], color: string) => {
      const points = values.map((v, i) => ({
        x: padding.left + (chartW / (data.length - 1)) * i,
        y: padding.top + chartH * (1 - (v - 1) / 4),
      }));
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else { const prev = points[i - 1]; const cpx = (prev.x + p.x) / 2; ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y); }
      });
      ctx.stroke();
      points.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
      });
    };
    drawLine(data.map(d => d.pain), "#f97316");
    drawLine(data.map(d => d.mood), "#a855f7");
    // 图例
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#f97316"; ctx.fillText("● 痛经", w - 70, 12);
    ctx.fillStyle = "#a855f7"; ctx.fillText("● 情绪", w - 30, 12);
  }, [data]);
  if (data.length < 2) return null;
  return <canvas ref={canvasRef} className="w-full" style={{ height: "180px" }} />;
}

// 体温趋势图
function TemperatureChart({ data }: { data: { date: string; temp: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    const padding = { top: 20, right: 20, bottom: 35, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    ctx.clearRect(0, 0, w, h);
    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#9ca3af" : "#6b7280";
    const gridColor = isDark ? "rgba(75,85,99,0.3)" : "rgba(209,213,219,0.5)";
    const minTemp = Math.min(...data.map(d => d.temp)) - 0.2;
    const maxTemp = Math.max(...data.map(d => d.temp)) + 0.2;
    const range = maxTemp - minTemp || 0.5;
    // 网格
    ctx.strokeStyle = gridColor; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w - padding.right, y); ctx.stroke();
      const val = (maxTemp - (range / 4) * i).toFixed(1);
      ctx.fillStyle = textColor; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(val + "°", padding.left - 5, y + 3);
    }
    // 36.7°基准线
    if (minTemp <= 36.7 && maxTemp >= 36.7) {
      const baseY = padding.top + chartH * (1 - (36.7 - minTemp) / range);
      ctx.strokeStyle = isDark ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.3)";
      ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(padding.left, baseY); ctx.lineTo(w - padding.right, baseY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isDark ? "#ef4444" : "#dc2626"; ctx.font = "9px sans-serif"; ctx.textAlign = "left";
      ctx.fillText("36.7° 排卵基准", w - padding.right + 2, baseY - 3);
    }
    // X轴
    ctx.textAlign = "center"; ctx.fillStyle = textColor; ctx.font = "9px sans-serif";
    data.forEach((d, i) => {
      const x = padding.left + (chartW / (data.length - 1)) * i;
      ctx.fillText(d.date, x, h - padding.bottom + 15);
    });
    // 曲线
    const points = data.map((d, i) => ({
      x: padding.left + (chartW / (data.length - 1)) * i,
      y: padding.top + chartH * (1 - (d.temp - minTemp) / range),
    }));
    const fillGrad = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    fillGrad.addColorStop(0, isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.1)");
    fillGrad.addColorStop(1, "rgba(239,68,68,0)");
    ctx.beginPath(); ctx.moveTo(points[0].x, h - padding.bottom);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, h - padding.bottom); ctx.closePath();
    ctx.fillStyle = fillGrad; ctx.fill();
    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else { const prev = points[i - 1]; const cpx = (prev.x + p.x) / 2; ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y); }
    });
    ctx.stroke();
    points.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = isDark ? "#fca5a5" : "#ef4444"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(data[i].temp.toFixed(1), p.x, p.y - 10);
    });
  }, [data]);
  if (data.length < 2) return null;
  return <canvas ref={canvasRef} className="w-full" style={{ height: "180px" }} />;
}

// ==================== 延迟警告组件 ====================

function DelayWarning({ delayDays }: { delayDays: number }) {
  const getWarningLevel = () => {
    if (delayDays <= 7) return {
      level: "mild",
      title: "轻度延迟",
      color: "border-yellow-400 dark:border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20",
      iconColor: "text-yellow-500",
      advice: [
        "月经推迟1-7天属于正常波动范围，不必过度紧张",
        "可能的原因：精神压力大、睡眠不足、饮食不规律、过度运动、情绪波动",
        "建议：保持规律作息，注意放松心情，避免熬夜",
        "如有性生活，可使用验孕试纸排除怀孕可能",
      ],
    };
    if (delayDays <= 14) return {
      level: "moderate",
      title: "明显延迟",
      color: "border-orange-400 dark:border-orange-500/50 bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-500",
      advice: [
        "月经推迟超过7天，需要引起重视",
        "如有性生活史，请立即使用早孕试纸检测（建议晨尿检测，准确率更高）",
        "排除怀孕后，可能的原因：内分泌失调、多囊卵巢综合征(PCOS)、甲状腺功能异常、体重急剧变化",
        "建议：如果持续不来，请在推迟10天后前往医院妇科就诊，检查激素六项和B超",
        "注意：不要自行服用催经药物，需在医生指导下用药",
      ],
    };
    if (delayDays <= 30) return {
      level: "severe",
      title: "严重延迟",
      color: "border-red-400 dark:border-red-500/50 bg-red-50 dark:bg-red-900/20",
      iconColor: "text-red-500",
      advice: [
        "月经推迟超过14天，属于异常情况，请尽快就医",
        "必须排除：宫外孕、先兆流产等紧急情况",
        "常见病因：多囊卵巢综合征(PCOS)、高泌乳素血症、卵巢早衰、子宫内膜病变",
        "就医检查项目：血HCG、性激素六项、甲状腺功能、子宫附件B超",
        "严禁：自行服用黄体酮或其他激素药物催经",
        "注意：即使验孕阴性，也需要就医排除其他病因",
      ],
    };
    return {
      level: "critical",
      title: "闭经警告",
      color: "border-red-600 dark:border-red-600/50 bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600",
      advice: [
        "月经推迟超过30天（非怀孕），医学上已构成「继发性闭经」的诊断标准之一",
        "请立即前往正规医院妇科就诊，不要再等待",
        "需要排除的严重疾病：卵巢早衰、垂体瘤、严重内分泌紊乱、子宫粘连（Asherman综合征）",
        "必做检查：血HCG、性激素六项（FSH/LH/E2/P/T/PRL）、甲状腺功能、AMH、子宫附件B超",
        "如连续3个月无月经，属于闭经，需要系统检查和治疗",
        "严禁：忽视不管、自行用药、听信偏方",
        "提醒：越早就医，治疗效果越好",
      ],
    };
  };

  const warning = getWarningLevel();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`border-2 ${warning.color}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-6 h-6 ${warning.iconColor} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <h3 className={`font-bold text-base ${warning.iconColor}`}>
                {warning.title} — 已延迟 {delayDays} 天
              </h3>
              <div className="mt-3 space-y-2">
                {warning.advice.map((text, i) => (
                  <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="font-medium text-gray-900 dark:text-gray-200">{i === 0 ? "📌" : "•"}</span> {text}
                  </p>
                ))}
              </div>
              {delayDays > 7 && (
                <div className="mt-4 p-3 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">就医科室</p>
                  <p className="text-sm font-semibold dark:text-white">妇科 / 生殖内分泌科</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">建议选择三甲医院，挂号前可先做早孕检测</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ==================== 主组件 ====================

export default function PeriodTracker() {
  useAuth();
  const utils = trpc.useUtils();
  const { data: records } = trpc.periodTracker.list.useQuery();
  const createRecord = trpc.periodTracker.create.useMutation({ onSuccess: () => { utils.periodTracker.list.invalidate(); setIsCreateOpen(false); resetForm(); toast.success("记录已保存"); } });
  const deleteRecord = trpc.periodTracker.delete.useMutation({ onSuccess: () => { utils.periodTracker.list.invalidate(); toast.success("已删除"); } });
  const batchDeleteRecords = trpc.periodTracker.batchDelete.useMutation({ onSuccess: () => { utils.periodTracker.list.invalidate(); setSelectedIds([]); setIsSelectMode(false); toast.success("批量删除成功"); } });

  const [activeTab, setActiveTab] = useState<"overview" | "analysis" | "diet" | "history">("overview");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 表单状态
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [painLevel, setPainLevel] = useState(0);
  const [moodLevel, setMoodLevel] = useState(0);
  const [flowLevel, setFlowLevel] = useState(0);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [temperature, setTemperature] = useState("");
  const [weight, setWeight] = useState("");
  const [discharge, setDischarge] = useState("");
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setStartDateStr(""); setEndDateStr(""); setPainLevel(0); setMoodLevel(0); setFlowLevel(0);
    setSelectedSymptoms([]); setTemperature(""); setWeight(""); setDischarge(""); setSelectedMeds([]); setNotes("");
  };

  const handleCreate = () => {
    if (!startDateStr) { toast.error("请选择开始日期"); return; }
    const periodLength = endDateStr ? daysBetween(startDateStr, endDateStr) + 1 : undefined;
    createRecord.mutate({
      startDate: startDateStr + "T12:00:00.000Z",
      endDate: endDateStr ? endDateStr + "T12:00:00.000Z" : undefined,
      periodLength,
      symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : undefined,
      painLevel: painLevel > 0 ? painLevel : undefined,
      moodLevel: moodLevel > 0 ? moodLevel : undefined,
      flowLevel: flowLevel > 0 ? flowLevel : undefined,
      temperature: temperature || undefined,
      weight: weight || undefined,
      discharge: discharge || undefined,
      medication: selectedMeds.length > 0 ? selectedMeds : undefined,
      notes: notes || undefined,
    });
  };

  const handleDelete = (id: number) => { if (confirm("确定删除这条记录吗？")) deleteRecord.mutate({ id }); };
  const handleBatchDelete = () => { if (selectedIds.length === 0) return; if (confirm(`确定删除选中的 ${selectedIds.length} 条记录吗？`)) batchDeleteRecords.mutate({ ids: selectedIds }); };
  const toggleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const selectAll = () => { if (records) setSelectedIds(selectedIds.length === records.length ? [] : records.map(r => r.id)); };

  // ==================== 数据分析 ====================
  const analysis = useMemo(() => {
    if (!records || records.length < 2) return null;
    const sorted = [...records].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const cycleLengths: number[] = [];
    const cycles: { date: string; days: number }[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const days = daysBetween(sorted[i - 1].startDate, sorted[i].startDate);
      if (days >= 15 && days <= 60) { cycleLengths.push(days); cycles.push({ date: formatShortDate(sorted[i].startDate), days }); }
    }
    if (cycleLengths.length === 0) return null;
    const avgCycle = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
    const minCycle = Math.min(...cycleLengths);
    const maxCycle = Math.max(...cycleLengths);
    const periodLengths = sorted.filter(r => r.periodLength && r.periodLength > 0).map(r => r.periodLength!);
    const avgPeriodLength = periodLengths.length > 0 ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length) : 5;
    const stdDev = Math.sqrt(cycleLengths.reduce((sum, v) => sum + Math.pow(v - avgCycle, 2), 0) / cycleLengths.length);
    const regularity = Math.max(0, Math.min(100, Math.round(100 - stdDev * 10)));
    // 预测
    const lastRecord = sorted[sorted.length - 1];
    const lastStartStr = toLocalDateStr(new Date(lastRecord.startDate));
    const nextStartDate = addDays(lastStartStr, avgCycle);
    const nextEndDate = addDays(nextStartDate, avgPeriodLength - 1);
    const daysUntilNext = daysBetween(toLocalDateStr(new Date()), nextStartDate);
    const ovulationDate = addDays(nextStartDate, -14);
    const ovulationStart = addDays(ovulationDate, -2);
    const ovulationEnd = addDays(ovulationDate, 2);
    // 症状统计
    const symptomCount: Record<string, number> = {};
    sorted.forEach(r => { if (r.symptoms) (r.symptoms as string[]).forEach(s => { symptomCount[s] = (symptomCount[s] || 0) + 1; }); });
    const topSymptoms = Object.entries(symptomCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([value, count]) => {
      const info = symptoms.find(s => s.value === value);
      return { ...info, count, percent: Math.round((count / sorted.length) * 100) };
    });
    // 痛经情绪数据
    const painMoodData = sorted.filter(r => r.painLevel && r.moodLevel).slice(-8).map(r => ({
      date: formatShortDate(r.startDate), pain: r.painLevel!, mood: r.moodLevel!,
    }));
    const painRecords = sorted.filter(r => r.painLevel);
    const moodRecords = sorted.filter(r => r.moodLevel);
    const avgPain = painRecords.length > 0 ? (painRecords.reduce((a, r) => a + r.painLevel!, 0) / painRecords.length).toFixed(1) : "--";
    const avgMood = moodRecords.length > 0 ? (moodRecords.reduce((a, r) => a + r.moodLevel!, 0) / moodRecords.length).toFixed(1) : "--";
    // 体温数据
    const tempData = sorted.filter(r => r.temperature && parseFloat(r.temperature) > 0).slice(-10).map(r => ({
      date: formatShortDate(r.startDate), temp: parseFloat(r.temperature!),
    }));
    // 流量统计
    const flowRecords = sorted.filter(r => r.flowLevel);
    const avgFlow = flowRecords.length > 0 ? (flowRecords.reduce((a, r) => a + r.flowLevel!, 0) / flowRecords.length).toFixed(1) : "--";
    // 体重数据
    const weightData = sorted.filter(r => r.weight && parseFloat(r.weight) > 0).slice(-10).map(r => ({
      date: formatShortDate(r.startDate), weight: parseFloat(r.weight!),
    }));

    return {
      avgCycle, minCycle, maxCycle, avgPeriodLength, stdDev: stdDev.toFixed(1), regularity,
      nextStartDate, nextEndDate, daysUntilNext, ovulationDate, ovulationStart, ovulationEnd,
      topSymptoms, painMoodData, avgPain, avgMood, cycles,
      totalRecords: records.length, totalCycles: cycles.length,
      tempData, avgFlow, weightData,
    };
  }, [records]);

  // 当前状态
  const currentStatus = useMemo(() => {
    if (!records || records.length === 0 || !analysis) return null;
    const sorted = [...records].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const lastRecord = sorted[sorted.length - 1];
    const today = new Date();
    const daysSinceStart = daysBetween(lastRecord.startDate, today);
    const { avgCycle, avgPeriodLength } = analysis;
    if (lastRecord.endDate) {
      const daysToEnd = daysBetween(today, lastRecord.endDate);
      if (daysToEnd >= 0) return { status: "period" as const, day: daysSinceStart + 1, delayDays: 0, message: `经期第${daysSinceStart + 1}天`, color: "text-red-500", bgColor: "from-red-500/10 to-pink-500/10", emoji: "🩸" };
    }
    if (!lastRecord.endDate && daysSinceStart < avgPeriodLength) {
      return { status: "period" as const, day: daysSinceStart + 1, delayDays: 0, message: `经期第${daysSinceStart + 1}天`, color: "text-red-500", bgColor: "from-red-500/10 to-pink-500/10", emoji: "🩸" };
    } else if (daysSinceStart >= avgCycle - 5 && daysSinceStart < avgCycle) {
      return { status: "pms" as const, day: avgCycle - daysSinceStart, delayDays: 0, message: `预计${avgCycle - daysSinceStart}天后来`, color: "text-orange-500", bgColor: "from-orange-500/10 to-yellow-500/10", emoji: "⚠️" };
    } else if (daysSinceStart >= avgCycle) {
      const delayDays = daysSinceStart - avgCycle;
      return { status: "late" as const, day: daysSinceStart, delayDays, message: `已延迟${delayDays}天`, color: "text-red-600", bgColor: "from-red-500/10 to-orange-500/10", emoji: "🚨" };
    } else {
      return { status: "normal" as const, day: daysSinceStart, delayDays: 0, message: "安全期", color: "text-green-500", bgColor: "from-green-500/10 to-emerald-500/10", emoji: "✨" };
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
              <Button variant="ghost" size="icon" className="dark:text-gray-300 dark:hover:bg-gray-700/50"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <h1 className="text-xl font-semibold dark:text-white">🌸 经期记录</h1>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "history" && records && records.length > 0 && (
              <Button variant={isSelectMode ? "default" : "ghost"} size="sm"
                onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds([]); }}
                className="dark:text-gray-300 dark:hover:bg-gray-700/50">
                <CheckSquare className="w-4 h-4 mr-1" />{isSelectMode ? "取消" : "管理"}
              </Button>
            )}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white">
                  <Plus className="w-4 h-4 mr-1" /> 记录
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
                <DialogHeader><DialogTitle className="dark:text-white">添加经期记录</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  {/* 日期 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300 text-xs">开始日期 *</Label>
                      <input type="date" value={startDateStr} onChange={(e) => setStartDateStr(e.target.value)} max={todayStr}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300 text-xs">结束日期</Label>
                      <input type="date" value={endDateStr} onChange={(e) => setEndDateStr(e.target.value)} min={startDateStr || undefined} max={todayStr}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
                    </div>
                  </div>
                  {startDateStr && endDateStr && (
                    <p className="text-xs text-muted-foreground text-center dark:text-gray-400">经期长度：{daysBetween(startDateStr, endDateStr) + 1} 天</p>
                  )}
                  {/* 流量 */}
                  <div className="space-y-1.5">
                    <Label className="dark:text-gray-300 text-xs">经血流量</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {flowLevels.map((level) => (
                        <button key={level.value} type="button"
                          className={`p-2 rounded-lg text-center text-xs transition-all ${flowLevel === level.value ? "ring-2 ring-pink-500 scale-105 shadow-md" : "hover:scale-105"} ${level.color}`}
                          onClick={() => setFlowLevel(flowLevel === level.value ? 0 : level.value)}>
                          <div className="text-sm mb-0.5">{level.emoji}</div>
                          <div>{level.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 痛经 */}
                  <div className="space-y-1.5">
                    <Label className="dark:text-gray-300 text-xs">痛经程度</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {painLevels.map((level) => (
                        <button key={level.value} type="button"
                          className={`p-2 rounded-lg text-center text-xs transition-all ${painLevel === level.value ? "ring-2 ring-pink-500 scale-105 shadow-md" : "hover:scale-105"} ${level.color}`}
                          onClick={() => setPainLevel(painLevel === level.value ? 0 : level.value)}>
                          <div className="text-lg mb-0.5">{level.emoji}</div>
                          <div>{level.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 情绪 */}
                  <div className="space-y-1.5">
                    <Label className="dark:text-gray-300 text-xs">情绪状态</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {moodLevels.map((level) => (
                        <button key={level.value} type="button"
                          className={`p-2 rounded-lg text-center text-xs transition-all ${moodLevel === level.value ? "ring-2 ring-purple-500 scale-105 shadow-md" : "hover:scale-105"} ${level.color}`}
                          onClick={() => setMoodLevel(moodLevel === level.value ? 0 : level.value)}>
                          <div className="text-lg mb-0.5">{level.emoji}</div>
                          <div>{level.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 体温 & 体重 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300 text-xs flex items-center gap-1"><Thermometer className="w-3 h-3" /> 基础体温 (°C)</Label>
                      <input type="number" step="0.1" min="35" max="42" value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="36.5"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="dark:text-gray-300 text-xs flex items-center gap-1"><Scale className="w-3 h-3" /> 体重 (kg)</Label>
                      <input type="number" step="0.1" min="30" max="200" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="50.0"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
                    </div>
                  </div>
                  {/* 分泌物 */}
                  <div className="space-y-1.5">
                    <Label className="dark:text-gray-300 text-xs flex items-center gap-1"><Droplets className="w-3 h-3" /> 分泌物</Label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {dischargeTypes.map((type) => (
                        <button key={type.value} type="button"
                          className={`px-2 py-1.5 rounded-lg text-xs transition-all ${discharge === type.value ? "bg-pink-500 text-white shadow-md" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                          onClick={() => setDischarge(discharge === type.value ? "" : type.value)}>
                          {type.emoji} {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 症状 */}
                  <div className="space-y-1.5">
                    <Label className="dark:text-gray-300 text-xs">症状（可多选）</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {symptoms.map((symptom) => (
                        <button key={symptom.value} type="button"
                          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${selectedSymptoms.includes(symptom.value) ? "bg-pink-500 text-white shadow-md" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                          onClick={() => setSelectedSymptoms(prev => prev.includes(symptom.value) ? prev.filter(s => s !== symptom.value) : [...prev, symptom.value])}>
                          {symptom.emoji} {symptom.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 用药 */}
                  <div className="space-y-1.5">
                    <Label className="dark:text-gray-300 text-xs flex items-center gap-1"><Pill className="w-3 h-3" /> 用药记录</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {medications.map((med) => (
                        <button key={med.value} type="button"
                          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${selectedMeds.includes(med.value) ? "bg-blue-500 text-white shadow-md" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                          onClick={() => setSelectedMeds(prev => prev.includes(med.value) ? prev.filter(m => m !== med.value) : [...prev, med.value])}>
                          {med.emoji} {med.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 备注 */}
                  <div className="space-y-1.5">
                    <Label className="dark:text-gray-300 text-xs">备注</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="记录一些备注..." rows={2}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 text-sm" />
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

            {/* 延迟警告 */}
            {currentStatus && currentStatus.status === "late" && currentStatus.delayDays > 0 && (
              <DelayWarning delayDays={currentStatus.delayDays} />
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
                      <p className="text-3xl font-bold text-rose-500">{analysis.avgPeriodLength}</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">平均经期(天)</p>
                    </CardContent>
                  </Card>
                  <Card className="glass border-white/40 dark:border-gray-700/40">
                    <CardContent className="p-4 text-center">
                      <p className={`text-3xl font-bold ${analysis.daysUntilNext <= 3 ? "text-orange-500" : "text-purple-500"}`}>{analysis.daysUntilNext}</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">距下次(天)</p>
                    </CardContent>
                  </Card>
                  <Card className="glass border-white/40 dark:border-gray-700/40">
                    <CardContent className="p-4 text-center">
                      <p className={`text-3xl font-bold ${analysis.regularity >= 80 ? "text-green-500" : analysis.regularity >= 60 ? "text-yellow-500" : "text-red-500"}`}>{analysis.regularity}%</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">周期规律度</p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* 预测时间线 */}
            {analysis && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="glass border-white/40 dark:border-gray-700/40">
                  <CardHeader className="pb-2"><CardTitle className="text-base dark:text-white">🔮 预测时间线</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <span className="text-xl">🩸</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium dark:text-gray-300">下次经期</p>
                        <p className="text-xs text-muted-foreground dark:text-gray-400">{formatDateDisplay(analysis.nextStartDate)} ~ {formatDateDisplay(analysis.nextEndDate)}</p>
                      </div>
                      <span className="text-sm font-bold text-red-500">{analysis.daysUntilNext}天后</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <span className="text-xl">🥚</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium dark:text-gray-300">排卵期</p>
                        <p className="text-xs text-muted-foreground dark:text-gray-400">{formatDateDisplay(analysis.ovulationStart)} ~ {formatDateDisplay(analysis.ovulationEnd)}</p>
                      </div>
                      <span className="text-xs text-purple-500 font-medium">排卵日 {formatShortDate(analysis.ovulationDate)}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <span className="text-xl">✅</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium dark:text-gray-300">相对安全期</p>
                        <p className="text-xs text-muted-foreground dark:text-gray-400">经期结束后至排卵期前、排卵期后至下次经期前</p>
                      </div>
                    </div>
                    <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">
                      ⚠️ 预测仅供参考，不能作为避孕依据。安全期避孕失败率高达25%，请使用可靠的避孕方式。
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 关怀提示 */}
            {currentStatus && (currentStatus.status === "period" || currentStatus.status === "pms") && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="glass border-white/40 dark:border-gray-700/40">
                  <CardHeader className="pb-2"><CardTitle className="text-base dark:text-white">💕 关怀提示</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {currentStatus.status === "period" ? (
                      <>
                        <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                          <p className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-1">给她 🌸</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">注意保暖，多喝温水，避免剧烈运动。可以热敷小腹缓解不适。饮食以温热为主，忌生冷辛辣。</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">给他 💙</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">她现在可能会比较敏感和疲惫，多一些耐心和关心。可以帮她准备热水袋、煮姜茶，陪她看剧放松。</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                          <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">经前期提醒 ⚠️</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">经前期可能出现情绪波动、乳房胀痛、腹胀等PMS症状。建议减少咖啡因和高盐食物摄入，保持充足睡眠。</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">给他 💙</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">她快来月经了，可能情绪不太稳定，这是正常的生理反应，不是针对你。多包容理解，提前准备好暖宝宝和她爱吃的零食。</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 无数据提示 */}
            {(!records || records.length === 0) && (
              <Card className="glass border-white/40 dark:border-gray-700/40">
                <CardContent className="p-8 text-center text-muted-foreground dark:text-gray-400">
                  <div className="text-4xl mb-3">🌸</div>
                  <p className="font-medium dark:text-gray-300">还没有记录</p>
                  <p className="text-sm mt-1">点击右上角"记录"按钮添加第一条经期记录</p>
                  <p className="text-xs mt-2 text-gray-400">记录越多，预测越准确</p>
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
                {/* 周期趋势 */}
                {analysis.cycles.length >= 2 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="glass border-white/40 dark:border-gray-700/40">
                      <CardHeader className="pb-2"><CardTitle className="text-base dark:text-white">📈 周期趋势</CardTitle></CardHeader>
                      <CardContent><CycleChart cycles={analysis.cycles} avgCycle={analysis.avgCycle} /></CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* 详细数据表格 */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <Card className="glass border-white/40 dark:border-gray-700/40">
                    <CardHeader className="pb-2"><CardTitle className="text-base dark:text-white">📊 详细数据</CardTitle></CardHeader>
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
                              <td className="py-2.5 px-2 dark:text-gray-300">周期长度</td>
                              <td className="py-2.5 px-2 text-center font-semibold text-pink-500">{analysis.avgCycle}天</td>
                              <td className="py-2.5 px-2 text-center dark:text-gray-300">{analysis.minCycle}天</td>
                              <td className="py-2.5 px-2 text-center dark:text-gray-300">{analysis.maxCycle}天</td>
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-gray-700/50">
                              <td className="py-2.5 px-2 dark:text-gray-300">经期长度</td>
                              <td className="py-2.5 px-2 text-center font-semibold text-rose-500" colSpan={3}>{analysis.avgPeriodLength}天</td>
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-gray-700/50">
                              <td className="py-2.5 px-2 dark:text-gray-300">标准差</td>
                              <td className="py-2.5 px-2 text-center font-semibold dark:text-white" colSpan={3}>{analysis.stdDev}天</td>
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-gray-700/50">
                              <td className="py-2.5 px-2 dark:text-gray-300">规律度</td>
                              <td className="py-2.5 px-2 text-center font-semibold" colSpan={3}>
                                <span className={analysis.regularity >= 80 ? "text-green-500" : analysis.regularity >= 60 ? "text-yellow-500" : "text-red-500"}>
                                  {analysis.regularity}% {analysis.regularity >= 80 ? "（规律）" : analysis.regularity >= 60 ? "（较规律）" : "（不规律）"}
                                </span>
                              </td>
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-gray-700/50">
                              <td className="py-2.5 px-2 dark:text-gray-300">平均痛经</td>
                              <td className="py-2.5 px-2 text-center font-semibold text-orange-500" colSpan={3}>{analysis.avgPain}/5</td>
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-gray-700/50">
                              <td className="py-2.5 px-2 dark:text-gray-300">平均情绪</td>
                              <td className="py-2.5 px-2 text-center font-semibold text-purple-500" colSpan={3}>{analysis.avgMood}/5</td>
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-gray-700/50">
                              <td className="py-2.5 px-2 dark:text-gray-300">平均流量</td>
                              <td className="py-2.5 px-2 text-center font-semibold text-pink-500" colSpan={3}>{analysis.avgFlow}/4</td>
                            </tr>
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
                      <CardHeader className="pb-2"><CardTitle className="text-base dark:text-white">😣 痛经 & 情绪趋势</CardTitle></CardHeader>
                      <CardContent><PainChart data={analysis.painMoodData} /></CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* 体温趋势 */}
                {analysis.tempData.length >= 2 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Card className="glass border-white/40 dark:border-gray-700/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base dark:text-white">🌡️ 基础体温趋势</CardTitle>
                        <p className="text-xs text-muted-foreground dark:text-gray-400">排卵后体温通常会升高0.3-0.5°C，持续到下次经期前</p>
                      </CardHeader>
                      <CardContent><TemperatureChart data={analysis.tempData} /></CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* 常见症状排行 */}
                {analysis.topSymptoms.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="glass border-white/40 dark:border-gray-700/40">
                      <CardHeader className="pb-2"><CardTitle className="text-base dark:text-white">🏥 常见症状排行</CardTitle></CardHeader>
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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <Card className="glass border-white/40 dark:border-gray-700/40">
                    <CardHeader className="pb-2"><CardTitle className="text-base dark:text-white">📊 周期历史</CardTitle></CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-2 px-2 text-muted-foreground dark:text-gray-400 font-medium">#</th>
                              <th className="text-left py-2 px-2 text-muted-foreground dark:text-gray-400 font-medium">开始</th>
                              <th className="text-center py-2 px-2 text-muted-foreground dark:text-gray-400 font-medium">经期</th>
                              <th className="text-center py-2 px-2 text-muted-foreground dark:text-gray-400 font-medium">周期</th>
                              <th className="text-center py-2 px-2 text-muted-foreground dark:text-gray-400 font-medium">痛经</th>
                              <th className="text-center py-2 px-2 text-muted-foreground dark:text-gray-400 font-medium">流量</th>
                            </tr>
                          </thead>
                          <tbody>
                            {records && [...records].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((r, i) => {
                              const cycleInfo = analysis.cycles.find(c => c.date === formatShortDate(r.startDate));
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
                                  <td className="py-2 px-2 text-center">{r.flowLevel ? flowLevels.find(f => f.value === r.flowLevel)?.emoji : "--"}</td>
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
            {/* 当前阶段饮食建议 */}
            {currentStatus && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={`border-2 ${currentStatus.status === "period" ? "border-red-300 dark:border-red-500/30 bg-red-50/50 dark:bg-red-900/10" : currentStatus.status === "pms" ? "border-orange-300 dark:border-orange-500/30 bg-orange-50/50 dark:bg-orange-900/10" : "border-green-300 dark:border-green-500/30 bg-green-50/50 dark:bg-green-900/10"}`}>
                  <CardContent className="p-4">
                    <p className="text-sm font-bold dark:text-white mb-2">
                      {currentStatus.status === "period" ? "🩸 你正在经期，饮食需要特别注意：" :
                       currentStatus.status === "pms" ? "⚠️ 经前期，注意调整饮食：" :
                       "✨ 当前处于安全期，饮食相对自由："}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {currentStatus.status === "period" ? "以温补为主，严禁生冷辛辣。多吃补铁食物（红肉、猪肝、菠菜），多喝温热饮品（红糖姜茶、桂圆红枣茶）。避免咖啡、冷饮、螃蟹等寒性食物。" :
                       currentStatus.status === "pms" ? "减少盐分摄入防止水肿，避免咖啡因加重焦虑。多吃富含B6的食物（香蕉、鸡胸肉），适量补充钙和镁。少吃甜食，血糖波动会加重情绪不稳。" :
                       "饮食均衡即可，可以适当多吃高蛋白食物和新鲜蔬果。这个阶段身体状态较好，适合运动和调理。"}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 严格饮食指南 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="glass border-white/40 dark:border-gray-700/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                    <Utensils className="w-5 h-5 text-green-500" /> 经期饮食指南
                  </CardTitle>
                  <p className="text-xs text-red-500 dark:text-red-400 font-medium">以下建议基于妇科营养学，请严格遵守</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 必须吃 */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                    <h4 className="font-bold text-green-700 dark:text-green-400 mb-3">✅ 必须补充的食物</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { emoji: "🥩", title: "补铁食物（每日必须）", desc: "红肉（牛肉最佳）、猪肝、鸭血、菠菜、黑木耳。经期每天流失铁约1mg，不补铁容易贫血导致头晕乏力。", important: true },
                        { emoji: "🍵", title: "温热饮品（每日2-3杯）", desc: "红糖姜茶（驱寒暖宫）、桂圆红枣茶（补血）、热牛奶（补钙安神）、玫瑰花茶（疏肝理气）。", important: true },
                        { emoji: "🐟", title: "优质蛋白", desc: "鱼肉（富含Omega-3抗炎）、鸡蛋、豆腐、鸡胸肉。蛋白质有助于修复子宫内膜。" },
                        { emoji: "🥜", title: "坚果（每日一小把）", desc: "核桃、杏仁、腰果。富含维生素E和不饱和脂肪酸，有助于缓解痛经和调节激素。" },
                        { emoji: "🍌", title: "富钾水果", desc: "香蕉（缓解腹胀）、樱桃（补铁）、苹果（调节肠胃）。避免寒性水果如西瓜、梨。" },
                        { emoji: "🥣", title: "温热粥品", desc: "红豆薏米粥（祛湿）、小米粥（养胃）、黑米粥（补血）、银耳莲子羹（滋阴）。" },
                      ].map((item, i) => (
                        <div key={i} className={`flex gap-3 ${item.important ? "bg-green-100/50 dark:bg-green-800/20 p-2 rounded-lg" : ""}`}>
                          <span className="text-xl">{item.emoji}</span>
                          <div>
                            <p className={`text-sm font-medium dark:text-gray-300 ${item.important ? "text-green-800 dark:text-green-300" : ""}`}>{item.title}</p>
                            <p className="text-xs text-muted-foreground dark:text-gray-400">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 严格禁止 */}
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                    <h4 className="font-bold text-red-700 dark:text-red-400 mb-3">🚫 严格禁止的食物</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { emoji: "🧊", title: "一切生冷食物", desc: "冰淇淋、冷饮、冰镇水果、凉拌菜、沙拉。生冷食物会导致子宫收缩加剧，血液凝滞，加重痛经和血块。", danger: true },
                        { emoji: "🌶️", title: "辛辣刺激食物", desc: "辣椒、花椒、麻辣火锅、烧烤。辛辣食物刺激盆腔充血，加重痛经，还可能导致经量增多。", danger: true },
                        { emoji: "☕", title: "咖啡因饮品", desc: "咖啡、浓茶、可乐、功能饮料。咖啡因会收缩血管，加重痛经，还会导致乳房胀痛、焦虑和失眠。", danger: true },
                        { emoji: "🍺", title: "酒精类", desc: "啤酒、白酒、红酒、鸡尾酒。酒精会扩张血管导致经量增多，影响肝脏代谢雌激素，加重水肿。" },
                        { emoji: "🍰", title: "高糖食物", desc: "蛋糕、奶茶、糖果、甜甜圈。血糖剧烈波动会加重情绪不稳和疲劳。（少量黑巧克力70%以上可以）" },
                        { emoji: "🦀", title: "寒性海鲜", desc: "螃蟹、田螺、生蚝、蛤蜊。中医认为性寒，容易引起宫寒和痛经加重。虾和鱼可以适量吃。" },
                        { emoji: "🥒", title: "寒性蔬果", desc: "西瓜、梨、苦瓜、冬瓜、绿豆。这些食物性寒，经期食用容易导致经血不畅。" },
                      ].map((item, i) => (
                        <div key={i} className={`flex gap-3 ${item.danger ? "bg-red-100/50 dark:bg-red-800/20 p-2 rounded-lg" : ""}`}>
                          <span className="text-xl">{item.emoji}</span>
                          <div>
                            <p className={`text-sm font-medium dark:text-gray-300 ${item.danger ? "text-red-800 dark:text-red-300" : ""}`}>{item.title}</p>
                            <p className="text-xs text-muted-foreground dark:text-gray-400">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 四个阶段饮食指南 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="glass border-white/40 dark:border-gray-700/40">
                <CardHeader className="pb-3"><CardTitle className="text-base dark:text-white">🔄 月经周期四阶段饮食</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-red-50/50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
                    <h4 className="font-bold text-red-600 dark:text-red-400 mb-2">🩸 月经期（第1-7天）— 温补排毒</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-400 mb-2">重点：补铁补血、暖宫驱寒</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">推荐：当归鸡汤、红枣桂圆粥、红糖姜茶、猪肝菠菜汤。前3天经量最多时以流食为主，后期可逐渐恢复正常饮食。</p>
                  </div>
                  <div className="bg-pink-50/50 dark:bg-pink-900/10 rounded-xl p-4 border border-pink-100 dark:border-pink-900/30">
                    <h4 className="font-bold text-pink-600 dark:text-pink-400 mb-2">🌱 卵泡期（第8-13天）— 滋阴养血</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-400 mb-2">重点：补充雌激素、促进卵泡发育</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">推荐：银耳莲子羹、枸杞乌鸡汤、黑芝麻糊、豆浆（含植物雌激素）。这个阶段精力恢复，适合加强营养。</p>
                  </div>
                  <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-900/30">
                    <h4 className="font-bold text-purple-600 dark:text-purple-400 mb-2">🥚 排卵期（第14-16天）— 促排助孕</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-400 mb-2">重点：高蛋白、促进排卵</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">推荐：高蛋白食物（鱼虾、鸡蛋）、新鲜蔬果、豆制品。精力最旺盛的阶段，可以适当增加运动量。</p>
                  </div>
                  <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-100 dark:border-orange-900/30">
                    <h4 className="font-bold text-orange-600 dark:text-orange-400 mb-2">⚠️ 黄体期（第17-28天）— 疏肝健脾</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-400 mb-2">重点：低盐防水肿、稳定情绪</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">推荐：富含B6的食物（香蕉、鸡胸肉、三文鱼）、富含镁的食物（深绿蔬菜、坚果）。减少盐分和咖啡因，多喝水。</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 缓解痛经 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="glass border-white/40 dark:border-gray-700/40">
                <CardHeader className="pb-3"><CardTitle className="text-base dark:text-white">💡 缓解痛经方法</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { emoji: "🌡️", title: "热敷腹部", desc: "热水袋或暖宝宝敷小腹20-30分钟，温度40-45°C" },
                      { emoji: "💊", title: "止痛药", desc: "布洛芬（痛前30分钟服用效果最佳），遵医嘱用药" },
                      { emoji: "🧘", title: "轻柔运动", desc: "猫牛式、婴儿式瑜伽，散步。避免剧烈运动" },
                      { emoji: "🛁", title: "热水泡脚", desc: "加艾草或生姜，水温42°C，泡15-20分钟" },
                      { emoji: "💆", title: "穴位按摩", desc: "三阴交穴（内踝上四指）、合谷穴，每次按3分钟" },
                      { emoji: "😴", title: "充足睡眠", desc: "保证7-8小时，左侧卧位最舒适，减少腹部压迫" },
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

            {/* 重要提醒 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-2 border-red-300 dark:border-red-500/30 bg-red-50/50 dark:bg-red-900/10">
                <CardContent className="p-4">
                  <h4 className="font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> 重要健康提醒
                  </h4>
                  <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                    <p>• 以上饮食建议为一般性指导，个人体质不同，如有特殊疾病请遵医嘱</p>
                    <p>• 痛经严重影响日常生活时（如无法正常工作/学习），请就医检查排除子宫内膜异位症等疾病</p>
                    <p>• 经量突然明显增多或减少、经期超过7天、经间期出血，均需就医</p>
                    <p>• 不要盲目相信"食疗偏方"，科学就医才是正确选择</p>
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
                {[...records].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((record, index) => (
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
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {record.periodLength && record.periodLength > 0 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">📅 {record.periodLength}天</span>
                                )}
                                {record.flowLevel && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                    {flowLevels.find(f => f.value === record.flowLevel)?.emoji} {flowLevels.find(f => f.value === record.flowLevel)?.label}
                                  </span>
                                )}
                                {record.painLevel && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                                    {painLevels.find(p => p.value === record.painLevel)?.emoji} {painLevels.find(p => p.value === record.painLevel)?.label}
                                  </span>
                                )}
                                {record.moodLevel && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                    {moodLevels.find(m => m.value === record.moodLevel)?.emoji} {moodLevels.find(m => m.value === record.moodLevel)?.label}
                                  </span>
                                )}
                                {record.temperature && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400">🌡️ {record.temperature}°C</span>
                                )}
                                {record.weight && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400">⚖️ {record.weight}kg</span>
                                )}
                              </div>
                              {record.symptoms && (record.symptoms as string[]).length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {(record.symptoms as string[]).map((symptom) => {
                                    const symptomInfo = symptoms.find(s => s.value === symptom);
                                    return symptomInfo ? (
                                      <span key={symptom} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                        {symptomInfo.emoji} {symptomInfo.label}
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              )}
                              {record.medication && (record.medication as string[]).length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {(record.medication as string[]).map((med) => {
                                    const medInfo = medications.find(m => m.value === med);
                                    return medInfo ? (
                                      <span key={med} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                        {medInfo.emoji} {medInfo.label}
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
