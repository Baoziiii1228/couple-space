import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

// 浮动爱心组件
function FloatingHearts() {
  const hearts = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 6,
      size: 12 + Math.random() * 16,
      opacity: 0.15 + Math.random() * 0.25,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="absolute text-rose-400"
          style={{ 
            left: `${heart.left}%`, 
            fontSize: heart.size,
            opacity: heart.opacity,
          }}
          initial={{ y: "100vh", rotate: -20 }}
          animate={{ 
            y: "-100px", 
            rotate: 20,
            x: [0, 20, -20, 10, 0],
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          ♥
        </motion.div>
      ))}
    </div>
  );
}

// 花瓣飘落组件
function FallingPetals() {
  const petals = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 10 + Math.random() * 8,
      size: 8 + Math.random() * 12,
      rotation: Math.random() * 360,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute"
          style={{ 
            left: `${petal.left}%`,
            width: petal.size,
            height: petal.size * 0.6,
          }}
          initial={{ y: -50, rotate: petal.rotation, opacity: 0 }}
          animate={{ 
            y: "100vh", 
            rotate: petal.rotation + 360,
            opacity: [0, 0.4, 0.4, 0],
            x: [0, 30, -30, 20, -10, 0],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div 
            className="w-full h-full rounded-full bg-gradient-to-br from-pink-300 to-rose-200"
            style={{ 
              borderRadius: "50% 0 50% 50%",
              transform: "rotate(-45deg)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// 星星/萤火虫组件（深色模式）
function Fireflies() {
  const fireflies = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
      size: 2 + Math.random() * 4,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {fireflies.map((fly) => (
        <motion.div
          key={fly.id}
          className="absolute rounded-full bg-amber-300"
          style={{ 
            left: `${fly.left}%`,
            top: `${fly.top}%`,
            width: fly.size,
            height: fly.size,
            boxShadow: `0 0 ${fly.size * 2}px ${fly.size}px rgba(251, 191, 36, 0.4)`,
          }}
          animate={{ 
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
            x: [0, 10, -5, 8, 0],
            y: [0, -8, 5, -3, 0],
          }}
          transition={{
            duration: fly.duration,
            delay: fly.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// 情话卡片组件（深色模式）
function LoveQuotes() {
  const quotes = [
    "遇见你是最美丽的意外",
    "你是我的今天和所有明天",
    "有你在的地方就是家",
    "我想和你一起慢慢变老",
    "你笑起来真好看",
    "余生请多指教",
    "你是我的小确幸",
    "爱你是我做过最好的事",
  ];

  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  return (
    <div className="absolute inset-0 flex items-center pointer-events-none">
      {/* 左侧情话 */}
      <motion.div
        key={`left-${currentQuote}`}
        className="absolute left-8 top-1/3 max-w-[120px]"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 0.6, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.8 }}
      >
        <p className="text-sm text-amber-200/80 font-light italic">
          "{quotes[currentQuote]}"
        </p>
      </motion.div>
      
      {/* 右侧情话 */}
      <motion.div
        key={`right-${(currentQuote + 4) % quotes.length}`}
        className="absolute right-8 top-1/2 max-w-[120px] text-right"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.6, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <p className="text-sm text-amber-200/80 font-light italic">
          "{quotes[(currentQuote + 4) % quotes.length]}"
        </p>
      </motion.div>
    </div>
  );
}

// 装饰插画组件（浅色模式B）
function DecorativeIllustrations() {
  const icons = [
    { emoji: "💍", left: "5%", top: "20%" },
    { emoji: "💌", right: "8%", top: "25%" },
    { emoji: "🌹", left: "10%", bottom: "30%" },
    { emoji: "🎀", right: "12%", bottom: "35%" },
    { emoji: "✨", left: "3%", top: "50%" },
    { emoji: "🦋", right: "5%", top: "55%" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((icon, index) => (
        <motion.div
          key={index}
          className="absolute text-2xl opacity-30"
          style={{ 
            left: icon.left, 
            right: icon.right, 
            top: icon.top, 
            bottom: icon.bottom,
          }}
          animate={{ 
            y: [0, -8, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4 + index * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {icon.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// 时间线组件（浅色模式B）
function Timeline() {
  const stages = [
    { label: "相识", icon: "👋" },
    { label: "相知", icon: "💬" },
    { label: "相恋", icon: "💕" },
    { label: "相守", icon: "💑" },
  ];

  return (
    <div className="absolute inset-0 flex items-center pointer-events-none">
      {/* 左侧时间线 */}
      <div className="absolute left-4 top-1/4 flex flex-col gap-6">
        {stages.slice(0, 2).map((stage, index) => (
          <motion.div
            key={index}
            className="flex items-center gap-2 opacity-40"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 0.4, x: 0 }}
            transition={{ delay: index * 0.3 }}
          >
            <span className="text-lg">{stage.icon}</span>
            <span className="text-xs text-muted-foreground">{stage.label}</span>
          </motion.div>
        ))}
      </div>
      
      {/* 右侧时间线 */}
      <div className="absolute right-4 top-1/3 flex flex-col gap-6">
        {stages.slice(2).map((stage, index) => (
          <motion.div
            key={index}
            className="flex items-center gap-2 opacity-40 flex-row-reverse"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 0.4, x: 0 }}
            transition={{ delay: (index + 2) * 0.3 }}
          >
            <span className="text-lg">{stage.icon}</span>
            <span className="text-xs text-muted-foreground">{stage.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// 浅色模式A：浮动爱心 + 花瓣飘落
export function LightModeA() {
  return (
    <>
      <FloatingHearts />
      <FallingPetals />
    </>
  );
}

// 浅色模式B：装饰插画
export function LightModeB() {
  return (
    <>
      <DecorativeIllustrations />
    </>
  );
}

// 深色模式：星星萤火虫 + 情话卡片
export function DarkModeBackground() {
  return (
    <>
      <Fireflies />
      <LoveQuotes />
    </>
  );
}

// 随机选择浅色模式背景
export function RandomLightBackground() {
  const [mode] = useState(() => Math.random() > 0.5 ? 'A' : 'B');
  
  return mode === 'A' ? <LightModeA /> : <LightModeB />;
}
