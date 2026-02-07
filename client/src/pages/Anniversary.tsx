import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Calendar, Trash2, Palette, Image, Edit2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import Countdown from "@/components/Countdown";

const emojiOptions = ["💕", "💍", "🎂", "🎄", "🎁", "🌹", "✈️", "🏠", "👶", "🎓"];

// 预设渐变颜色
const presetGradients = [
  { name: "玫瑰金", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { name: "日落橙", value: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
  { name: "薰衣草", value: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)" },
  { name: "海洋蓝", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "薄荷绿", value: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
  { name: "星空紫", value: "linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)" },
  { name: "暖阳", value: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)" },
  { name: "樱花粉", value: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)" },
];

// 预设纯色
const presetColors = [
  { name: "玫红", value: "#e91e63" },
  { name: "珊瑚", value: "#ff7043" },
  { name: "琥珀", value: "#ffc107" },
  { name: "翠绿", value: "#4caf50" },
  { name: "天蓝", value: "#2196f3" },
  { name: "紫罗兰", value: "#9c27b0" },
  { name: "靛蓝", value: "#3f51b5" },
  { name: "青色", value: "#00bcd4" },
];

interface AnniversaryForm {
  title: string;
  date: string;
  emoji: string;
  isLunar: boolean;
  bgImage: string;
  bgColor: string;
}

const defaultForm: AnniversaryForm = {
  title: "",
  date: "",
  emoji: "💕",
  isLunar: false,
  bgImage: "",
  bgColor: "",
};

export default function Anniversary() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AnniversaryForm>(defaultForm);
  const [bgTab, setBgTab] = useState<"gradient" | "color" | "image">("gradient");

  const { data: anniversaries, refetch } = trpc.anniversary.list.useQuery();

  const createAnniversary = trpc.anniversary.create.useMutation({
    onSuccess: () => {
      toast.success("纪念日添加成功！");
      setIsCreateOpen(false);
      setFormData(defaultForm);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateAnniversary = trpc.anniversary.update.useMutation({
    onSuccess: () => {
      toast.success("纪念日更新成功！");
      setIsEditOpen(false);
      setEditingId(null);
      setFormData(defaultForm);
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
    if (!formData.title.trim() || !formData.date) {
      toast.error("请填写完整信息");
      return;
    }
    createAnniversary.mutate({
      title: formData.title,
      date: formData.date,
      emoji: formData.emoji,
      isLunar: formData.isLunar,
      bgImage: formData.bgImage || undefined,
      bgColor: formData.bgColor || undefined,
    });
  };

  const handleUpdate = () => {
    if (!editingId || !formData.title.trim() || !formData.date) {
      toast.error("请填写完整信息");
      return;
    }
    updateAnniversary.mutate({
      id: editingId,
      title: formData.title,
      date: formData.date,
      emoji: formData.emoji,
      isLunar: formData.isLunar,
      bgImage: formData.bgImage || null,
      bgColor: formData.bgColor || null,
    });
  };

  const openEditDialog = (anniversary: any) => {
    setEditingId(anniversary.id);
    setFormData({
      title: anniversary.title,
      date: format(new Date(anniversary.date), "yyyy-MM-dd"),
      emoji: anniversary.emoji || "💕",
      isLunar: anniversary.isLunar,
      bgImage: anniversary.bgImage || "",
      bgColor: anniversary.bgColor || "",
    });
    setIsEditOpen(true);
  };

  const selectBgColor = (color: string) => {
    setFormData({ ...formData, bgColor: color, bgImage: "" });
  };

  const selectBgImage = (url: string) => {
    setFormData({ ...formData, bgImage: url, bgColor: "" });
  };

  const clearBackground = () => {
    setFormData({ ...formData, bgImage: "", bgColor: "" });
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

  // 背景设置表单组件
  const BackgroundSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>个性化背景</Label>
        {(formData.bgColor || formData.bgImage) && (
          <Button variant="ghost" size="sm" onClick={clearBackground}>
            清除背景
          </Button>
        )}
      </div>
      
      {/* 预览 */}
      {(formData.bgColor || formData.bgImage) && (
        <div className="rounded-xl overflow-hidden">
          <Countdown
            targetDate={formData.date ? new Date(formData.date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
            title={formData.title || "预览效果"}
            emoji={formData.emoji}
            bgColor={formData.bgColor || undefined}
            bgImage={formData.bgImage || undefined}
          />
        </div>
      )}

      <Tabs value={bgTab} onValueChange={(v) => setBgTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gradient" className="gap-1">
            <Palette className="w-3 h-3" />
            渐变
          </TabsTrigger>
          <TabsTrigger value="color" className="gap-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            纯色
          </TabsTrigger>
          <TabsTrigger value="image" className="gap-1">
            <Image className="w-3 h-3" />
            图片
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="gradient" className="mt-3">
          <div className="grid grid-cols-4 gap-2">
            {presetGradients.map((gradient) => (
              <button
                key={gradient.name}
                type="button"
                className={`h-12 rounded-lg transition-all dark:ring-offset-slate-900 ${
                  formData.bgColor === gradient.value 
                    ? 'ring-2 ring-primary ring-offset-2' 
                    : 'hover:scale-105'
                }`}
                style={{ background: gradient.value }}
                onClick={() => selectBgColor(gradient.value)}
                title={gradient.name}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="color" className="mt-3">
          <div className="grid grid-cols-4 gap-2">
            {presetColors.map((color) => (
              <button
                key={color.name}
                type="button"
                className={`h-12 rounded-lg transition-all dark:ring-offset-slate-900 ${
                  formData.bgColor === color.value 
                    ? 'ring-2 ring-primary ring-offset-2' 
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => selectBgColor(color.value)}
                title={color.name}
              />
            ))}
          </div>
          <div className="mt-3">
            <Label className="text-xs text-muted-foreground">自定义颜色</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                className="w-12 h-10 p-1 cursor-pointer bg-white dark:bg-slate-800"
                value={formData.bgColor.startsWith("#") ? formData.bgColor : "#ff6b6b"}
                onChange={(e) => selectBgColor(e.target.value)}
              />
              <Input
                placeholder="#ff6b6b"
                value={formData.bgColor.startsWith("#") ? formData.bgColor : ""}
                onChange={(e) => selectBgColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="image" className="mt-3">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">图片URL</Label>
              <Input
                placeholder="输入图片链接..."
                value={formData.bgImage}
                onChange={(e) => selectBgImage(e.target.value)}
                className="mt-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              提示：可以使用网络图片链接，建议使用横向图片效果更佳
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // 表单内容组件
  const FormContent = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>纪念日名称</Label>
        <Input
          placeholder="例如：在一起纪念日"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>日期</Label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>选择图标</Label>
        <div className="flex flex-wrap gap-2">
          {emojiOptions.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all dark:ring-offset-slate-900 ${
                formData.emoji === emoji 
                  ? 'bg-primary/20 ring-2 ring-primary' 
                  : 'bg-secondary hover:bg-secondary/80 dark:bg-slate-700 dark:hover:bg-slate-600'
              }`}
              onClick={() => setFormData({ ...formData, emoji })}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label>农历日期</Label>
        <Switch
          checked={formData.isLunar}
          onCheckedChange={(checked) => setFormData({ ...formData, isLunar: checked })}
        />
      </div>
      
      <BackgroundSettings />
      
      <Button 
        className="w-full" 
        onClick={isEdit ? handleUpdate : handleCreate} 
        disabled={isEdit ? updateAnniversary.isPending : createAnniversary.isPending}
      >
        {isEdit 
          ? (updateAnniversary.isPending ? "保存中..." : "保存修改")
          : (createAnniversary.isPending ? "添加中..." : "添加纪念日")
        }
      </Button>
    </div>
  );

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
            <h1 className="font-semibold">纪念日</h1>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) setFormData(defaultForm);
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                添加
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>添加纪念日</DialogTitle>
              </DialogHeader>
              <FormContent />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* 编辑对话框 */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) {
          setEditingId(null);
          setFormData(defaultForm);
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑纪念日</DialogTitle>
          </DialogHeader>
          <FormContent isEdit />
        </DialogContent>
      </Dialog>

      <main className="container py-6">
        {anniversariesWithCountdown.length > 0 ? (
          <div className="space-y-4 max-w-lg mx-auto">
            {anniversariesWithCountdown.map((anniversary) => (
              <Card 
                key={anniversary.id} 
                className={`overflow-hidden ${!anniversary.bgImage && !anniversary.bgColor ? 'glass border-white/40 dark:border-white/10' : 'border-0'}`}
                style={
                  anniversary.bgImage 
                    ? { backgroundImage: `url(${anniversary.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : anniversary.bgColor 
                      ? { background: anniversary.bgColor }
                      : {}
                }
              >
                {/* 背景遮罩 */}
                {(anniversary.bgImage || anniversary.bgColor) && (
                  <div className="absolute inset-0 bg-black/30" />
                )}
                <CardContent className="p-0 relative">
                  <div className="flex items-center">
                    <div className={`w-20 h-20 flex items-center justify-center text-3xl ${
                      anniversary.bgImage || anniversary.bgColor 
                        ? 'bg-white/10' 
                        : 'bg-primary/5 dark:bg-primary/10'
                    }`}>
                      {anniversary.emoji}
                    </div>
                    <div className="flex-1 p-4">
                      <h3 className={`font-semibold mb-1 ${anniversary.bgImage || anniversary.bgColor ? 'text-white' : ''}`}>
                        {anniversary.title}
                      </h3>
                      <p className={`text-sm ${anniversary.bgImage || anniversary.bgColor ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {format(new Date(anniversary.date), "yyyy年MM月dd日", { locale: zhCN })}
                        {anniversary.isLunar && " (农历)"}
                      </p>
                    </div>
                    <div className="p-4 text-center">
                      <div className={`text-2xl font-bold ${anniversary.bgImage || anniversary.bgColor ? 'text-white' : 'text-primary'}`}>
                        {anniversary.daysLeft}
                      </div>
                      <div className={`text-xs ${anniversary.bgImage || anniversary.bgColor ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {anniversary.daysLeft === 0 ? "今天！" : "天后"}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 pr-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`${anniversary.bgImage || anniversary.bgColor ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-muted-foreground hover:text-primary'}`}
                        onClick={() => openEditDialog(anniversary)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`${anniversary.bgImage || anniversary.bgColor ? 'text-white/70 hover:text-red-300 hover:bg-white/20' : 'text-muted-foreground hover:text-destructive'}`}
                        onClick={() => deleteAnniversary.mutate({ id: anniversary.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass border-white/40 dark:border-white/10 max-w-md mx-auto">
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
