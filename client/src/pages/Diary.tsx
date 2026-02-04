import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, BookOpen, Heart, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const moods = [
  { value: "happy", label: "😊 开心" },
  { value: "loving", label: "🥰 甜蜜" },
  { value: "peaceful", label: "😌 平静" },
  { value: "excited", label: "🤩 兴奋" },
  { value: "sad", label: "😢 难过" },
  { value: "tired", label: "😴 疲惫" },
];

const weathers = [
  { value: "sunny", label: "☀️ 晴天" },
  { value: "cloudy", label: "⛅ 多云" },
  { value: "rainy", label: "🌧️ 雨天" },
  { value: "snowy", label: "❄️ 雪天" },
];

export default function Diary() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDiary, setNewDiary] = useState({
    title: "",
    content: "",
    mood: "",
    weather: "",
  });

  const { data: diaries, refetch } = trpc.diary.list.useQuery();

  const createDiary = trpc.diary.create.useMutation({
    onSuccess: () => {
      toast.success("日记发布成功！");
      setIsCreateOpen(false);
      setNewDiary({ title: "", content: "", mood: "", weather: "" });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!newDiary.content.trim()) {
      toast.error("请输入日记内容");
      return;
    }
    createDiary.mutate({
      title: newDiary.title || undefined,
      content: newDiary.content,
      mood: newDiary.mood || undefined,
      weather: newDiary.weather || undefined,
    });
  };

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
            <h1 className="font-semibold">恋爱日记</h1>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                写日记
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>写日记</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>标题（可选）</Label>
                  <Input
                    placeholder="给今天起个标题..."
                    value={newDiary.title}
                    onChange={(e) => setNewDiary({ ...newDiary, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>心情</Label>
                    <Select value={newDiary.mood} onValueChange={(v) => setNewDiary({ ...newDiary, mood: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择心情" />
                      </SelectTrigger>
                      <SelectContent>
                        {moods.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>天气</Label>
                    <Select value={newDiary.weather} onValueChange={(v) => setNewDiary({ ...newDiary, weather: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择天气" />
                      </SelectTrigger>
                      <SelectContent>
                        {weathers.map((w) => (
                          <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>内容</Label>
                  <Textarea
                    placeholder="记录今天的故事..."
                    rows={6}
                    value={newDiary.content}
                    onChange={(e) => setNewDiary({ ...newDiary, content: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createDiary.isPending}>
                  {createDiary.isPending ? "发布中..." : "发布日记"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container py-6">
        {diaries && diaries.length > 0 ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            {diaries.map((diary) => (
              <Card key={diary.id} className="glass border-white/40">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${diary.isOwn ? 'bg-primary/10' : 'bg-accent/10'}`}>
                        {diary.isOwn ? (
                          <BookOpen className="w-4 h-4 text-primary" />
                        ) : (
                          <Heart className="w-4 h-4 text-accent" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{diary.isOwn ? "我" : "TA"}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(diary.createdAt), "MM月dd日 HH:mm", { locale: zhCN })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {diary.mood && <span>{moods.find(m => m.value === diary.mood)?.label.split(' ')[0]}</span>}
                      {diary.weather && <span>{weathers.find(w => w.value === diary.weather)?.label.split(' ')[0]}</span>}
                    </div>
                  </div>
                  
                  {diary.title && (
                    <h3 className="font-semibold mb-2">{diary.title}</h3>
                  )}
                  <p className="text-foreground whitespace-pre-wrap">{diary.content}</p>
                  
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                      <MessageCircle className="w-4 h-4" />
                      评论
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                      <Heart className="w-4 h-4" />
                      喜欢
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass border-white/40 max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">还没有日记，写下第一篇吧</p>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                写日记
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
