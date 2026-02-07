
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Gift, Check, Trash2, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

const priorityConfig = {
  high: { label: "高", color: "text-red-500 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
  medium: { label: "中", color: "text-yellow-500 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  low: { label: "低", color: "text-green-500 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
};

export default function Wishes() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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

  const deleteWish = trpc.wish.delete.useMutation({
    onSuccess: () => {
      toast.success("已删除");
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
                      <SelectItem value="high">⭐⭐⭐ 非常想要</SelectItem>
                      <SelectItem value="medium">⭐⭐ 比较想要</SelectItem>
                      <SelectItem value="low">⭐ 有点想要</SelectItem>
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
      </header>

      <main className="container py-6 space-y-6">
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
                        onClick={() => deleteWish.mutate({ id: wish.id })}
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
    </div>
  );
}

