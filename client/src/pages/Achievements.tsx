import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trophy, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export default function Achievements() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { data: achievements } = trpc.achievement.list.useQuery();

  const categories = useMemo(() => {
    if (!achievements) return [];
    const cats = new Set(achievements.map((a: any) => a.category));
    return ["all", ...Array.from(cats)];
  }, [achievements]);

  const filteredAchievements = useMemo(() => {
    if (!achievements) return [];
    if (selectedCategory === "all") return achievements;
    return achievements.filter((a: any) => a.category === selectedCategory);
  }, [achievements, selectedCategory]);

  const totalUnlocked = achievements?.filter((a: any) => a.isUnlocked).length || 0;
  const totalCount = achievements?.length || 0;
  const overallProgress = totalCount > 0 ? totalUnlocked / totalCount : 0;

  const categoryLabels: Record<string, string> = {
    all: "全部",
    "记录": "记录",
    "任务": "任务",
    "探索": "探索",
    "互动": "互动",
    "里程碑": "里程碑",
  };

  return (
    <div className="min-h-screen gradient-warm-subtle">
      <header className="sticky top-0 z-50 glass border-b border-white/20 dark:border-white/10">
        <div className="container flex items-center h-14">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-lg font-semibold ml-2">成就墙</h1>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 总览卡片 */}
        <Card className="glass overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10" />
          <CardContent className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {totalUnlocked} <span className="text-sm font-normal text-muted-foreground">/ {totalCount} 成就</span>
                </h2>
                <div className="mt-2 h-3 bg-muted/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  完成度 {Math.round(overallProgress * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 分类筛选 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              className="whitespace-nowrap"
            >
              {categoryLabels[cat] || cat}
            </Button>
          ))}
        </div>

        {/* 成就列表 */}
        <div className="grid grid-cols-2 gap-3">
          {filteredAchievements.map((achievement: any, index: number) => (
            <motion.div
              key={achievement.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className={`glass overflow-hidden transition-all ${
                achievement.isUnlocked
                  ? "border-amber-300/50 shadow-amber-100/50 dark:shadow-amber-900/20"
                  : "opacity-60"
              }`}>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-2 transition-all ${
                      achievement.isUnlocked
                        ? "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 shadow-md"
                        : "bg-muted/50 grayscale"
                    }`}>
                      {achievement.isUnlocked ? achievement.emoji : <Lock className="w-6 h-6 text-muted-foreground" />}
                    </div>
                    <h3 className={`font-medium text-sm ${achievement.isUnlocked ? "" : "text-muted-foreground"}`}>
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
                    
                    {/* 进度条 */}
                    <div className="w-full mt-2">
                      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            achievement.isUnlocked
                              ? "bg-gradient-to-r from-amber-400 to-orange-500"
                              : "bg-muted-foreground/30"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${achievement.progress * 100}%` }}
                          transition={{ duration: 0.8, delay: index * 0.03 }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {achievement.current >= achievement.target
                          ? "已达成"
                          : `${achievement.current} / ${achievement.target}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">暂无成就数据</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
