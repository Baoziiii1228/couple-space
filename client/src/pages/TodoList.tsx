import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Film, Utensils, Check, Trash2, Star, Music, BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

type ListType = "movie" | "restaurant" | "music" | "book";

const tabConfig: Record<ListType, { icon: any; label: string; addLabel: string; verb: string; placeholder: string; descPlaceholder: string }> = {
  movie: { icon: Film, label: "电影", addLabel: "想看的电影", verb: "看", placeholder: "例如：你的名字", descPlaceholder: "为什么想看这部电影..." },
  restaurant: { icon: Utensils, label: "美食", addLabel: "想吃的餐厅", verb: "吃", placeholder: "例如：海底捞", descPlaceholder: "推荐菜品、地址等..." },
  music: { icon: Music, label: "音乐", addLabel: "想听的歌曲", verb: "听", placeholder: "例如：晴天 - 周杰伦", descPlaceholder: "为什么推荐这首歌..." },
  book: { icon: BookOpen, label: "书籍", addLabel: "想看的书", verb: "读", placeholder: "例如：小王子", descPlaceholder: "推荐理由..." },
};

export default function TodoList() {
  const [activeTab, setActiveTab] = useState<ListType>("movie");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [ratingItem, setRatingItem] = useState<{ id: number; rating: number } | null>(null);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    type: "movie" as ListType,
  });

  const { data: movies, refetch: refetchMovies } = trpc.todoList.list.useQuery({ type: "movie" });
  const { data: restaurants, refetch: refetchRestaurants } = trpc.todoList.list.useQuery({ type: "restaurant" });
  const { data: music, refetch: refetchMusic } = trpc.todoList.list.useQuery({ type: "music" });
  const { data: books, refetch: refetchBooks } = trpc.todoList.list.useQuery({ type: "book" });

  const refetchCurrent = () => {
    if (activeTab === "movie") refetchMovies();
    else if (activeTab === "restaurant") refetchRestaurants();
    else if (activeTab === "music") refetchMusic();
    else refetchBooks();
  };

  const createItem = trpc.todoList.create.useMutation({
    onSuccess: () => {
      toast.success("已添加！");
      setIsCreateOpen(false);
      setNewItem({ title: "", description: "", type: activeTab });
      refetchCurrent();
    },
    onError: (err) => toast.error(err.message),
  });

  const completeItem = trpc.todoList.complete.useMutation({
    onSuccess: () => {
      toast.success("已完成！");
      refetchCurrent();
    },
    onError: (err) => toast.error(err.message),
  });

  const rateItem = trpc.todoList.rate.useMutation({
    onSuccess: () => {
      toast.success("评分成功！");
      setRatingItem(null);
      refetchCurrent();
    },
    onError: (err) => toast.error(err.message),
  });

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deleteItem = trpc.todoList.delete.useMutation({
    onSuccess: () => {
      toast.success("已删除");
      setDeleteId(null);
      refetchCurrent();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!newItem.title.trim()) {
      toast.error("请输入名称");
      return;
    }
    createItem.mutate({
      type: activeTab,
      title: newItem.title,
      description: newItem.description || undefined,
    });
  };

  const handleOpenCreate = () => {
    setNewItem({ ...newItem, type: activeTab });
    setIsCreateOpen(true);
  };

  const handleCompleteWithRating = (id: number) => {
    setRatingItem({ id, rating: 0 });
  };

  const handleRate = () => {
    if (!ratingItem) return;
    // First complete, then rate
    completeItem.mutate({ id: ratingItem.id }, {
      onSuccess: () => {
        if (ratingItem.rating > 0) {
          rateItem.mutate({ id: ratingItem.id, rating: ratingItem.rating });
        } else {
          setRatingItem(null);
          refetchCurrent();
        }
      }
    });
  };

  const handleRateExisting = (id: number, rating: number) => {
    rateItem.mutate({ id, rating });
  };

  const getList = (type: ListType) => {
    switch (type) {
      case "movie": return movies;
      case "restaurant": return restaurants;
      case "music": return music;
      case "book": return books;
    }
  };

  const currentList = getList(activeTab);
  const pendingItems = currentList?.filter(i => !i.isCompleted) || [];
  const completedItems = currentList?.filter(i => i.isCompleted) || [];
  const config = tabConfig[activeTab];

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
            <h1 className="font-semibold">待办清单</h1>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4" />
                添加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加{config.addLabel}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{config.label}名称</Label>
                  <Input
                    placeholder={config.placeholder}
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>备注（可选）</Label>
                  <Textarea
                    placeholder={config.descPlaceholder}
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createItem.isPending}>
                  {createItem.isPending ? "添加中..." : "添加"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* 评分弹窗 */}
      <Dialog open={!!ratingItem} onOpenChange={(open) => !open && setRatingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>完成并评分</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">给它打个分吧（可选）</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="p-1 transition-transform hover:scale-110"
                  onClick={() => setRatingItem(prev => prev ? { ...prev, rating: star } : null)}
                >
                  <Star
                    className={`w-8 h-8 ${
                      ratingItem && star <= ratingItem.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {ratingItem && ratingItem.rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {ratingItem.rating === 1 && "不太行"}
                {ratingItem.rating === 2 && "一般般"}
                {ratingItem.rating === 3 && "还不错"}
                {ratingItem.rating === 4 && "很好"}
                {ratingItem.rating === 5 && "超级棒！"}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                if (ratingItem) {
                  completeItem.mutate({ id: ratingItem.id });
                  setRatingItem(null);
                }
              }}>
                跳过评分
              </Button>
              <Button className="flex-1" onClick={handleRate} disabled={!ratingItem?.rating}>
                确认
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ListType)}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {(Object.entries(tabConfig) as [ListType, typeof tabConfig[ListType]][]).map(([key, cfg]) => (
              <TabsTrigger key={key} value={key} className="gap-1 text-xs sm:text-sm">
                <cfg.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{cfg.label}</span>
                <span className="sm:hidden">{cfg.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(tabConfig) as ListType[]).map((type) => (
            <TabsContent key={type} value={type} className="space-y-6">
              {/* 统计 */}
              {currentList && currentList.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  <Card className="glass border-white/40 dark:border-white/10">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">总计</p>
                      <p className="text-xl font-bold text-primary">{currentList.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass border-white/40 dark:border-white/10">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">想{config.verb}</p>
                      <p className="text-xl font-bold text-yellow-500">{pendingItems.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass border-white/40 dark:border-white/10">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">已{config.verb}</p>
                      <p className="text-xl font-bold text-green-500">{completedItems.length}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {pendingItems.length === 0 && completedItems.length === 0 ? (
                <Card className="glass border-white/40 dark:border-white/10">
                  <CardContent className="p-12 text-center">
                    <config.icon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">还没有{config.addLabel}</p>
                    <Button onClick={handleOpenCreate} className="gap-2">
                      <Plus className="w-4 h-4" />
                      添加{config.addLabel}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {pendingItems.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold mb-4">想{config.verb}</h2>
                      <div className="space-y-3">
                        {pendingItems.map((item) => (
                          <Card key={item.id} className="glass border-white/40 dark:border-white/10">
                            <CardContent className="p-4 flex items-start gap-4">
                              <button
                                className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors mt-0.5"
                                onClick={() => handleCompleteWithRating(item.id)}
                              >
                                <Check className="w-4 h-4 text-primary opacity-0 hover:opacity-100" />
                              </button>
                              <div className="flex-1">
                                <h3 className="font-medium">{item.title}</h3>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteId(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {completedItems.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold mb-4">已{config.verb} ✨</h2>
                      <div className="space-y-3">
                        {completedItems.map((item) => (
                          <Card key={item.id} className="glass border-white/40 dark:border-white/10 opacity-80">
                            <CardContent className="p-4 flex items-center gap-4">
                              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-4 h-4 text-primary-foreground" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium text-muted-foreground">{item.title}</h3>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground/70 mt-1">{item.description}</p>
                                )}
                              </div>
                              {item.rating ? (
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star
                                      key={s}
                                      className={`w-3.5 h-3.5 ${
                                        s <= (item.rating ?? 0)
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-muted-foreground"
                                  onClick={() => setRatingItem({ id: item.id, rating: 0 })}
                                >
                                  评分
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteItem.mutate({ id: deleteId })}
        title="删除清单项"
        description="确定要删除这个清单项吗？删除后无法恢复。"
        isPending={deleteItem.isPending}
      />
    </div>
  );
}
