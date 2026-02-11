
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, BookOpen, Heart, MessageCircle, Trash2, Search, X, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useMemo } from "react";
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

const quickTags = [
  { label: "💑 约会", text: "今天和TA一起约会" },
  { label: "🍽️ 美食", text: "今天吃了好吃的" },
  { label: "🎬 电影", text: "今天一起看了电影" },
  { label: "🎮 游戏", text: "今天一起玩游戏" },
  { label: "🚗 旅行", text: "今天一起去旅行" },
  { label: "🎁 礼物", text: "今天收到了礼物" },
  { label: "💪 运动", text: "今天一起运动" },
  { label: "📚 学习", text: "今天一起学习" },
  { label: "🏠 宅家", text: "今天在家待了一天" },
  { label: "😴 休息", text: "今天好好休息了" },
  { label: "💼 工作", text: "今天工作很忙" },
  { label: "🎉 庆祝", text: "今天有值得庆祝的事" },
  { label: "😢 想念", text: "今天很想TA" },
  { label: "💕 表白", text: "今天对TA说了心里话" },
  { label: "🌙 晚安", text: "晚安，好梦" },
];

export default function Diary() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDiary, setNewDiary] = useState({
    title: "",
    content: "",
    mood: "",
    weather: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMood, setFilterMood] = useState<string>("all");
  const [showSearch, setShowSearch] = useState(false);
  const [expandedDiary, setExpandedDiary] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

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

  const deleteDiary = trpc.diary.delete.useMutation({
    onSuccess: () => {
      toast.success("日记已删除");
      setDeleteConfirm(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const addComment = trpc.diary.addComment.useMutation({
    onSuccess: () => {
      toast.success("评论成功！");
      setCommentText("");
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

  const handleAddComment = (diaryId: number) => {
    if (!commentText.trim()) return;
    addComment.mutate({ diaryId, content: commentText.trim() });
  };

  // 搜索和筛选
  const filteredDiaries = useMemo(() => {
    if (!diaries) return [];
    return diaries.filter(diary => {
      const matchSearch = !searchQuery || 
        diary.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        diary.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMood = filterMood === "all" || diary.mood === filterMood;
      return matchSearch && matchMood;
    });
  }, [diaries, searchQuery, filterMood]);

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
            <h1 className="font-semibold">恋爱日记</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowSearch(!showSearch)}>
              <Search className="w-4 h-4" />
            </Button>
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
                    <Label>快捷标签</Label>
                    <div className="flex flex-wrap gap-2">
                      {quickTags.map((tag, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            const currentContent = newDiary.content;
                            const newContent = currentContent
                              ? currentContent + "\n" + tag.text
                              : tag.text;
                            setNewDiary({ ...newDiary, content: newContent });
                          }}
                        >
                          {tag.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>内容</Label>
                    <Textarea
                      placeholder="记录今天的故事...\n\n💡 提示：点击上方快捷标签可以快速添加内容"
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
        </div>
      </header>

      {/* 搜索和筛选栏 */}
      {showSearch && (
        <div className="sticky top-14 z-40 glass border-b border-white/20 dark:border-white/10">
          <div className="container py-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索日记内容或标题..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                variant={filterMood === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMood("all")}
              >
                全部
              </Button>
              {moods.map((m) => (
                <Button
                  key={m.value}
                  variant={filterMood === m.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterMood(m.value)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="container py-6">
        {/* 统计信息 */}
        {diaries && diaries.length > 0 && (
          <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
            <span>共 {diaries.length} 篇日记</span>
            {searchQuery || filterMood !== "all" ? (
              <span>筛选结果：{filteredDiaries.length} 篇</span>
            ) : null}
          </div>
        )}

        {filteredDiaries.length > 0 ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            {filteredDiaries.map((diary) => (
              <Card key={diary.id} className="glass border-white/40 dark:border-white/20">
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
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm">
                        {diary.mood && <span>{moods.find(m => m.value === diary.mood)?.label.split(' ')[0]}</span>}
                        {diary.weather && <span>{weathers.find(w => w.value === diary.weather)?.label.split(' ')[0]}</span>}
                      </div>
                      {diary.isOwn && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteConfirm(diary.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {diary.title && (
                    <h3 className="font-semibold mb-2">{diary.title}</h3>
                  )}
                  <p className="text-foreground whitespace-pre-wrap">{diary.content}</p>
                  
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1 text-muted-foreground"
                      onClick={() => setExpandedDiary(expandedDiary === diary.id ? null : diary.id)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      评论
                    </Button>
                  </div>

                  {/* 评论区 */}
                  {expandedDiary === diary.id && (
                    <div className="mt-3 pt-3 border-t border-border/30 space-y-3">
                      {/* 评论输入 */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="写下你的评论..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(diary.id);
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          onClick={() => handleAddComment(diary.id)}
                          disabled={!commentText.trim() || addComment.isPending}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        点击日记下方的评论按钮展开评论区
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : diaries && diaries.length > 0 ? (
          <Card className="glass border-white/40 dark:border-white/20 max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">没有找到匹配的日记</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => { setSearchQuery(""); setFilterMood("all"); }}
              >
                清除筛选
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass border-white/40 dark:border-white/20 max-w-md mx-auto">
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

      {/* 删除确认对话框 */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">确定要删除这篇日记吗？此操作不可撤销。</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>取消</Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && deleteDiary.mutate({ id: deleteConfirm })}
              disabled={deleteDiary.isPending}
            >
              {deleteDiary.isPending ? "删除中..." : "确认删除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
