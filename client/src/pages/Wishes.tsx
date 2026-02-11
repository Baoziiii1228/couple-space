import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Gift, Check, Trash2, Star, Shuffle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { motion, AnimatePresence } from "framer-motion";

const priorityConfig = {
  high: { label: "高", color: "text-red-500 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
  medium: { label: "中", color: "text-yellow-500 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  low: { label: "低", color: "text-green-500 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
};

const quickWishTags = [
  { label: "🚗 想去旅行", text: "一起去旅行" },
  { label: "📱 想买手机", text: "想买新手机" },
  { label: "👗 想买衣服", text: "想买新衣服" },
  { label: "🎮 想买游戏", text: "想买游戏" },
  { label: "💍 想要戒指", text: "想要一枚戒指" },
  { label: "🏠 想有自己的家", text: "想有一个属于我们的家" },
  { label: "🐱 想养宠物", text: "想养一只宠物" },
  { label: "📚 想学新技能", text: "想学习新技能" },
  { label: "🎂 想吃大餐", text: "想吃一顿大餐" },
  { label: "🌈 想实现梦想", text: "想实现我的梦想" },
  { label: "🎬 看演唱会", text: "一起去看演唱会" },
  { label: "🏖️ 去海边", text: "一起去海边度假" },
];

export default function Wishes() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [randomWish, setRandomWish] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newWish, setNewWish] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
  });

  const { data: wishes, refetch } = trpc.wish.list.useQuery();

  const createWish = trpc.wish.create.useMutation({
    onSuccess: () => {
      toast.success("愿望已添加！");
      setIsCreateOpen(false);
      setNewWish({ title: "", description: "", priority: "medium" });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const completeWish = trpc.wish.complete.useMutation({
    onSuccess: () => {
      toast.success("愿望已实现！🎉");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deleteWish = trpc.wish.delete.useMutation({
    onSuccess: () => {
      toast.success("已删除");
      setDeleteId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!newWish.title.trim()) {
      toast.error("请输入愿望内容");
      return;
    }
    createWish.mutate(newWish);
  };

  // 随机抽取愿望
  const drawRandomWish = () => {
    const pending = wishes?.filter(w => !w.isCompleted) || [];
    if (pending.length === 0) {
      toast.error("没有待实现的愿望可以抽取");
      return;
    }
    setIsDrawing(true);
    setRandomWish(null);
    
    // 动画效果：快速切换几次再停下
    let count = 0;
    const interval = setInterval(() => {
      count++;
      const idx = Math.floor(Math.random() * pending.length);
      setRandomWish(pending[idx]);
      if (count >= 12) {
        clearInterval(interval);
        setIsDrawing(false);
        const finalIdx = Math.floor(Math.random() * pending.length);
        setRandomWish(pending[finalIdx]);
        toast.success("命运之手选中了这个愿望！✨");
      }
    }, 120);
  };

  const pendingWishes = wishes?.filter(w => !w.isCompleted) || [];
  const completedWishes = wishes?.filter(w => w.isCompleted) || [];

  return (
    <div className="min-h-screen gradient-warm-subtle">
      <header className="sticky top-0 z-50 glass border-b border-white/20 dark:border-white/10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">愿望清单</h1>
          </div>
          <div className="flex items-center gap-2">
            {pendingWishes.length > 0 && (
              <Button variant="outline" size="sm" className="gap-1" onClick={drawRandomWish} disabled={isDrawing}>
                <Shuffle className="w-4 h-4" />
                抽签
              </Button>
            )}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  许愿
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>许个愿望</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>愿望内容</Label>
                    <Input
                      placeholder="例如：一起去看极光"
                      value={newWish.title}
                      onChange={(e) => setNewWish({ ...newWish, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>快捷标签</Label>
                    <div className="flex flex-wrap gap-2">
                      {quickWishTags.map((tag, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => setNewWish({ ...newWish, title: tag.text })}
                        >
                          {tag.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>详细描述（可选）</Label>
                    <Textarea
                      placeholder="写下更多细节..."
                      value={newWish.description}
                      onChange={(e) => setNewWish({ ...newWish, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>优先级</Label>
                    <Select 
                      value={newWish.priority} 
                      onValueChange={(v: "low" | "medium" | "high") => setNewWish({ ...newWish, priority: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">非常想要</SelectItem>
                        <SelectItem value="medium">比较想要</SelectItem>
                        <SelectItem value="low">有点想要</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={handleCreate} disabled={createWish.isPending}>
                    {createWish.isPending ? "添加中..." : "许下愿望 ✨"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 随机抽取结果 */}
        <AnimatePresence>
          {randomWish && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
            >
              <Card className={`border-2 border-primary/50 overflow-hidden ${isDrawing ? 'animate-pulse' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10" />
                <CardContent className="relative p-6 text-center">
                  <div className="text-4xl mb-3">🎯</div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {isDrawing ? "命运之手正在选择..." : "今天就来实现这个愿望吧！"}
                  </p>
                  <h3 className="text-xl font-bold mb-2">{randomWish.title}</h3>
                  {randomWish.description && (
                    <p className="text-sm text-muted-foreground mb-4">{randomWish.description}</p>
                  )}
                  {!isDrawing && (
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        size="sm"
                        onClick={() => completeWish.mutate({ id: randomWish.id })}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        实现它
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={drawRandomWish}
                      >
                        <Shuffle className="w-4 h-4 mr-1" />
                        再抽一次
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRandomWish(null)}
                      >
                        关闭
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 统计 */}
        {wishes && wishes.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="glass border-white/40 dark:border-white/10">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">总愿望</p>
                <p className="text-xl font-bold text-primary">{wishes.length}</p>
              </CardContent>
            </Card>
            <Card className="glass border-white/40 dark:border-white/10">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">待实现</p>
                <p className="text-xl font-bold text-yellow-500">{pendingWishes.length}</p>
              </CardContent>
            </Card>
            <Card className="glass border-white/40 dark:border-white/10">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">已实现</p>
                <p className="text-xl font-bold text-green-500">{completedWishes.length}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 待实现的愿望 */}
        {pendingWishes.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">等待实现 ✨</h2>
            <div className="space-y-3">
              {pendingWishes.map((wish) => {
                const priority = priorityConfig[wish.priority];
                return (
                  <Card key={wish.id} className="glass border-white/40 dark:border-white/10">
                    <CardContent className="p-4 flex items-start gap-4">
                      <button
                        className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors mt-0.5"
                        onClick={() => completeWish.mutate({ id: wish.id })}
                      >
                        <Check className="w-4 h-4 text-primary opacity-0 hover:opacity-100" />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{wish.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${priority.bg} ${priority.color}`}>
                            {priority.label}
                          </span>
                        </div>
                        {wish.description && (
                          <p className="text-sm text-muted-foreground">{wish.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(wish.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* 已实现的愿望 */}
        {completedWishes.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">已实现 🎉</h2>
            <div className="space-y-3">
              {completedWishes.map((wish) => (
                <Card key={wish.id} className="glass border-white/40 dark:border-white/10 opacity-70">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium line-through text-muted-foreground">{wish.title}</h3>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {(!wishes || wishes.length === 0) && (
          <Card className="glass border-white/40 dark:border-white/10">
            <CardContent className="p-12 text-center">
              <Gift className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">还没有愿望，许下你们的第一个愿望吧</p>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Star className="w-4 h-4" />
                许个愿望
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteWish.mutate({ id: deleteId })}
        title="删除愿望"
        description="确定要删除这个愿望吗？删除后无法恢复。"
        isPending={deleteWish.isPending}
      />
    </div>
  );
}
