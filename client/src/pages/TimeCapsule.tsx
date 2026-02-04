import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Clock, Lock, Unlock, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { format, differenceInDays, isPast } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function TimeCapsule() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<number | null>(null);
  const [newCapsule, setNewCapsule] = useState({
    title: "",
    content: "",
    openDate: "",
  });

  const { data: capsules, refetch } = trpc.timeCapsule.list.useQuery();

  const createCapsule = trpc.timeCapsule.create.useMutation({
    onSuccess: () => {
      toast.success("时光胶囊已封存！");
      setIsCreateOpen(false);
      setNewCapsule({ title: "", content: "", openDate: "" });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const openCapsule = trpc.timeCapsule.open.useMutation({
    onSuccess: () => {
      toast.success("时光胶囊已开启！");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!newCapsule.title.trim() || !newCapsule.content.trim() || !newCapsule.openDate) {
      toast.error("请填写完整信息");
      return;
    }
    if (new Date(newCapsule.openDate) <= new Date()) {
      toast.error("开启日期必须是未来的日期");
      return;
    }
    createCapsule.mutate(newCapsule);
  };

  const handleOpen = (id: number) => {
    openCapsule.mutate({ id });
    setSelectedCapsule(id);
  };

  const lockedCapsules = capsules?.filter(c => !c.isOpened && !c.canOpen) || [];
  const openableCapsules = capsules?.filter(c => !c.isOpened && c.canOpen) || [];
  const openedCapsules = capsules?.filter(c => c.isOpened) || [];

  const viewingCapsule = capsules?.find(c => c.id === selectedCapsule);

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
            <h1 className="font-semibold">时光胶囊</h1>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                写信
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>写一封给未来的信</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>标题</Label>
                  <Input
                    placeholder="给这封信起个名字..."
                    value={newCapsule.title}
                    onChange={(e) => setNewCapsule({ ...newCapsule, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>开启日期</Label>
                  <Input
                    type="date"
                    value={newCapsule.openDate}
                    onChange={(e) => setNewCapsule({ ...newCapsule, openDate: e.target.value })}
                    min={format(new Date(Date.now() + 86400000), "yyyy-MM-dd")}
                  />
                  <p className="text-xs text-muted-foreground">
                    在这个日期之前，信件将被封存，无法查看
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>信件内容</Label>
                  <Textarea
                    placeholder="写下你想对未来说的话..."
                    rows={8}
                    value={newCapsule.content}
                    onChange={(e) => setNewCapsule({ ...newCapsule, content: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createCapsule.isPending}>
                  {createCapsule.isPending ? "封存中..." : "封存时光胶囊 🔒"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 可以开启的胶囊 */}
        {openableCapsules.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-primary" />
              可以开启了！
            </h2>
            <div className="space-y-3">
              {openableCapsules.map((capsule) => (
                <Card key={capsule.id} className="glass border-white/40 border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{capsule.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          封存于 {format(new Date(capsule.createdAt), "yyyy年MM月dd日", { locale: zhCN })}
                        </p>
                      </div>
                      <Button onClick={() => handleOpen(capsule.id)}>
                        开启 ✨
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 未到期的胶囊 */}
        {lockedCapsules.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              等待开启
            </h2>
            <div className="space-y-3">
              {lockedCapsules.map((capsule) => {
                const daysLeft = differenceInDays(new Date(capsule.openDate), new Date());
                return (
                  <Card key={capsule.id} className="glass border-white/40">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                            <Mail className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-medium">{capsule.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(capsule.openDate), "yyyy年MM月dd日", { locale: zhCN })} 可开启
                            </p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{daysLeft}</div>
                          <div className="text-xs text-muted-foreground">天后</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* 已开启的胶囊 */}
        {openedCapsules.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">已开启的信件</h2>
            <div className="space-y-3">
              {openedCapsules.map((capsule) => (
                <Card 
                  key={capsule.id} 
                  className="glass border-white/40 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedCapsule(capsule.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{capsule.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {capsule.isOwn ? "我" : "TA"}写于 {format(new Date(capsule.createdAt), "yyyy年MM月dd日", { locale: zhCN })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {(!capsules || capsules.length === 0) && (
          <Card className="glass border-white/40">
            <CardContent className="p-12 text-center">
              <Clock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">还没有时光胶囊</p>
              <p className="text-sm text-muted-foreground mb-4">写一封信，封存到未来的某一天再打开</p>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                写一封信
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* 查看信件内容 */}
      <Dialog open={!!viewingCapsule && viewingCapsule.isOpened} onOpenChange={() => setSelectedCapsule(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewingCapsule?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {viewingCapsule?.isOwn ? "我" : "TA"}写于 {viewingCapsule && format(new Date(viewingCapsule.createdAt), "yyyy年MM月dd日", { locale: zhCN })}
            </p>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <p className="whitespace-pre-wrap">{viewingCapsule?.content}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
