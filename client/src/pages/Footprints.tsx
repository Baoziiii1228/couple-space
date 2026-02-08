import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, MapPin, Trash2, Navigation, CalendarDays } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function Footprints() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterYear, setFilterYear] = useState<string>("all");
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
      () => {
        toast.error("获取位置失败，请手动输入");
      }
    );
  };

  // 统计数据
  const stats = useMemo(() => {
    if (!footprints || footprints.length === 0) return null;
    
    const cities = new Set<string>();
    const years = new Set<string>();
    const months = new Set<string>();
    
    footprints.forEach(f => {
      if (f.address) {
        // 简单提取城市名（取地址第一个词或前几个字）
        const city = f.address.split(/[,，\s]/)[0];
        if (city) cities.add(city);
      }
      const date = new Date(f.visitedAt);
      years.add(date.getFullYear().toString());
      months.add(`${date.getFullYear()}-${date.getMonth()}`);
    });

    // 计算最早和最晚足迹的时间跨度
    const dates = footprints.map(f => new Date(f.visitedAt).getTime());
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));
    const spanDays = Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));

    return {
      total: footprints.length,
      cities: cities.size,
      years: Array.from(years).sort().reverse(),
      spanDays: spanDays || 0,
      earliestDate: earliest,
      latestDate: latest,
    };
  }, [footprints]);

  // 按年份筛选
  const filteredFootprints = useMemo(() => {
    if (!footprints) return [];
    if (filterYear === "all") return footprints;
    return footprints.filter(f => {
      const year = new Date(f.visitedAt).getFullYear().toString();
      return year === filterYear;
    });
  }, [footprints, filterYear]);

  // 按年份分组
  const groupedFootprints = useMemo(() => {
    const groups: Record<string, typeof filteredFootprints> = {};
    filteredFootprints.forEach(f => {
      const year = new Date(f.visitedAt).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(f);
    });
    return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a));
  }, [filteredFootprints]);

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
                  {createFootprint.isPending ? "添加中..." : "添加足迹"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="glass border-white/40 dark:border-white/20">
              <CardContent className="p-4 text-center">
                <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                <p className="text-xs text-muted-foreground">共同足迹</p>
              </CardContent>
            </Card>
            <Card className="glass border-white/40 dark:border-white/20">
              <CardContent className="p-4 text-center">
                <Navigation className="w-5 h-5 text-teal-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-teal-500">{stats.cities}</p>
                <p className="text-xs text-muted-foreground">不同城市</p>
              </CardContent>
            </Card>
            <Card className="glass border-white/40 dark:border-white/20">
              <CardContent className="p-4 text-center">
                <CalendarDays className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-orange-500">{stats.spanDays}</p>
                <p className="text-xs text-muted-foreground">天跨度</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 年份筛选 */}
        {stats && stats.years.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                filterYear === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 hover:bg-secondary"
              }`}
              onClick={() => setFilterYear("all")}
            >
              全部
            </button>
            {stats.years.map(year => (
              <button
                key={year}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  filterYear === year
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 hover:bg-secondary"
                }`}
                onClick={() => setFilterYear(year)}
              >
                {year}年
              </button>
            ))}
          </div>
        )}

        {/* 足迹列表（按年份分组） */}
        {groupedFootprints.length > 0 ? (
          groupedFootprints.map(([year, yearFootprints]) => (
            <div key={year}>
              {filterYear === "all" && (
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span>{year}年</span>
                  <span className="text-sm font-normal text-muted-foreground">({yearFootprints.length}个足迹)</span>
                </h2>
              )}
              <div className="space-y-4">
                {yearFootprints.map((footprint, index) => (
                  <Card key={footprint.id} className="glass border-white/40 dark:border-white/20 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className="w-16 flex flex-col items-center py-4">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                          {index < yearFootprints.length - 1 && (
                            <div className="flex-1 w-0.5 bg-primary/20 mt-2" />
                          )}
                        </div>
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
            </div>
          ))
        ) : footprints && footprints.length > 0 ? (
          <Card className="glass border-white/40 dark:border-white/20">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">该年份暂无足迹</p>
              <Button variant="link" className="mt-2" onClick={() => setFilterYear("all")}>
                查看全部足迹
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass border-white/40 dark:border-white/20">
            <CardContent className="p-12 text-center">
              <MapPin className="w-16 h-16 text-muted-foreground/30 dark:text-muted-foreground/50 mx-auto mb-4" />
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
