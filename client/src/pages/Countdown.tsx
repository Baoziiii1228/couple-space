import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Calendar, Clock, Trash2 } from "lucide-react";
import { useAuth } from "../_core/hooks/useAuth";

export default function Countdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [type, setType] = useState<"milestone" | "meetup" | "custom">("meetup");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("❤️");

  const { data: countdowns = [], refetch } = trpc.countdown.list.useQuery();
  const createMutation = trpc.countdown.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsOpen(false);
      resetForm();
    },
  });
  const deleteMutation = trpc.countdown.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const resetForm = () => {
    setTitle("");
    setTargetDate("");
    setType("meetup");
    setDescription("");
    setEmoji("❤️");
  };

  const handleCreate = () => {
    if (!title || !targetDate) return;
    createMutation.mutate({
      title,
      targetDate,
      type,
      description,
      emoji,
    });
  };

  const calculateDaysLeft = (targetDate: Date) => {
    const now = new Date();
    const target = new Date(targetDate);
    const diff = target.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const calculateTogetherDays = () => {
    // 假设从 couples 表的 togetherDate 计算
    // 这里需要从 context 或 API 获取
    return 0; // 暂时返回 0
  };

  const getMilestones = () => {
    const togetherDays = calculateTogetherDays();
    const milestones = [30, 60, 100, 180, 200, 365, 520, 999];
    return milestones
      .filter(m => m > togetherDays)
      .map(m => ({
        days: m,
        title: getMilestoneTitle(m),
        daysLeft: m - togetherDays,
      }));
  };

  const getMilestoneTitle = (days: number) => {
    const map: Record<number, string> = {
      30: "在一起一个月",
      60: "在一起两个月",
      100: "在一起100天",
      180: "在一起半年",
      200: "在一起200天",
      365: "在一起一年",
      520: "在一起520天",
      999: "在一起999天",
    };
    return map[days] || `在一起${days}天`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            倒计时
          </h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-500">
                <Plus className="w-4 h-4 mr-2" />
                添加倒计时
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建倒计时</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">标题</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例如：下次见面"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">日期</label>
                  <Input
                    type="datetime-local"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">类型</label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meetup">见面</SelectItem>
                      <SelectItem value="milestone">里程碑</SelectItem>
                      <SelectItem value="custom">自定义</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">表情</label>
                  <Input
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    placeholder="❤️"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">描述</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="添加一些描述..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
                  disabled={!title || !targetDate || createMutation.isPending}
                >
                  {createMutation.isPending ? "创建中..." : "创建"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 倒计时列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {countdowns.map((countdown) => {
            const daysLeft = calculateDaysLeft(countdown.targetDate);
            const isPast = daysLeft < 0;
            return (
              <Card key={countdown.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{countdown.emoji || "⏳"}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{countdown.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(countdown.targetDate).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate({ id: countdown.id })}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
                <div className="text-center py-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg">
                  {isPast ? (
                    <div className="text-2xl font-bold text-gray-500">已过期</div>
                  ) : (
                    <>
                      <div className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        {daysLeft}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">天</div>
                    </>
                  )}
                </div>
                {countdown.description && (
                  <p className="text-sm text-gray-600 mt-4">{countdown.description}</p>
                )}
              </Card>
            );
          })}
        </div>

        {countdowns.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>还没有倒计时，快来创建一个吧！</p>
          </div>
        )}
      </div>
    </div>
  );
}
