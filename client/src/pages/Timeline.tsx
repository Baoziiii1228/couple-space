import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Clock, Star, MapPin, Gift, Heart, Trash2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const categoryIcons: Record<string, { icon: typeof Heart; color: string }> = {
  couple: { icon: Heart, color: "text-pink-500" },
  task: { icon: Star, color: "text-yellow-500" },
  wish: { icon: Gift, color: "text-purple-500" },
  footprint: { icon: MapPin, color: "text-teal-500" },
  manual: { icon: Clock, color: "text-blue-500" },
};

const emojiOptions = ["💖", "🎉", "🌟", "💕", "🎊", "🏆", "✨", "🌈", "🎂", "💐", "🥂", "📸", "✈️", "🏠", "💍", "🎁"];

export default function Timeline() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("💖");
  const [eventDate, setEventDate] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const { data: timeline, refetch } = trpc.milestone.getTimeline.useQuery();
  const createMilestone = trpc.milestone.create.useMutation({
    onSuccess: () => {
      toast.success("里程碑已添加");
      setShowAddForm(false);
      setTitle("");
      setDescription("");
      setEmoji("💖");
      setEventDate("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMilestone = trpc.milestone.delete.useMutation({
    onSuccess: () => {
      toast.success("已删除");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredTimeline = useMemo(() => {
    if (!timeline) return [];
    if (filter === "all") return timeline;
    if (filter === "manual") return timeline.filter((t: any) => !t.isAuto);
    return timeline.filter((t: any) => t.category === filter);
  }, [timeline, filter]);

  // 按年份分组
  const groupedTimeline = useMemo(() => {
    const groups: Record<string, typeof filteredTimeline> = {};
    filteredTimeline.forEach((item: any) => {
      const year = new Date(item.eventDate).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a));
  }, [filteredTimeline]);

  const handleSubmit = () => {
    if (!title.trim()) return toast.error("请输入标题");
    if (!eventDate) return toast.error("请选择日期");
    createMilestone.mutate({ title: title.trim(), description: description.trim() || undefined, emoji, eventDate });
  };

  return (
    <div className="min-h-screen gradient-warm-subtle">
      <header className="sticky top-0 z-50 glass border-b border-white/20 dark:border-white/10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <h1 className="text-lg font-semibold">恋爱大事记</h1>
          </div>
          <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-1">
            <Plus className="w-4 h-4" /> 添加里程碑
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 筛选 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: "all", label: "全部" },
            { key: "manual", label: "里程碑" },
            { key: "task", label: "任务" },
            { key: "wish", label: "愿望" },
            { key: "footprint", label: "足迹" },
          ].map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
              className="whitespace-nowrap"
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{timeline?.length || 0}</div>
              <p className="text-xs text-muted-foreground">总事件</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">{timeline?.filter((t: any) => !t.isAuto).length || 0}</div>
              <p className="text-xs text-muted-foreground">里程碑</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-500">{groupedTimeline.length}</div>
              <p className="text-xs text-muted-foreground">跨越年份</p>
            </CardContent>
          </Card>
        </div>

        {/* 添加表单 */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card className="glass border-primary/30">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">添加里程碑</h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}><X className="w-4 h-4" /></Button>
                  </div>
                  <Input placeholder="里程碑标题" value={title} onChange={(e) => setTitle(e.target.value)} />
                  <Textarea placeholder="描述（可选）" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">选择图标</p>
                    <div className="flex flex-wrap gap-2">
                      {emojiOptions.map((e) => (
                        <button
                          key={e}
                          onClick={() => setEmoji(e)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                            emoji === e ? "bg-primary/20 ring-2 ring-primary scale-110" : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                  <Button onClick={handleSubmit} disabled={createMilestone.isPending} className="w-full">
                    {createMilestone.isPending ? "添加中..." : "添加里程碑"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 时间线 */}
        {groupedTimeline.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">还没有大事记</p>
              <p className="text-sm text-muted-foreground mt-1">添加里程碑或完成任务、愿望来自动生成时间线</p>
            </CardContent>
          </Card>
        ) : (
          groupedTimeline.map(([year, items]) => (
            <div key={year}>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-xl font-bold text-primary">{year}</div>
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground">{(items as any[]).length} 件事</span>
              </div>
              <div className="relative pl-8 space-y-4">
                {/* 时间线竖线 */}
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />
                
                {(items as any[]).map((item: any, index: number) => {
                  const catInfo = categoryIcons[item.category] || categoryIcons.manual;
                  const IconComp = catInfo.icon;
                  return (
                    <motion.div
                      key={`${item.category}-${item.id}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="relative">
                        {/* 时间线节点 */}
                        <div className={`absolute -left-8 top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          item.isAuto ? "bg-muted" : "bg-primary/20"
                        }`}>
                          {item.emoji || <IconComp className={`w-3 h-3 ${catInfo.color}`} />}
                        </div>
                        <Card className={`glass ${!item.isAuto ? "border-primary/20" : ""}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg">{item.emoji}</span>
                                  <h3 className="font-medium">{item.title}</h3>
                                  {!item.isAuto && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">里程碑</span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  {format(new Date(item.eventDate), "yyyy年MM月dd日", { locale: zhCN })}
                                </p>
                              </div>
                              {!item.isAuto && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    if (confirm("确定删除这个里程碑吗？")) {
                                      deleteMilestone.mutate({ id: item.id });
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
