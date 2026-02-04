import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Film, Utensils, Check, Trash2, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

type ListType = "movie" | "restaurant";

export default function TodoList() {
  const [activeTab, setActiveTab] = useState<ListType>("movie");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    type: "movie" as ListType,
  });

  const { data: movies, refetch: refetchMovies } = trpc.todoList.list.useQuery({ type: "movie" });
  const { data: restaurants, refetch: refetchRestaurants } = trpc.todoList.list.useQuery({ type: "restaurant" });

  const createItem = trpc.todoList.create.useMutation({
    onSuccess: () => {
      toast.success("已添加！");
      setIsCreateOpen(false);
      setNewItem({ title: "", description: "", type: activeTab });
      if (activeTab === "movie") refetchMovies();
      else refetchRestaurants();
    },
    onError: (err) => toast.error(err.message),
  });

  const completeItem = trpc.todoList.complete.useMutation({
    onSuccess: () => {
      toast.success("已完成！");
      if (activeTab === "movie") refetchMovies();
      else refetchRestaurants();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteItem = trpc.todoList.delete.useMutation({
    onSuccess: () => {
      toast.success("已删除");
      if (activeTab === "movie") refetchMovies();
      else refetchRestaurants();
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

  const currentList = activeTab === "movie" ? movies : restaurants;
  const pendingItems = currentList?.filter(i => !i.isCompleted) || [];
  const completedItems = currentList?.filter(i => i.isCompleted) || [];

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
                <DialogTitle>
                  {activeTab === "movie" ? "添加想看的电影" : "添加想吃的餐厅"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{activeTab === "movie" ? "电影名称" : "餐厅名称"}</Label>
                  <Input
                    placeholder={activeTab === "movie" ? "例如：你的名字" : "例如：海底捞"}
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>备注（可选）</Label>
                  <Textarea
                    placeholder={activeTab === "movie" ? "为什么想看这部电影..." : "推荐菜品、地址等..."}
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

      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ListType)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="movie" className="gap-2">
              <Film className="w-4 h-4" />
              电影
            </TabsTrigger>
            <TabsTrigger value="restaurant" className="gap-2">
              <Utensils className="w-4 h-4" />
              美食
            </TabsTrigger>
          </TabsList>

          <TabsContent value="movie" className="space-y-6">
            <ListContent
              type="movie"
              pendingItems={pendingItems}
              completedItems={completedItems}
              onComplete={(id) => completeItem.mutate({ id })}
              onDelete={(id) => deleteItem.mutate({ id })}
              onAdd={handleOpenCreate}
            />
          </TabsContent>

          <TabsContent value="restaurant" className="space-y-6">
            <ListContent
              type="restaurant"
              pendingItems={pendingItems}
              completedItems={completedItems}
              onComplete={(id) => completeItem.mutate({ id })}
              onDelete={(id) => deleteItem.mutate({ id })}
              onAdd={handleOpenCreate}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

interface ListContentProps {
  type: ListType;
  pendingItems: any[];
  completedItems: any[];
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

function ListContent({ type, pendingItems, completedItems, onComplete, onDelete, onAdd }: ListContentProps) {
  const Icon = type === "movie" ? Film : Utensils;
  const emptyText = type === "movie" ? "想看的电影" : "想吃的餐厅";

  if (pendingItems.length === 0 && completedItems.length === 0) {
    return (
      <Card className="glass border-white/40">
        <CardContent className="p-12 text-center">
          <Icon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">还没有{emptyText}</p>
          <Button onClick={onAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            添加{emptyText}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {pendingItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">想{type === "movie" ? "看" : "吃"}</h2>
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <Card key={item.id} className="glass border-white/40">
                <CardContent className="p-4 flex items-start gap-4">
                  <button
                    className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors mt-0.5"
                    onClick={() => onComplete(item.id)}
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
                    onClick={() => onDelete(item.id)}
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
          <h2 className="text-lg font-semibold mb-4">已{type === "movie" ? "看" : "吃"} ✨</h2>
          <div className="space-y-3">
            {completedItems.map((item) => (
              <Card key={item.id} className="glass border-white/40 opacity-70">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium line-through text-muted-foreground">{item.title}</h3>
                  </div>
                  {item.rating && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm">{item.rating}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
