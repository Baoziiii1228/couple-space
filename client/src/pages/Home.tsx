import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Sparkles, Camera, BookOpen, Calendar, Star, MessageCircle, Smile, Gift, Clock, MapPin, Film } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTypewriter } from "@/hooks/useTypewriter";
import { motion } from "framer-motion";

const features = [
  { icon: Heart, title: "恋爱首页", desc: "记录在一起的每一天" },
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

  useEffect(() => {
    if (isAuthenticated && coupleStatus) {
      if (coupleStatus.status === "paired") {
        setLocation("/dashboard");
      } else {
        setLocation("/pair");
      }
    }
  }, [isAuthenticated, coupleStatus, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-warm-subtle flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Heart className="w-12 h-12 text-primary animate-heartbeat" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm-subtle">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative py-20 md:py-32">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-2 mb-6"
            >
              <Heart className="w-10 h-10 text-primary animate-heartbeat" fill="currentColor" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Couple Space
              </h1>
            </motion.div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-2xl md:text-3xl font-semibold text-foreground mb-6"
            >
              情侣空间
            </motion.h2>
            
            {/* 打字机效果区域 */}
            <div className="h-32 md:h-24 flex flex-col items-center justify-center mb-8">
              {introTexts.slice(0, currentTextIndex + 1).map((text, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: index < currentTextIndex ? 0.6 : 1, y: 0 }}
                  className={`text-lg ${index < currentTextIndex ? 'text-muted-foreground/60 text-base' : 'text-muted-foreground'}`}
                >
                  {index === currentTextIndex ? (
                    <>
                      {displayText}
                      <span className="animate-pulse">|</span>
                    </>
                  ) : (
                    text
                  )}
                </motion.p>
              ))}
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showFeatures ? 1 : 0, y: showFeatures ? 0 : 20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button 
                size="lg" 
                className="gap-2 shadow-soft"
                onClick={() => window.location.href = getLoginUrl()}
              >
                <Sparkles className="w-5 h-5" />
                开始记录我们的故事
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: showFeatures ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="container py-16"
      >
        <div className="text-center mb-12">
          <h3 className="text-2xl font-semibold mb-2">丰富的功能</h3>
          <p className="text-muted-foreground">为你们的爱情量身定制</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showFeatures ? 1 : 0, y: showFeatures ? 0 : 20 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <Card className="card-hover glass border-white/40">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
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
        className="container py-8 text-center text-sm text-muted-foreground"
      >
        <p>用心记录，让爱更甜蜜 💕</p>
      </motion.footer>
    </div>
  );
}
