import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, BookOpen, Calendar, Star, MessageCircle, Smile, Gift, Clock, MapPin, Film, ArrowRight } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTypewriter } from "@/hooks/useTypewriter";
import { motion } from "framer-motion";
import Heart3D from "@/components/Heart3D";

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
  const [showFeatures, setShowFeatures] = useState(false);
  
  const { displayText, isComplete } = useTypewriter(
    introTexts[currentTextIndex], 
    60, 
    currentTextIndex === 0 ? 500 : 200
  );

  const { data: coupleStatus } = trpc.couple.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // 切换到下一段文字
  useEffect(() => {
    if (isComplete && currentTextIndex < introTexts.length - 1) {
      const timer = setTimeout(() => {
        setCurrentTextIndex(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else if (isComplete && currentTextIndex === introTexts.length - 1) {
      const timer = setTimeout(() => {
        setShowFeatures(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, currentTextIndex]);

  // 处理进入按钮点击
  const handleEnter = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
    } else if (coupleStatus?.status === "paired") {
      setLocation("/dashboard");
    } else {
      setLocation("/pair");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-warm-rich flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Heart3D size="lg" animate={true} />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm-rich relative overflow-hidden">
      {/* 装饰性渐变光斑 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-pink-200/30 to-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-orange-200/20 to-pink-200/30 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="container relative py-20 md:py-28">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* 简约高级爱心 */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <Heart3D size="xl" animate={true} />
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent mb-2"
            >
              Couple Space
            </motion.h1>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl md:text-2xl font-medium text-foreground/80 mb-8"
            >
              情侣空间
            </motion.h2>
            
            {/* 打字机效果区域 */}
            <div className="min-h-[120px] md:min-h-[100px] flex flex-col items-center justify-center mb-8">
              {introTexts.slice(0, currentTextIndex + 1).map((text, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: index < currentTextIndex ? 0.5 : 1, y: 0 }}
                  className={`text-lg leading-relaxed ${index < currentTextIndex ? 'text-muted-foreground/50 text-base' : 'text-muted-foreground'}`}
                >
                  {index === currentTextIndex ? (
                    <>
                      {displayText}
                      <span className="inline-block w-0.5 h-5 bg-primary/60 ml-0.5 align-middle animate-blink" />
                    </>
                  ) : (
                    text
                  )}
                </motion.p>
              ))}
            </div>
            
            {/* 进入按钮 - 携手一起，白头到老 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showFeatures ? 1 : 0, y: showFeatures ? 0 : 20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-4"
            >
              <Button 
                size="lg" 
                className="h-14 px-10 text-lg rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 shadow-lg shadow-rose-500/25 transition-all duration-300 gap-3"
                onClick={handleEnter}
              >
                携手一起，白头到老
                <ArrowRight className="w-5 h-5" />
              </Button>
              
              {isAuthenticated && (
                <p className="text-sm text-muted-foreground">
                  欢迎回来，{user?.name || "亲爱的"}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: showFeatures ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="container py-12"
      >
        <div className="text-center mb-10">
          <h3 className="text-xl font-semibold mb-2">丰富的功能</h3>
          <p className="text-muted-foreground text-sm">为你们的爱情量身定制</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showFeatures ? 1 : 0, y: showFeatures ? 0 : 20 }}
              transition={{ duration: 0.4, delay: 0.05 * index }}
            >
              <Card className="card-ios-hover glass-ios rounded-2xl border-0">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center mb-3">
                    <feature.icon className="w-5 h-5 text-rose-500" />
                  </div>
                  <h4 className="font-medium text-sm mb-0.5">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: showFeatures ? 1 : 0 }}
        className="container py-6 text-center text-sm text-muted-foreground"
      >
        <p>用心记录，让爱更甜蜜</p>
      </motion.footer>
    </div>
  );
}
