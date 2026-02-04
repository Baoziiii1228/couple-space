import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Calendar, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";

const emojiOptions = ["💕", "💍", "🎂", "🎄", "🎁", "🌹", "✈️", "🏠", "👶", "🎓"];

export default function Anniversary() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAnniversary, setNewAnniversary] = useState({
    title: "",
    date: "",
    emoji: "💕",
    isLunar: false,
  });

  const { data: anniversaries, refetch } = trpc.anniversary.list.useQuery();

  const createAnniversary = trpc.anniversary.create.useMutation({
    onSuccess: () => {
      toast.success("纪念日添加成功！");
      setIsCreateOpen(false);
      setNewAnniversary({ title: "", date: "", emoji: "💕", isLunar: false });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteAnniversary = trpc.anniversary.delete.useMutation({
    onSuccess: () => {
      toast.success("已删除");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!newAnniversary.title.trim() || !newAnniversary.date) {
      toast.error("请填写完整信息");
      return;
    }
    createAnniversary.mutate({
      title: newAnniversary.title,
      date: newAnniversary.date,
      emoji: newAnniversary.emoji,
      isLunar: newAnniversary.isLunar,
    });
  };

  // 计算每个纪念日的倒计时
  const anniversariesWithCountdown = useMemo(() => {
    if (!anniversaries) return [];
    const now = new Date();
    
    return anniversaries.map(a => {
      const date = new Date(a.date);
      const thisYear = new Date(now.getFullYear(), date.getMonth(), date.getDate());
      if (thisYear < now) {
        thisYear.setFullYear(thisYear.getFullYear() + 1);
      }
      const daysLeft = differenceInDays(thisYear, now);
      const isPast = daysLeft < 0;
      
      return { ...a, nextDate: thisYear, daysLeft: Math.abs(daysLeft), isPast };
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [anniversaries]);

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
            <h1 className="font-semibold">纪念日</h1>
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
                <DialogTitle>添加纪念日</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>纪念日名称</Label>
                  <Input
                    placeholder="例如：在一起纪念日"
                    value={newAnniversary.title}
                    onChange={(e) => setNewAnniversary({ ...newAnniversary, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>日期</Label>
                  <Input
                    type="date"
                    value={newAnniversary.date}
                    onChange={(e) => setNewAnniversary({ ...newAnniversary, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>选择图标</Label>
                  <div className="flex flex-wrap gap-2">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                          newAnniversary.emoji === emoji 
                            ? 'bg-primary/20 ring-2 ring-primary' 
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                        onClick={() => setNewAnniversary({ ...newAnniversary, emoji })}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>农历日期</Label>
                  <Switch
                    checked={newAnniversary.isLunar}
                    onCheckedChange={(checked) => setNewAnniversary({ ...newAnniversary, isLunar: checked })}
                  />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createAnniversary.isPending}>
                  {createAnniversary.isPending ? "添加中..." : "添加纪念日"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container py-6">
        {anniversariesWithCountdown.length > 0 ? (
          <div className="space-y-4 max-w-lg mx-auto">
            {anniversariesWithCountdown.map((anniversary) => (
              <Card key={anniversary.id} className="glass border-white/40 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center">
                    <div className="w-20 h-20 flex items-center justify-center bg-primary/5 text-3xl">
                      {anniversary.emoji}
                    </div>
                    <div className="flex-1 p-4">
                      <h3 className="font-semibold mb-1">{anniversary.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(anniversary.date), "yyyy年MM月dd日", { locale: zhCN })}
                        {anniversary.isLunar && " (农历)"}
                      </p>
                    </div>
                    <div className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{anniversary.daysLeft}</div>
                      <div className="text-xs text-muted-foreground">
                        {anniversary.daysLeft === 0 ? "今天！" : "天后"}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-2 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteAnniversary.mutate({ id: anniversary.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass border-white/40 max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">还没有纪念日，添加第一个吧</p>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                添加纪念日
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
