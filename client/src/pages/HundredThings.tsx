import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Check, Sparkles, X, ChevronLeft, ChevronRight, Undo2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function HundredThings() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [completeNote, setCompleteNote] = useState("");
  const [filter, setFilter] = useState<"all" | "done" | "todo">("all");

  const { data: things, refetch } = trpc.hundredThings.list.useQuery({ year });
  const { data: stats } = trpc.hundredThings.getStats.useQuery({ year });

  const initFromPreset = trpc.hundredThings.initFromPreset.useMutation({
    onSuccess: (data) => {
      toast.success(`已初始化 ${data.count} 件事`);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const createThing = trpc.hundredThings.create.useMutation({
    onSuccess: () => {
      toast.success("已添加");
      setNewTitle("");
      setShowAddForm(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const completeThing = trpc.hundredThings.complete.useMutation({
    onSuccess: () => {
      toast.success("太棒了！又完成一件事 🎉");
      setCompletingId(null);
      setCompleteNote("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const uncompleteThing = trpc.hundredThings.uncomplete.useMutation({
    onSuccess: () => {
      toast.success("已撤销完成");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredThings = useMemo(() => {
    if (!things) return [];
    if (filter === "done") return things.filter((t: any) => t.isCompleted);
    if (filter === "todo") return things.filter((t: any) => !t.isCompleted);
    return things;
  }, [things, filter]);

  const progress = stats ? (stats.total > 0 ? stats.completed / stats.total : 0) : 0;

  return (
    <div className="min-h-screen gradient-warm-subtle">
      <header className="sticky top-0 z-50 glass border-b border-white/20 dark:border-white/10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <h1 className="text-lg font-semibold">一起做100件事</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setYear(y => y - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">{year}</span>
            <Button variant="ghost" size="icon" onClick={() => setYear(y => y + 1)} disabled={year >= currentYear}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 进度卡片 */}
        <Card className="glass overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-purple-500/10" />
          <CardContent className="relative p-6">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold text-primary">
                {stats?.completed || 0} <span className="text-lg text-muted-foreground">/ {stats?.total || 0}</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{year} 年我们一起完成的事</p>
            </div>
            <div className="h-4 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              {Math.round(progress * 100)}% 完成
              {progress >= 1 && " 🎉 全部完成！"}
            </p>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        {(!things || things.length === 0) ? (
          <Card className="glass">
            <CardContent className="p-8 text-center space-y-4">
              <Sparkles className="w-12 h-12 text-primary mx-auto" />
              <div>
                <h3 className="font-semibold mb-1">{year} 年还没有事项</h3>
                <p className="text-sm text-muted-foreground">从预设列表开始，或自己添加想做的事</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => initFromPreset.mutate({ year })} disabled={initFromPreset.isPending}>
                  <Sparkles className="w-4 h-4 mr-1" />
                  {initFromPreset.isPending ? "初始化中..." : "使用预设列表"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-1" /> 自己添加
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 筛选和添加 */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {[
                  { key: "all" as const, label: "全部" },
                  { key: "todo" as const, label: "待完成" },
                  { key: "done" as const, label: "已完成" },
                ].map((f) => (
                  <Button
                    key={f.key}
                    size="sm"
                    variant={filter === f.key ? "default" : "outline"}
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
              {(things?.length || 0) < 100 && (
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-1" /> 添加
                </Button>
              )}
            </div>

            {/* 添加表单 */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <Card className="glass border-primary/30">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">添加新事项</h3>
                        <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}><X className="w-4 h-4" /></Button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="想一起做的事..."
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && newTitle.trim() && createThing.mutate({ title: newTitle.trim(), year })}
                        />
                        <Button onClick={() => newTitle.trim() && createThing.mutate({ title: newTitle.trim(), year })} disabled={createThing.isPending}>
                          添加
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 事项列表 */}
            <div className="space-y-2">
              {filteredThings.map((thing: any, index: number) => (
                <motion.div
                  key={thing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card className={`glass transition-all ${thing.isCompleted ? "border-green-300/50 dark:border-green-700/50" : ""}`}>
                    <CardContent className="p-3">
                      {completingId === thing.id ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">完成「{thing.title}」</p>
                          <Textarea
                            placeholder="写下你们的感想（可选）"
                            value={completeNote}
                            onChange={(e) => setCompleteNote(e.target.value)}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => completeThing.mutate({ id: thing.id, note: completeNote || undefined })}
                              disabled={completeThing.isPending}
                            >
                              确认完成
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setCompletingId(null); setCompleteNote(""); }}>
                              取消
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            thing.isCompleted
                              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-muted/50 text-muted-foreground"
                          }`}>
                            {thing.isCompleted ? <Check className="w-4 h-4" /> : thing.thingIndex}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${thing.isCompleted ? "line-through text-muted-foreground" : "font-medium"}`}>
                              {thing.title}
                            </p>
                            {thing.note && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">💬 {thing.note}</p>
                            )}
                          </div>
                          {thing.isCompleted ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-orange-500"
                              onClick={() => {
                                if (confirm("确定撤销完成吗？")) {
                                  uncompleteThing.mutate({ id: thing.id });
                                }
                              }}
                            >
                              <Undo2 className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                              onClick={() => setCompletingId(thing.id)}
                            >
                              <Check className="w-4 h-4 mr-1" /> 完成
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
