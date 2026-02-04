import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, MapPin, Trash2, Navigation } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function Footprints() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFootprint, setNewFootprint] = useState({
    title: "",
    description: "",
    address: "",
    latitude: "",
    longitude: "",
    visitedAt: format(new Date(), "yyyy-MM-dd"),
  });

  const { data: footprints, refetch } = trpc.footprint.list.useQuery();

  const createFootprint = trpc.footprint.create.useMutation({
    onSuccess: () => {
      toast.success("足迹已添加！");
      setIsCreateOpen(false);
      setNewFootprint({
        title: "",
        description: "",
        address: "",
        latitude: "",
        longitude: "",
        visitedAt: format(new Date(), "yyyy-MM-dd"),
      });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteFootprint = trpc.footprint.delete.useMutation({
    onSuccess: () => {
      toast.success("已删除");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!newFootprint.title.trim() || !newFootprint.visitedAt) {
      toast.error("请填写地点名称和日期");
      return;
    }
    createFootprint.mutate({
      title: newFootprint.title,
      description: newFootprint.description || undefined,
      address: newFootprint.address || undefined,
      latitude: newFootprint.latitude || "0",
      longitude: newFootprint.longitude || "0",
      visitedAt: newFootprint.visitedAt,
    });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("您的浏览器不支持定位功能");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewFootprint({
          ...newFootprint,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        });
        toast.success("已获取当前位置");
      },
      (error) => {
        toast.error("获取位置失败，请手动输入");
      }
    );
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
            <h1 className="font-semibold">足迹地图</h1>
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
                <DialogTitle>添加足迹</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>地点名称</Label>
                  <Input
                    placeholder="例如：东京塔"
                    value={newFootprint.title}
                    onChange={(e) => setNewFootprint({ ...newFootprint, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>详细地址（可选）</Label>
                  <Input
                    placeholder="例如：日本东京都港区芝公园"
                    value={newFootprint.address}
                    onChange={(e) => setNewFootprint({ ...newFootprint, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>到访日期</Label>
                  <Input
                    type="date"
                    value={newFootprint.visitedAt}
                    onChange={(e) => setNewFootprint({ ...newFootprint, visitedAt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>位置坐标（可选）</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleGetLocation}>
                      <Navigation className="w-4 h-4 mr-1" />
                      获取当前位置
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="纬度"
                      value={newFootprint.latitude}
                      onChange={(e) => setNewFootprint({ ...newFootprint, latitude: e.target.value })}
                    />
                    <Input
                      placeholder="经度"
                      value={newFootprint.longitude}
                      onChange={(e) => setNewFootprint({ ...newFootprint, longitude: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>备注（可选）</Label>
                  <Textarea
                    placeholder="记录这次旅行的故事..."
                    value={newFootprint.description}
                    onChange={(e) => setNewFootprint({ ...newFootprint, description: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createFootprint.isPending}>
                  {createFootprint.isPending ? "添加中..." : "添加足迹 📍"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 统计 */}
        {footprints && footprints.length > 0 && (
          <Card className="glass border-white/40">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-primary mb-2">{footprints.length}</div>
              <p className="text-muted-foreground">个共同足迹</p>
            </CardContent>
          </Card>
        )}

        {/* 足迹列表 */}
        {footprints && footprints.length > 0 ? (
          <div className="space-y-4">
            {footprints.map((footprint, index) => (
              <Card key={footprint.id} className="glass border-white/40 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* 时间线 */}
                    <div className="w-16 flex flex-col items-center py-4">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {index < footprints.length - 1 && (
                        <div className="flex-1 w-0.5 bg-primary/20 mt-2" />
                      )}
                    </div>
                    
                    {/* 内容 */}
                    <div className="flex-1 py-4 pr-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            {footprint.title}
                          </h3>
                          {footprint.address && (
                            <p className="text-sm text-muted-foreground mt-1">{footprint.address}</p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(footprint.visitedAt), "yyyy年MM月dd日", { locale: zhCN })}
                          </p>
                          {footprint.description && (
                            <p className="text-sm mt-2">{footprint.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteFootprint.mutate({ id: footprint.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass border-white/40">
            <CardContent className="p-12 text-center">
              <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">还没有足迹</p>
              <p className="text-sm text-muted-foreground mb-4">记录你们一起去过的地方</p>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                添加第一个足迹
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
