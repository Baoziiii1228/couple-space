import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface CoupleAnimationProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { width: 120, height: 100 },
  md: { width: 160, height: 130 },
  lg: { width: 200, height: 160 },
  xl: { width: 240, height: 200 },
};

// Q版小男孩小女孩 - 青涩恋爱
function YoungCouple({ width, height }: { width: number; height: number }) {
  const scale = width / 240;
  return (
    <svg viewBox="0 0 240 200" width={width} height={height} className="overflow-visible">
      {/* 小男孩 */}
      <g transform="translate(60, 40)">
        {/* 身体 */}
        <ellipse cx="30" cy="110" rx="25" ry="35" fill="#6B9BD2" />
        {/* 头 */}
        <circle cx="30" cy="50" r="35" fill="#FFE4C4" />
        {/* 头发 */}
        <path d="M5 35 Q10 15 30 12 Q50 15 55 35 Q55 25 50 20 Q40 10 30 8 Q20 10 10 20 Q5 25 5 35" fill="#4A3728" />
        {/* 眼睛 */}
        <ellipse cx="20" cy="50" rx="4" ry="5" fill="#333" />
        <ellipse cx="40" cy="50" rx="4" ry="5" fill="#333" />
        <circle cx="21" cy="48" r="1.5" fill="#fff" />
        <circle cx="41" cy="48" r="1.5" fill="#fff" />
        {/* 腮红 */}
        <ellipse cx="12" cy="60" rx="6" ry="4" fill="#FFB6C1" opacity="0.5" />
        <ellipse cx="48" cy="60" rx="6" ry="4" fill="#FFB6C1" opacity="0.5" />
        {/* 微笑 */}
        <path d="M22 65 Q30 72 38 65" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* 手臂 */}
        <ellipse cx="55" cy="100" rx="8" ry="12" fill="#FFE4C4" transform="rotate(20 55 100)" />
      </g>
      
      {/* 小女孩 */}
      <g transform="translate(120, 40)">
        {/* 裙子 */}
        <path d="M5 95 Q30 85 55 95 L60 145 Q30 155 0 145 Z" fill="#FFB6C1" />
        {/* 身体上部 */}
        <ellipse cx="30" cy="95" rx="20" ry="15" fill="#FFB6C1" />
        {/* 头 */}
        <circle cx="30" cy="50" r="35" fill="#FFE4C4" />
        {/* 头发 */}
        <path d="M-5 50 Q0 20 30 15 Q60 20 65 50 Q65 35 55 25 Q40 10 30 8 Q20 10 5 25 Q-5 35 -5 50" fill="#5C4033" />
        {/* 双马尾 */}
        <ellipse cx="-8" cy="55" rx="12" ry="20" fill="#5C4033" />
        <ellipse cx="68" cy="55" rx="12" ry="20" fill="#5C4033" />
        {/* 蝴蝶结 */}
        <path d="M-15 40 Q-8 35 -8 45 Q-8 35 -1 40 L-8 45 Z" fill="#FF69B4" />
        <path d="M61 40 Q68 35 68 45 Q68 35 75 40 L68 45 Z" fill="#FF69B4" />
        {/* 眼睛 */}
        <ellipse cx="20" cy="50" rx="5" ry="6" fill="#333" />
        <ellipse cx="40" cy="50" rx="5" ry="6" fill="#333" />
        <circle cx="21" cy="48" r="2" fill="#fff" />
        <circle cx="41" cy="48" r="2" fill="#fff" />
        {/* 睫毛 */}
        <path d="M15 44 L13 41 M18 43 L17 40 M21 43 L21 40" stroke="#333" strokeWidth="1" />
        <path d="M35 43 L35 40 M38 43 L39 40 M41 44 L43 41" stroke="#333" strokeWidth="1" />
        {/* 腮红 */}
        <ellipse cx="12" cy="60" rx="6" ry="4" fill="#FFB6C1" opacity="0.6" />
        <ellipse cx="48" cy="60" rx="6" ry="4" fill="#FFB6C1" opacity="0.6" />
        {/* 微笑 */}
        <path d="M22 65 Q30 73 38 65" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* 手臂 */}
        <ellipse cx="5" cy="100" rx="8" ry="12" fill="#FFE4C4" transform="rotate(-20 5 100)" />
      </g>
      
      {/* 爱心 */}
      <g transform="translate(108, 20)">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
          fill="#FF6B8A" transform="scale(1.2)" />
      </g>
    </svg>
  );
}

// 婚纱西服 - 步入婚姻
function WeddingCouple({ width, height }: { width: number; height: number }) {
  return (
    <svg viewBox="0 0 240 200" width={width} height={height} className="overflow-visible">
      {/* 新郎 */}
      <g transform="translate(50, 30)">
        {/* 西服 */}
        <path d="M10 90 L10 150 L50 150 L50 90 Q30 80 10 90" fill="#2C3E50" />
        {/* 衬衫领 */}
        <path d="M20 90 L30 100 L40 90" fill="#fff" />
        {/* 领带 */}
        <path d="M27 100 L30 140 L33 100 Z" fill="#C0392B" />
        {/* 头 */}
        <circle cx="30" cy="55" r="32" fill="#FFE4C4" />
        {/* 头发 */}
        <path d="M5 45 Q10 25 30 20 Q50 25 55 45 Q55 35 48 28 Q38 18 30 16 Q22 18 12 28 Q5 35 5 45" fill="#2C2C2C" />
        {/* 眼睛 */}
        <ellipse cx="20" cy="52" rx="4" ry="5" fill="#333" />
        <ellipse cx="40" cy="52" rx="4" ry="5" fill="#333" />
        <circle cx="21" cy="50" r="1.5" fill="#fff" />
        <circle cx="41" cy="50" r="1.5" fill="#fff" />
        {/* 微笑 */}
        <path d="M22 68 Q30 76 38 68" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* 手臂 */}
        <ellipse cx="52" cy="110" rx="8" ry="14" fill="#2C3E50" transform="rotate(15 52 110)" />
      </g>
      
      {/* 新娘 */}
      <g transform="translate(120, 30)">
        {/* 婚纱裙摆 */}
        <path d="M-10 90 Q30 80 70 90 L80 160 Q30 175 -20 160 Z" fill="#FFF8F0" />
        <path d="M-5 90 Q30 82 65 90 L72 155 Q30 168 -12 155 Z" fill="#FFFFFF" />
        {/* 婚纱上身 */}
        <ellipse cx="30" cy="90" rx="22" ry="18" fill="#FFFFFF" />
        {/* 头 */}
        <circle cx="30" cy="55" r="32" fill="#FFE4C4" />
        {/* 头发 */}
        <path d="M0 55 Q5 25 30 18 Q55 25 60 55 Q60 40 52 30 Q40 15 30 13 Q20 15 8 30 Q0 40 0 55" fill="#5C4033" />
        {/* 头纱 */}
        <ellipse cx="30" cy="10" rx="35" ry="15" fill="#FFFFFF" opacity="0.7" />
        <path d="M-5 10 Q30 -5 65 10 L70 55 Q30 45 -10 55 Z" fill="#FFFFFF" opacity="0.4" />
        {/* 皇冠/头饰 */}
        <path d="M15 18 L20 8 L25 15 L30 5 L35 15 L40 8 L45 18" stroke="#FFD700" strokeWidth="2" fill="none" />
        {/* 眼睛 */}
        <ellipse cx="20" cy="52" rx="5" ry="6" fill="#333" />
        <ellipse cx="40" cy="52" rx="5" ry="6" fill="#333" />
        <circle cx="21" cy="50" r="2" fill="#fff" />
        <circle cx="41" cy="50" r="2" fill="#fff" />
        {/* 睫毛 */}
        <path d="M15 46 L13 43 M18 45 L17 42 M21 45 L21 42" stroke="#333" strokeWidth="1" />
        <path d="M35 45 L35 42 M38 45 L39 42 M41 46 L43 43" stroke="#333" strokeWidth="1" />
        {/* 腮红 */}
        <ellipse cx="12" cy="62" rx="6" ry="4" fill="#FFB6C1" opacity="0.5" />
        <ellipse cx="48" cy="62" rx="6" ry="4" fill="#FFB6C1" opacity="0.5" />
        {/* 微笑 */}
        <path d="M22 68 Q30 76 38 68" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* 捧花 */}
        <g transform="translate(0, 100)">
          <circle cx="10" cy="10" r="8" fill="#FFB6C1" />
          <circle cx="18" cy="5" r="7" fill="#FF69B4" />
          <circle cx="5" cy="5" r="6" fill="#FFC0CB" />
          <circle cx="12" cy="0" r="5" fill="#FFB6C1" />
          <path d="M10 18 L10 30" stroke="#228B22" strokeWidth="3" />
        </g>
      </g>
      
      {/* 爱心 */}
      <g transform="translate(105, 5)">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
          fill="#FF6B8A" transform="scale(1.5)" />
      </g>
    </svg>
  );
}

// 白头偕老 - 老年夫妻
function ElderlyCouple({ width, height }: { width: number; height: number }) {
  return (
    <svg viewBox="0 0 240 200" width={width} height={height} className="overflow-visible">
      {/* 老爷爷 */}
      <g transform="translate(45, 35)">
        {/* 身体 */}
        <path d="M10 85 L10 145 L55 145 L55 85 Q32 75 10 85" fill="#8B7355" />
        {/* 头 */}
        <circle cx="32" cy="50" r="32" fill="#FFE4C4" />
        {/* 白发 */}
        <path d="M8 45 Q12 30 32 25 Q52 30 56 45 Q56 38 50 32 Q40 22 32 20 Q24 22 14 32 Q8 38 8 45" fill="#E8E8E8" />
        {/* 眼睛 */}
        <ellipse cx="22" cy="50" rx="3" ry="4" fill="#333" />
        <ellipse cx="42" cy="50" rx="3" ry="4" fill="#333" />
        {/* 眼镜 */}
        <circle cx="22" cy="50" r="10" stroke="#8B4513" strokeWidth="2" fill="none" />
        <circle cx="42" cy="50" r="10" stroke="#8B4513" strokeWidth="2" fill="none" />
        <path d="M32 50 L32 50" stroke="#8B4513" strokeWidth="2" />
        <path d="M12 48 L5 45" stroke="#8B4513" strokeWidth="2" />
        <path d="M52 48 L59 45" stroke="#8B4513" strokeWidth="2" />
        {/* 皱纹 */}
        <path d="M15 42 Q18 40 21 42" stroke="#D4A574" strokeWidth="1" fill="none" />
        <path d="M43 42 Q46 40 49 42" stroke="#D4A574" strokeWidth="1" fill="none" />
        {/* 微笑 */}
        <path d="M24 68 Q32 74 40 68" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* 拐杖 */}
        <path d="M65 90 L65 160 Q65 165 60 165 L55 165" stroke="#8B4513" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* 手 */}
        <ellipse cx="62" cy="95" rx="8" ry="10" fill="#FFE4C4" />
      </g>
      
      {/* 老奶奶 */}
      <g transform="translate(125, 35)">
        {/* 身体/旗袍 */}
        <path d="M5 85 L5 145 L55 145 L55 85 Q30 75 5 85" fill="#C41E3A" />
        {/* 旗袍花纹 */}
        <circle cx="20" cy="110" r="5" fill="#FFD700" opacity="0.6" />
        <circle cx="40" cy="120" r="4" fill="#FFD700" opacity="0.6" />
        <circle cx="25" cy="135" r="3" fill="#FFD700" opacity="0.6" />
        {/* 头 */}
        <circle cx="30" cy="50" r="32" fill="#FFE4C4" />
        {/* 白发盘发 */}
        <ellipse cx="30" cy="30" rx="28" ry="20" fill="#E8E8E8" />
        <ellipse cx="30" cy="20" rx="15" ry="12" fill="#D8D8D8" />
        {/* 发簪 */}
        <path d="M20 15 L40 15" stroke="#FFD700" strokeWidth="3" />
        <circle cx="20" cy="15" r="4" fill="#FF6B6B" />
        {/* 眼睛 */}
        <ellipse cx="20" cy="52" rx="3" ry="4" fill="#333" />
        <ellipse cx="40" cy="52" rx="3" ry="4" fill="#333" />
        {/* 皱纹 */}
        <path d="M13 44 Q16 42 19 44" stroke="#D4A574" strokeWidth="1" fill="none" />
        <path d="M41 44 Q44 42 47 44" stroke="#D4A574" strokeWidth="1" fill="none" />
        {/* 腮红 */}
        <ellipse cx="12" cy="60" rx="5" ry="3" fill="#FFB6C1" opacity="0.4" />
        <ellipse cx="48" cy="60" rx="5" ry="3" fill="#FFB6C1" opacity="0.4" />
        {/* 微笑 */}
        <path d="M22 68 Q30 74 38 68" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* 搀扶的手 */}
        <ellipse cx="0" cy="100" rx="8" ry="10" fill="#FFE4C4" transform="rotate(-15 0 100)" />
      </g>
      
      {/* 连接的手 */}
      <path d="M107 130 Q115 125 123 130" stroke="#FFE4C4" strokeWidth="8" fill="none" strokeLinecap="round" />
      
      {/* 爱心 */}
      <g transform="translate(105, 0)">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
          fill="#FF6B8A" transform="scale(1.3)" />
      </g>
    </svg>
  );
}

export default function CoupleAnimation({ size = "lg", className = "" }: CoupleAnimationProps) {
  const { width, height } = sizeMap[size];
  const [stage, setStage] = useState(0);
  
  // 自动切换三种形态
  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => (prev + 1) % 3);
    }, 4000); // 每4秒切换一次
    
    return () => clearInterval(interval);
  }, []);

  const stages = [
    { component: YoungCouple, label: "青涩恋爱" },
    { component: WeddingCouple, label: "步入婚姻" },
    { component: ElderlyCouple, label: "白头偕老" },
  ];

  const CurrentStage = stages[stage].component;

  return (
    <div className={`relative ${className}`} style={{ width, height: height + 30 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 flex flex-col items-center"
        >
          <CurrentStage width={width} height={height} />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground mt-2 font-medium"
          >
            {stages[stage].label}
          </motion.p>
        </motion.div>
      </AnimatePresence>
      
      {/* 进度指示器 */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
        {stages.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === stage ? "bg-primary w-4" : "bg-primary/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
