import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, Camera, BookOpen, Calendar, Star, MessageCircle, 
  Smile, Gift, Clock, MapPin, Film, LogOut, Settings
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useEffect, useMemo } from "react";
import ScreenLock from "@/components/ScreenLock";
import Countdown from "@/components/Countdown";
import { motion } from "framer-motion";

const navItems = [
  { icon: Camera, title: "相册", path: "/albums", color: "text-pink-500" },
  { icon: BookOpen, title: "日记", path: "/diary", color: "text-orange-500" },
  { icon: Calendar, title: "纪念日", path: "/anniversary", color: "text-red-500" },
  { icon: Star, title: "任务", path: "/tasks", color: "text-yellow-500" },
  { icon: MessageCircle, title: "留言", path: "/messages", color: "text-green-500" },
  { icon: Smile, title: "心情", path: "/mood", color: "text-blue-500" },
  { icon: Gift, title: "愿望", path: "/wishes", color: "text-purple-500" },
  { icon: Clock, title: "胶囊", path: "/time-capsule", color: "text-indigo-500" },
  { icon: MapPin, title: "足迹", path: "/footprints", color: "text-teal-500" },
  { icon: Film, title: "清单", path: "/todo-list", color: "text-rose-500" },
];

export default function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: coupleStatus } = trpc.couple.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: dailyQuote } = trpc.message.getDailyQuote.useQuery();
  const { data: anniversaries } = trpc.anniversary.list.useQuery(undefined, {
    enabled: coupleStatus?.status === "paired",
  });
  
  // 获取相册照片用于息屏展示
  const { data: photos } = trpc.photo.list.useQuery({}, {
    enabled: coupleStatus?.status === "paired",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    } else if (coupleStatus && coupleStatus.status !== "paired") {
      setLocation("/pair");
    }
  }, [isAuthenticated, coupleStatus, setLocation]);

  // 计算在一起的天数
  const daysTogether = useMemo(() => {
    if (coupleStatus?.status !== "paired" || !coupleStatus.couple?.togetherDate) {
      return null;
    }
    const start = new Date(coupleStatus.couple.togetherDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [coupleStatus]);

  // 获取在一起的日期
  const togetherDate = useMemo(() => {
    if (coupleStatus?.status !== "paired" || !coupleStatus.couple?.togetherDate) {
      return null;
    }
    return new Date(coupleStatus.couple.togetherDate);
  }, [coupleStatus]);

  // 获取照片URL列表
  const photoUrls = useMemo(() => {
    if (!photos || photos.length === 0) return [];
    return photos.map(p => p.url);
  }, [photos]);

  // 计算下一个纪念日（带完整日期信息）
  const nextAnniversary = useMemo(() => {
    if (!anniversaries || anniversaries.length === 0) return null;
    
    const now = new Date();
    const upcoming = anniversaries
      .map(a => {
        const date = new Date(a.date);
        // 计算今年的纪念日
        const thisYear = new Date(now.getFullYear(), date.getMonth(), date.getDate());
        if (thisYear < now) {
          thisYear.setFullYear(thisYear.getFullYear() + 1);
        }
        return { ...a, nextDate: thisYear };
      })
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
    
    if (upcoming.length === 0) return null;
    
    const next = upcoming[0];
    const daysLeft = Math.ceil((next.nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return { ...next, daysLeft };
  }, [anniversaries]);

  if (!coupleStatus || coupleStatus.status !== "paired") {
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
      {/* 息屏锁定组件 - 只有设置了在一起日期才会启用 */}
      {togetherDate && (
        <ScreenLock
          togetherDate={togetherDate}
          photos={photoUrls}
          idleTimeout={120000} // 2分钟无操作后锁屏
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/20">
        <div className="container flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" fill="currentColor" />
            <span className="font-semibold">Couple Space</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => logout()}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 纪念日倒计时卡片 - 突出显示 */}
        {nextAnniversary && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/anniversary">
              <Card className="glass-ios border-0 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-orange-500/10 to-amber-500/10" />
                <CardContent className="relative p-6">
                  <Countdown
                    targetDate={nextAnniversary.nextDate}
                    title={nextAnniversary.title}
                    emoji={nextAnniversary.emoji || undefined}
                  />
                  <p className="text-center text-xs text-muted-foreground mt-4">
                    点击查看所有纪念日
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* 恋爱统计卡片 */}
        <Card className="glass border-white/40 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/10" />
          <CardContent className="relative p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* 在一起天数 */}
              <div className="text-center flex-1">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Heart className="w-8 h-8 text-primary animate-heartbeat" fill="currentColor" />
                </div>
                {daysTogether !== null ? (
                  <>
                    <div className="text-4xl md:text-5xl font-bold text-primary mb-1">
                      {daysTogether}
                    </div>
                    <p className="text-muted-foreground">天</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      我们在一起的日子
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    <Link href="/anniversary" className="text-primary hover:underline">
                      设置在一起的日期
                    </Link>
                  </p>
                )}
              </div>

              {/* 分隔线 */}
              <div className="hidden md:block w-px h-24 bg-border" />

              {/* 下一个纪念日简要信息 */}
              <div className="text-center flex-1">
                {nextAnniversary ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-1">下一个纪念日</p>
                    <p className="font-medium mb-1">{nextAnniversary.emoji} {nextAnniversary.title}</p>
                    <div className="text-3xl font-bold text-accent mb-1">
                      {nextAnniversary.daysLeft}
                    </div>
                    <p className="text-muted-foreground">天后</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    <Link href="/anniversary" className="text-primary hover:underline">
                      添加纪念日
                    </Link>
                  </p>
                )}
              </div>

              {/* 分隔线 */}
              <div className="hidden md:block w-px h-24 bg-border" />

              {/* 伴侣信息 */}
              <div className="text-center flex-1">
                <p className="text-sm text-muted-foreground mb-2">我的另一半</p>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <p className="font-medium">{coupleStatus.partner?.name || "TA"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 每日情话 */}
        {dailyQuote && (
          <Card className="glass border-white/40">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">今日情话</p>
                  <p className="text-foreground italic">"{dailyQuote.content}"</p>
                  {dailyQuote.author && (
                    <p className="text-sm text-muted-foreground mt-2">—— {dailyQuote.author}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 功能导航 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">功能</h2>
          <div className="grid grid-cols-5 gap-3">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Card className="card-hover glass border-white/40 cursor-pointer">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center mb-2 ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">{item.title}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
