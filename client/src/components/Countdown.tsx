import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

interface CountdownProps {
  targetDate: Date;
  title: string;
  emoji?: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
}

function TimeUnit({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ scale: 1.1, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl md:text-2xl shadow-lg ${color}`}
      >
        {String(value).padStart(2, "0")}
      </motion.div>
      <span className="text-xs text-muted-foreground mt-1.5">{label}</span>
    </div>
  );
}

export default function Countdown({ targetDate, title, emoji, className = "" }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate));
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate]);
  
  // 根据剩余时间选择颜色
  const colors = useMemo(() => {
    if (timeLeft.days <= 3) {
      // 紧急 - 红色系
      return {
        days: "bg-gradient-to-br from-red-500 to-rose-600",
        hours: "bg-gradient-to-br from-rose-500 to-pink-600",
        minutes: "bg-gradient-to-br from-pink-500 to-rose-600",
        seconds: "bg-gradient-to-br from-rose-400 to-red-500",
      };
    } else if (timeLeft.days <= 7) {
      // 临近 - 橙色系
      return {
        days: "bg-gradient-to-br from-orange-500 to-amber-600",
        hours: "bg-gradient-to-br from-amber-500 to-orange-600",
        minutes: "bg-gradient-to-br from-orange-400 to-amber-500",
        seconds: "bg-gradient-to-br from-amber-400 to-orange-500",
      };
    } else {
      // 正常 - 暖色渐变
      return {
        days: "bg-gradient-to-br from-rose-500 to-orange-500",
        hours: "bg-gradient-to-br from-orange-500 to-amber-500",
        minutes: "bg-gradient-to-br from-amber-500 to-yellow-500",
        seconds: "bg-gradient-to-br from-yellow-500 to-orange-400",
      };
    }
  }, [timeLeft.days]);
  
  if (timeLeft.total <= 0) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-lg font-medium mb-2">
          {emoji} {title}
        </p>
        <motion.p
          initial={{ scale: 0.8 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-2xl font-bold text-primary"
        >
          🎉 今天就是这一天！
        </motion.p>
      </div>
    );
  }
  
  return (
    <div className={`${className}`}>
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">距离</p>
        <p className="text-lg font-semibold">
          {emoji && <span className="mr-1">{emoji}</span>}
          {title}
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-2 md:gap-3">
        <TimeUnit value={timeLeft.days} label="天" color={colors.days} />
        <span className="text-2xl font-bold text-muted-foreground/50 mt-[-20px]">:</span>
        <TimeUnit value={timeLeft.hours} label="时" color={colors.hours} />
        <span className="text-2xl font-bold text-muted-foreground/50 mt-[-20px]">:</span>
        <TimeUnit value={timeLeft.minutes} label="分" color={colors.minutes} />
        <span className="text-2xl font-bold text-muted-foreground/50 mt-[-20px]">:</span>
        <TimeUnit value={timeLeft.seconds} label="秒" color={colors.seconds} />
      </div>
    </div>
  );
}
