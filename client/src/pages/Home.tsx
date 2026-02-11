import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, BookOpen, Calendar, Star, MessageCircle, Smile, Gift, Clock, MapPin, Film, ArrowRight, Sun, Moon, Settings, History, Trophy, CheckSquare, Wallet } from "lucide-react";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { RandomLightBackground, DarkModeBackground } from "@/components/HomeBackgrounds";
import FloatingTexts from "@/components/FloatingTexts";

const features = [
  { icon: Camera, title: "情侣相册", desc: "珍藏美好瞬间" },
  { icon: BookOpen, title: "恋爱日记", desc: "书写爱的故事" },
  { icon: Calendar, title: "纪念日", desc: "不错过每个重要日子" },
  { icon: Star, title: "情侣任务", desc: "一起完成小目标" },
  { icon: MessageCircle, title: "留言板", desc: "传递甜蜜情话" },
  { icon: Smile, title: "心情打卡", desc: "记录每日心情" },
  { icon: Gift, title: "愿望清单", desc: "实现彼此的愿望" },
  { icon: Clock, title: "时光胶囊", desc: "给未来的一封信" },
  { icon: MapPin, title: "足迹地图", desc: "标记去过的地方" },
  { icon: Film, title: "待办清单", desc: "想看的电影想吃的美食" },
  { icon: History, title: "恋爱大事记", desc: "自动生成爱的时间线" },
  { icon: Trophy, title: "成就系统", desc: "见证共同成长" },
  { icon: CheckSquare, title: "一起做100件事", desc: "每年更新的挑战清单" },
  { icon: Wallet, title: "恋爱账本", desc: "记录共同开销" },
];

// 时间轴三个阶段
const timelineStages = [
  {
    id: "meet",
    label: "相识",
    sublabel: "初遇的心动",
    emoji: "🌸",
    color: "from-pink-400 to-rose-400",
    darkColor: "from-pink-800/60 to-rose-800/60",
    icons: ["💌", "🎵"],
  },
  {
    id: "love",
    label: "相恋",
    sublabel: "甜蜜的日子",
    emoji: "💒",
    color: "from-rose-400 to-orange-400",
    darkColor: "from-rose-800/60 to-orange-800/60",
    icons: ["💍", "🌹"],
  },
  {
    id: "forever",
    label: "相守",
    sublabel: "白头偕老",
    emoji: "👴👵",
    color: "from-orange-400 to-amber-400",
    darkColor: "from-orange-800/60 to-amber-800/60",
    icons: ["🏠", "🌅"],
  },
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const { data: coupleStatus } = trpc.couple.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const isOwner = user?.role === "admin";

  const handleEnter = () => {
    if (!isAuthenticated) {
      setLocation("/login");
    } else if (coupleStatus?.status === "paired" || isOwner) {
      setLocation("/dashboard");
    } else {
      setLocation("/pair");
    }
  };

  const handleDevMode = () => {
    setLocation("/settings");
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'gradient-warm-rich'}`}>
        <div className="animate-pulse flex flex-col items-center gap-4">
          <span className="text-6xl">💕</span>
          <p className="text-muted-foreground font-tech-light">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'gradient-warm-rich'}`}>
      {/* 背景效果 */}
      {isDark ? <DarkModeBackground /> : <RandomLightBackground />}

      {/* 浮动打字句 */}
      <FloatingTexts isDark={isDark} />

      {/* 装饰性渐变光斑 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isDark ? (
          <>
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-purple-900/20 to-blue-900/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-blue-900/10 to-purple-900/20 rounded-full blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-pink-200/30 to-orange-200/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-orange-200/20 to-pink-200/30 rounded-full blur-3xl" />
          </>
        )}
      </div>

      {/* 顶部工具栏 */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <PWAInstallButton />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className={`rounded-full backdrop-blur-sm ${isDark ? 'text-amber-300 hover:bg-slate-700/50' : 'text-slate-600 hover:bg-white/50'}`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDevMode}
            className={`rounded-full backdrop-blur-sm ${isDark ? 'text-emerald-400 hover:bg-slate-700/50' : 'text-emerald-600 hover:bg-white/50'}`}
            title="开发者模式"
          >
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Hero Section */}
      <div className="relative z-10">
        <div className="container relative py-16 md:py-24">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">

            {/* 大标题 - 机器艺术字体 */}
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className={`font-tech text-6xl md:text-8xl font-bold tracking-wider mb-3 ${
                isDark
                  ? 'bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-rose-500 via-orange-400 to-rose-500 bg-clip-text text-transparent'
              }`}
              style={{
                textShadow: isDark
                  ? '0 0 80px rgba(251, 191, 36, 0.25)'
                  : '0 0 80px rgba(244, 63, 94, 0.15)',
              }}
            >
              Couple Space
            </motion.h1>

            {/* 英文副标题 */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`font-tech-light text-sm md:text-base tracking-[0.3em] mb-10 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Where Every Moment Becomes Forever
            </motion.p>

            {/* 进入按钮 - 立即显示，艺术字 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col items-center gap-3 mb-14"
            >
              <Button
                size="lg"
                className={`h-14 px-12 text-lg font-tech tracking-wide rounded-2xl shadow-xl transition-all duration-300 gap-3 hover:scale-105 ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30 text-white'
                    : 'bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 shadow-rose-500/30 text-white'
                }`}
                onClick={handleEnter}
              >
                携手一起，白头到老
                <ArrowRight className="w-5 h-5" />
              </Button>

              {isAuthenticated && (
                <p className={`text-sm font-tech-light ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                  欢迎回来，{user?.name || "亲爱的"}
                  {isOwner && <span className="ml-2 text-emerald-500">(开发者模式)</span>}
                </p>
              )}
            </motion.div>

            {/* 时间轴 + Q版小人 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="w-full max-w-2xl mb-6"
            >
              <div className="relative flex items-start justify-between px-4">
                {/* 连接线 */}
                <div className={`absolute top-12 left-[18%] right-[18%] h-0.5 rounded-full ${
                  isDark
                    ? 'bg-gradient-to-r from-amber-700/40 via-orange-700/40 to-amber-700/40'
                    : 'bg-gradient-to-r from-pink-200 via-rose-200 to-orange-200'
                }`} />

                {timelineStages.map((stage) => {
                  const isHovered = hoveredStage === stage.id;
                  return (
                    <motion.div
                      key={stage.id}
                      className="relative z-10 flex flex-col items-center cursor-pointer select-none"
                      onMouseEnter={() => setHoveredStage(stage.id)}
                      onMouseLeave={() => setHoveredStage(null)}
                      animate={{
                        scale: isHovered ? 1.15 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      {/* Q版小人圆圈 */}
                      <div
                        className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-3xl md:text-4xl transition-shadow duration-300 ${
                          isDark
                            ? `bg-gradient-to-br ${stage.darkColor} border border-slate-600/50`
                            : `bg-gradient-to-br ${stage.color} shadow-md`
                        }`}
                        style={{
                          boxShadow: isHovered
                            ? isDark
                              ? '0 0 35px rgba(251, 191, 36, 0.35), 0 8px 30px -5px rgba(0,0,0,0.3)'
                              : '0 0 35px rgba(244, 63, 94, 0.3), 0 8px 30px -5px rgba(0,0,0,0.1)'
                            : undefined,
                        }}
                      >
                        <span className={isHovered ? 'animate-bounce' : ''}>
                          {stage.emoji}
                        </span>
                      </div>

                      {/* 阶段标签 */}
                      <p className={`mt-3 font-tech text-sm md:text-base font-semibold ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {stage.label}
                      </p>

                      {/* 悬停显示描述和装饰图标 */}
                      <motion.div
                        className="flex flex-col items-center"
                        animate={{
                          opacity: isHovered ? 1 : 0,
                          y: isHovered ? 0 : 8,
                        }}
                        transition={{ duration: 0.25 }}
                      >
                        <p className={`text-xs mt-1 font-tech-light ${
                          isDark ? 'text-amber-400' : 'text-rose-500'
                        }`}>
                          {stage.sublabel}
                        </p>
                        <div className="flex gap-2 mt-1.5">
                          {stage.icons.map((icon, i) => (
                            <motion.span
                              key={i}
                              className="text-sm opacity-60"
                              initial={{ scale: 0 }}
                              animate={{ scale: isHovered ? 1 : 0 }}
                              transition={{ delay: i * 0.1, type: "spring" }}
                            >
                              {icon}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="container py-10 relative z-10"
      >
        <div className="text-center mb-8">
          <h3 className={`text-xl font-tech font-semibold mb-2 ${isDark ? 'text-slate-200' : ''}`}>
            丰富的功能
          </h3>
          <p className={`text-sm font-tech-light ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
            为你们的爱情量身定制
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 + 0.05 * index }}
            >
              <Card className={`card-ios-hover rounded-2xl border-0 ${
                isDark
                  ? 'bg-slate-800/50 backdrop-blur-sm border border-slate-700/30'
                  : 'glass-ios'
              }`}>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    isDark
                      ? 'bg-gradient-to-br from-amber-900/50 to-orange-900/50'
                      : 'bg-gradient-to-br from-rose-100 to-orange-100'
                  }`}>
                    <feature.icon className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-rose-500'}`} />
                  </div>
                  <h4 className={`font-medium text-sm mb-0.5 ${isDark ? 'text-slate-200' : ''}`}>
                    {feature.title}
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className={`container py-6 text-center text-sm font-tech-light relative z-10 ${isDark ? 'text-slate-500' : 'text-muted-foreground'}`}
      >
        <p>用心记录，让爱更甜蜜</p>
      </motion.footer>
    </div>
  );
}
