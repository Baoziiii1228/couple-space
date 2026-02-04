import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Plus, Star, Check, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const presetTasks = [
  "一起看日出", "一起看日落", "一起去旅行", "一起做饭", "一起看电影",
  "一起逛街", "一起健身", "一起学习新技能", "一起养一盆植物", "一起拍情侣照",
  "一起去游乐园", "一起去海边", "一起去爬山", "一起去野餐", "一起去看演唱会",
];

export default function Tasks() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", category: "" });

  const { data: tasks, refetch } = trpc.task.list.useQuery();

  const createTask = trpc.task.create.useMutation({
    onSuccess: () => {
      toast.success("任务添加成功！");
      setIsCreateOpen(false);
      setNewTask({ title: "", description: "", category: "" });
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

  const deleteTask = trpc.task.delete.useMutation({
    onSuccess: () => {
      toast.success("已删除");
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

  const handleAddPreset = (title: string) => {
    createTask.mutate({ title, description: "", category: "预设" });
  };

  const stats = useMemo(() => {
    if (!tasks) return { total: 0, completed: 0, progress: 0 };
    const total = tasks.length;
    const completed = tasks.filter(t => t.isCompleted).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, progress };
  }, [tasks]);

  const pendingTasks = tasks?.filter(t => !t.isCompleted) || [];
  const completedTasks = tasks?.filter(t => t.isCompleted) || [];

  return (
    <div className="min-h-screen gradient-warm-subtle">
      <header className="sticky top-0 z-50 glass border-b border-white/20">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">情侣任务</h1>
          </div>
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
                  <Label>描述（可选）</Label>
                  <Textarea
                    placeholder="任务详情..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>快速添加</Label>
                  <div className="flex flex-wrap gap-2">
                    {presetTasks.slice(0, 6).map((title) => (
                      <Button
                        key={title}
                        variant="outline"
                        size="sm"
                        onClick={() => setNewTask({ ...newTask, title })}
                      >
                        {title}
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
      </header>

      <main className="container py-6 space-y-6">
        {/* 进度统计 */}
        <Card className="glass border-white/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">完成进度</h2>
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

        {/* 待完成任务 */}
        {pendingTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">待完成</h2>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <Card key={task.id} className="glass border-white/40">
                  <CardContent className="p-4 flex items-center gap-4">
                    <button
                      className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
                      onClick={() => completeTask.mutate({ id: task.id })}
                    >
                      <Check className="w-4 h-4 text-primary opacity-0 hover:opacity-100" />
                    </button>
                    <div className="flex-1">
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteTask.mutate({ id: task.id })}
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
            <h2 className="text-lg font-semibold mb-4">已完成 ✨</h2>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <Card key={task.id} className="glass border-white/40 opacity-70">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium line-through text-muted-foreground">{task.title}</h3>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {(!tasks || tasks.length === 0) && (
          <Card className="glass border-white/40">
            <CardContent className="p-12 text-center">
              <Star className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">还没有任务，添加你们想一起完成的事吧</p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {presetTasks.slice(0, 5).map((title) => (
                  <Button
                    key={title}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddPreset(title)}
                  >
                    {title}
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
      </main>
    </div>
  );
}
