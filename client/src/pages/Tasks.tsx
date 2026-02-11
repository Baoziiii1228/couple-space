import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Plus, Star, Check, Trash2, Filter, Search, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

const categories = [
  { value: "", label: "全部", emoji: "📋" },
  { value: "约会", label: "约会", emoji: "💑" },
  { value: "旅行", label: "旅行", emoji: "✈️" },
  { value: "美食", label: "美食", emoji: "🍽️" },
  { value: "运动", label: "运动", emoji: "🏃" },
  { value: "学习", label: "学习", emoji: "📚" },
  { value: "生活", label: "生活", emoji: "🏠" },
  { value: "其他", label: "其他", emoji: "✨" },
];

const presetTasks = [
  { title: "一起看日出", category: "约会" },
  { title: "一起看日落", category: "约会" },
  { title: "一起去旅行", category: "旅行" },
  { title: "一起做饭", category: "美食" },
  { title: "一起看电影", category: "约会" },
  { title: "一起逛街", category: "生活" },
  { title: "一起健身", category: "运动" },
  { title: "一起学习新技能", category: "学习" },
  { title: "一起养一盆植物", category: "生活" },
  { title: "一起拍情侣照", category: "约会" },
  { title: "一起去游乐园", category: "旅行" },
  { title: "一起去海边", category: "旅行" },
  { title: "一起去爬山", category: "运动" },
  { title: "一起去野餐", category: "美食" },
  { title: "一起去看演唱会", category: "约会" },
];

export default function Tasks() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [newTask, setNewTask] = useState({ title: "", description: "", category: "其他", priority: "medium" as "high" | "medium" | "low" });

  const { data: tasks, refetch } = trpc.task.list.useQuery();

  const createTask = trpc.task.create.useMutation({
    onSuccess: () => {
      toast.success("任务添加成功！");
      setIsCreateOpen(false);
      setNewTask({ title: "", description: "", category: "其他", priority: "medium" });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const completeTask = trpc.task.complete.useMutation({
    onSuccess: () => {
      toast.success("任务完成！🎉");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deleteTask = trpc.task.delete.useMutation({
    onSuccess: () => {
      toast.success("已删除");
      setDeleteId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!newTask.title.trim()) {
      toast.error("请输入任务名称");
      return;
    }
    createTask.mutate(newTask);
  };

  const handleAddPreset = (preset: { title: string; category: string }) => {
    createTask.mutate({ title: preset.title, description: "", category: preset.category });
  };

  // 按搜索、分类、优先级和状态筛选
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    let filtered = tasks;
    
    // 搜索过滤
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // 分类过滤
    if (activeFilter) {
      filtered = filtered.filter(t => t.category === activeFilter);
    }
    
    // 优先级过滤
    if (priorityFilter) {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }
    
    // 状态过滤
    if (statusFilter === "pending") {
      filtered = filtered.filter(t => !t.isCompleted);
    } else if (statusFilter === "completed") {
      filtered = filtered.filter(t => t.isCompleted);
    }
    
    return filtered;
  }, [tasks, searchQuery, activeFilter, priorityFilter, statusFilter]);

  const stats = useMemo(() => {
    if (!tasks) return { total: 0, completed: 0, progress: 0 };
    const total = tasks.length;
    const completed = tasks.filter(t => t.isCompleted).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, progress };
  }, [tasks]);

  // 分类统计
  const categoryStats = useMemo(() => {
    if (!tasks) return {};
    const stats: Record<string, { total: number; completed: number }> = {};
    tasks.forEach(t => {
      const cat = t.category || "其他";
      if (!stats[cat]) stats[cat] = { total: 0, completed: 0 };
      stats[cat].total++;
      if (t.isCompleted) stats[cat].completed++;
    });
    return stats;
  }, [tasks]);

  const pendingTasks = filteredTasks.filter(t => !t.isCompleted);
  const completedTasks = filteredTasks.filter(t => t.isCompleted);

  const getCategoryEmoji = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.emoji || "✨";
  };

  return (
    <div className="min-h-screen gradient-warm-subtle dark:bg-slate-900">
      <header className="sticky top-0 z-50 glass border-b border-white/20 dark:border-white/10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-foreground">情侣任务</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showFilter ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setShowFilter(!showFilter)}
            >
              <Filter className="w-4 h-4" />
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  添加
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加任务</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>任务名称</Label>
                    <Input
                      placeholder="例如：一起去看海"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>分类</Label>
                    <div className="flex flex-wrap gap-2">
                      {categories.filter(c => c.value).map((cat) => (
                        <button
                          key={cat.value}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                            newTask.category === cat.value
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary/50 hover:bg-secondary"
                          }`}
                          onClick={() => setNewTask({ ...newTask, category: cat.value })}
                        >
                          {cat.emoji} {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>优先级</Label>
                    <div className="flex gap-2">
                      <button
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                          newTask.priority === "high"
                            ? "bg-red-500 text-white"
                            : "bg-secondary/50 hover:bg-secondary"
                        }`}
                        onClick={() => setNewTask({ ...newTask, priority: "high" })}
                      >
                        🔥 紧急
                      </button>
                      <button
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                          newTask.priority === "medium"
                            ? "bg-yellow-500 text-white"
                            : "bg-secondary/50 hover:bg-secondary"
                        }`}
                        onClick={() => setNewTask({ ...newTask, priority: "medium" })}
                      >
                        ⏰ 一般
                      </button>
                      <button
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                          newTask.priority === "low"
                            ? "bg-blue-500 text-white"
                            : "bg-secondary/50 hover:bg-secondary"
                        }`}
                        onClick={() => setNewTask({ ...newTask, priority: "low" })}
                      >
                        🌿 缓慢
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>描述（可选）</Label>
                    <Textarea
                      placeholder="任务详情..."
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>快速添加</Label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {presetTasks.map((preset) => (
                        <Button
                          key={preset.title}
                          variant="outline"
                          size="sm"
                          onClick={() => setNewTask({ ...newTask, title: preset.title, category: preset.category })}
                        >
                          {getCategoryEmoji(preset.category)} {preset.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleCreate} disabled={createTask.isPending}>
                    {createTask.isPending ? "添加中..." : "添加任务"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 进度统计 */}
        <Card className="glass border-white/40 dark:border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">完成进度</h2>
                <p className="text-sm text-muted-foreground">
                  已完成 {stats.completed} / {stats.total} 个任务
                </p>
              </div>
              <div className="text-3xl font-bold text-primary">
                {Math.round(stats.progress)}%
              </div>
            </div>
            <Progress value={stats.progress} className="h-3" />
          </CardContent>
        </Card>

        {/* 搜索和筛选栏 */}
        {showFilter && (
          <div className="space-y-3">
            {/* 搜索框 */}
            <div>
              <p className="text-sm font-medium mb-2">搜索任务</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索任务名称或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* 状态筛选 */}
            <div>
              <p className="text-sm font-medium mb-2">任务状态</p>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    statusFilter === "all"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary/50 hover:bg-secondary text-foreground"
                  }`}
                  onClick={() => setStatusFilter("all")}
                >
                  📋 全部
                </button>
                <button
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    statusFilter === "pending"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary/50 hover:bg-secondary text-foreground"
                  }`}
                  onClick={() => setStatusFilter("pending")}
                >
                  ⏳ 进行中
                </button>
                <button
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    statusFilter === "completed"
                      ? "bg-green-500 text-white shadow-md"
                      : "bg-secondary/50 hover:bg-secondary text-foreground"
                  }`}
                  onClick={() => setStatusFilter("completed")}
                >
                  ✅ 已完成
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">分类筛选</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
              const catStat = cat.value ? categoryStats[cat.value] : null;
              return (
                <button
                  key={cat.value}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1 ${
                    activeFilter === cat.value
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary/50 hover:bg-secondary text-foreground"
                  }`}
                  onClick={() => setActiveFilter(cat.value)}
                >
                  {cat.emoji} {cat.label}
                  {catStat && (
                    <span className="text-xs opacity-70">({catStat.completed}/{catStat.total})</span>
                  )}
                </button>
              );
                })}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">优先级筛选</p>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    priorityFilter === ""
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary/50 hover:bg-secondary text-foreground"
                  }`}
                  onClick={() => setPriorityFilter("")}
                >
                  📊 全部
                </button>
                <button
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    priorityFilter === "high"
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-secondary/50 hover:bg-secondary text-foreground"
                  }`}
                  onClick={() => setPriorityFilter("high")}
                >
                  🔥 紧急
                </button>
                <button
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    priorityFilter === "medium"
                      ? "bg-yellow-500 text-white shadow-md"
                      : "bg-secondary/50 hover:bg-secondary text-foreground"
                  }`}
                  onClick={() => setPriorityFilter("medium")}
                >
                  ⏰ 一般
                </button>
                <button
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    priorityFilter === "low"
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-secondary/50 hover:bg-secondary text-foreground"
                  }`}
                  onClick={() => setPriorityFilter("low")}
                >
                  🌿 缓慢
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 待完成任务 */}
        {pendingTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              待完成 {activeFilter && `· ${activeFilter}`}
            </h2>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <Card key={task.id} className="glass border-white/40 dark:border-white/20">
                  <CardContent className="p-4 flex items-center gap-4">
                    <button
                      className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors dark:hover:bg-primary/20"
                      onClick={() => completeTask.mutate({ id: task.id })}
                    >
                      <Check className="w-4 h-4 text-primary opacity-0 hover:opacity-100" />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-foreground">{task.title}</h3>
                        {task.priority && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            task.priority === "high" ? "bg-red-500/20 text-red-600 dark:text-red-400" :
                            task.priority === "medium" ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
                            "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                          }`}>
                            {task.priority === "high" ? "🔥 紧急" :
                             task.priority === "medium" ? "⏰ 一般" :
                             "🌿 缓慢"}
                          </span>
                        )}
                        {task.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">
                            {getCategoryEmoji(task.category)} {task.category}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 已完成任务 */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              已完成 ✨ {activeFilter && `· ${activeFilter}`}
            </h2>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <Card key={task.id} className="glass border-white/40 dark:border-white/20 opacity-70">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium line-through text-muted-foreground">{task.title}</h3>
                        {task.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">
                            {getCategoryEmoji(task.category)} {task.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {(!tasks || tasks.length === 0) && (
          <Card className="glass border-white/40 dark:border-white/20">
            <CardContent className="p-12 text-center">
              <Star className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">还没有任务，添加你们想一起完成的事吧</p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {presetTasks.slice(0, 5).map((preset) => (
                  <Button
                    key={preset.title}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddPreset(preset)}
                  >
                    {getCategoryEmoji(preset.category)} {preset.title}
                  </Button>
                ))}
              </div>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                自定义任务
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 筛选后无结果 */}
        {activeFilter && filteredTasks.length === 0 && tasks && tasks.length > 0 && (
          <Card className="glass border-white/40 dark:border-white/20">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">该分类下暂无任务</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setActiveFilter("")}
              >
                查看全部任务
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteTask.mutate({ id: deleteId })}
        title="删除任务"
        description="确定要删除这个任务吗？删除后无法恢复。"
        isPending={deleteTask.isPending}
      />
    </div>
  );
}
