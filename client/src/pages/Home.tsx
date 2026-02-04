import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, BookOpen, Calendar, Star, MessageCircle, Smile, Gift, Clock, MapPin, Film, ArrowRight, Sun, Moon, Settings } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useTypewriter } from "@/hooks/useTypewriter";
import { motion } from "framer-motion";
import CoupleAnimation from "@/components/CoupleAnimation";
import { useTheme } from "@/contexts/ThemeContext";
import { RandomLightBackground, DarkModeBackground } from "@/components/HomeBackgrounds";

const features = [
  { icon: Camera, title: "情侣相册", desc: "珍藏美好瞬间" },
  { icon: BookOpen, title: "恋爱日记", desc: "书写爱的故事" },
  { icon: Calendar, title: "纪念日", desc: "不错过每个重要日子" },
  { icon: Star, title: "情侣任务", desc: "一起完成100件小事" },
  { icon: MessageCircle, title: "留言板", desc: "传递甜蜜情话" },
  { icon: Smile, title: "心情打卡", desc: "记录每日心情" },
  { icon: Gift, title: "愿望清单", desc: "实现彼此的愿望" },
  { icon: Clock, title: "时光胶囊", desc: "给未来的一封信" },
  { icon: MapPin, title: "足迹地图", desc: "标记去过的地方" },
  { icon: Film, title: "待办清单", desc: "想看的电影想吃的美食" },
];

const introTexts = [
  "记录恋爱中的美好瞬间",
  "让每一天都充满甜蜜",
  "从相识到相知",
  "从相恋到相守",
  "我们一起书写爱的故事",
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  
  const { displayText, isComplete } = useTypewriter(
    introTexts[currentTextIndex], 
    60, 
    currentTextIndex === 0 ? 500 : 200
  );

  const { data: coupleStatus } = trpc.couple.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // 检查是否是开发者（项目所有者）
  const isOwner = user?.role === "admin";

  // 切换到下一段文字
  useEffect(() => {
    if (isComplete && currentTextIndex < introTexts.length - 1) {
      const timer = setTimeout(() => {
        setCurrentTextIndex(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isComplete, currentTextIndex]);

  // 处理进入按钮点击
  const handleEnter = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
    } else if (coupleStatus?.status === "paired" || isOwner) {
      // 开发者模式：项目所有者可以直接进入
      setLocation("/dashboard");
    } else {
      setLocation("/pair");
    }
  };

  // 处理开发者模式按钮 - 跳转到设置页
  const handleDevMode = () => {
    setLocation("/settings");
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'gradient-warm-rich'}`}>
        <div className="animate-pulse flex flex-col items-center gap-4">
          <CoupleAnimation size="md" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'gradient-warm-rich'}`}>
      {/* 背景效果 */}
      {isDark ? <DarkModeBackground /> : <RandomLightBackground />}
      
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
        {/* 主题切换按钮 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className={`rounded-full ${isDark ? 'text-amber-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-white/50'}`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        
        {/* 开发者模式按钮 - 仅项目所有者可见 */}
        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDevMode}
            className={`rounded-full ${isDark ? 'text-emerald-400 hover:bg-slate-700' : 'text-emerald-600 hover:bg-white/50'}`}
            title="开发者模式"
          >
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="container relative py-12 md:py-16">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Q版情侣动画 - 三种形态切换 */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-4"
            >
              <CoupleAnimation size="xl" />
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`text-4xl md:text-5xl font-bold bg-clip-text text-transparent mb-6 ${
                isDark 
                  ? 'bg-gradient-to-r from-amber-300 to-orange-300' 
                  : 'bg-gradient-to-r from-rose-500 to-orange-400'
              }`}
            >
              Couple Space
            </motion.h1>
            
            {/* 进入按钮 - 立即显示 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col items-center gap-4 mb-8"
            >
              <Button 
                size="lg" 
                className={`h-14 px-10 text-lg rounded-2xl shadow-lg transition-all duration-300 gap-3 ${
                  isDark 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25' 
                    : 'bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 shadow-rose-500/25'
                }`}
                onClick={handleEnter}
              >
                携手一起，白头到老
                <ArrowRight className="w-5 h-5" />
              </Button>
              
              {isAuthenticated && (
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                  欢迎回来，{user?.name || "亲爱的"}
                  {isOwner && <span className="ml-2 text-emerald-500">(开发者模式)</span>}
                </p>
              )}
            </motion.div>
            
            {/* 打字机效果区域 */}
            <div className="min-h-[120px] md:min-h-[100px] flex flex-col items-center justify-center">
              {introTexts.slice(0, currentTextIndex + 1).map((text, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: index < currentTextIndex ? 0.5 : 1, y: 0 }}
                  className={`text-lg leading-relaxed ${
                    index < currentTextIndex 
                      ? (isDark ? 'text-slate-500 text-base' : 'text-muted-foreground/50 text-base')
                      : (isDark ? 'text-slate-300' : 'text-muted-foreground')
                  }`}
                >
                  {index === currentTextIndex ? (
                    <>
                      {displayText}
                      <span className={`inline-block w-0.5 h-5 ml-0.5 align-middle animate-blink ${isDark ? 'bg-amber-400/60' : 'bg-primary/60'}`} />
                    </>
                  ) : (
                    text
                  )}
                </motion.p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="container py-10"
      >
        <div className="text-center mb-8">
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-slate-200' : ''}`}>丰富的功能</h3>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>为你们的爱情量身定制</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + 0.05 * index }}
            >
              <Card className={`card-ios-hover rounded-2xl border-0 ${
                isDark 
                  ? 'bg-slate-800/50 backdrop-blur-sm' 
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
                  <h4 className={`font-medium text-sm mb-0.5 ${isDark ? 'text-slate-200' : ''}`}>{feature.title}</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>{feature.desc}</p>
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
        transition={{ delay: 1 }}
        className={`container py-6 text-center text-sm ${isDark ? 'text-slate-500' : 'text-muted-foreground'}`}
      >
        <p>用心记录，让爱更甜蜜</p>
      </motion.footer>
    </div>
  );
}
