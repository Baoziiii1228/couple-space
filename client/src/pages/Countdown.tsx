import { useState, useMemo, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Calendar, Clock, Trash2, ArrowLeft, Heart } from "lucide-react";
import { useAuth } from "../_core/hooks/useAuth";
import { useTheme } from "../contexts/ThemeContext";
import { useLocation } from "wouter";

export default function Countdown() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [type, setType] = useState<"milestone" | "meetup" | "custom">("meetup");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("❤️");

  const { data: countdowns = [], refetch } = trpc.countdown.list.useQuery();
  const createMutation = trpc.countdown.create.useMutation();
  const deleteMutation = trpc.countdown.delete.useMutation();

  // React Query v5: 使用 useEffect 替代 onSuccess
  useEffect(() => {
    if (createMutation.isSuccess) {
      refetch();
      setIsOpen(false);
      resetForm();
      createMutation.reset();
    }
  }, [createMutation.isSuccess]);

  useEffect(() => {
    if (deleteMutation.isSuccess) {
      refetch();
      deleteMutation.reset();
    }
  }, [deleteMutation.isSuccess]);

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

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个倒计时吗？")) {
      deleteMutation.mutate({ id });
    }
  };

  // 计算剩余天数
  const calculateDaysLeft = (targetDate: string | Date) => {
    const target = new Date(targetDate);
    const now = new Date();
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // 按类型分组
  const groupedCountdowns = useMemo(() => {
    const groups: Record<string, typeof countdowns> = {
      milestone: [],
      meetup: [],
      custom: [],
    };
    countdowns.forEach((c) => {
      groups[c.type]?.push(c);
    });
    return groups;
  }, [countdowns]);

  const typeLabels = {
    milestone: "在一起里程碑",
    meetup: "见面倒计时",
    custom: "自定义事件",
  };

  const typeColors = {
    milestone: "from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600",
    meetup: "from-purple-500 to-indigo-500 dark:from-purple-600 dark:to-indigo-600",
    custom: "from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/dashboard")}
              className="hover:bg-white/50 dark:hover:bg-gray-800/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                倒计时
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                记录每一个值得期待的时刻
              </p>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
                <Plus className="mr-2 h-4 w-4" />
                添加倒计时
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-gray-800 dark:text-white">
              <DialogHeader>
                <DialogTitle className="dark:text-white">创建新倒计时</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium dark:text-gray-200">类型</label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                      <SelectItem value="milestone" className="dark:text-white dark:focus:bg-gray-600">在一起里程碑</SelectItem>
                      <SelectItem value="meetup" className="dark:text-white dark:focus:bg-gray-600">见面倒计时</SelectItem>
                      <SelectItem value="custom" className="dark:text-white dark:focus:bg-gray-600">自定义事件</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium dark:text-gray-200">标题</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例如：下次见面"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium dark:text-gray-200">目标日期</label>
                  <Input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium dark:text-gray-200">表情</label>
                  <Input
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    placeholder="❤️"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium dark:text-gray-200">描述（可选）</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="添加一些备注..."
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                <Button
                  onClick={handleCreate}
                  disabled={!title || !targetDate || createMutation.isPending}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                >
                  {createMutation.isPending ? "创建中..." : "创建"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Countdown List */}
        <div className="space-y-8">
          {Object.entries(groupedCountdowns).map(([type, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={type}>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                  {typeLabels[type as keyof typeof typeLabels]}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {items.map((countdown) => {
                    const daysLeft = calculateDaysLeft(countdown.targetDate);
                    const isPast = daysLeft < 0;
                    return (
                      <Card
                        key={countdown.id}
                        className={`p-6 bg-gradient-to-br ${typeColors[countdown.type as keyof typeof typeColors]} text-white shadow-lg hover:shadow-xl transition-shadow dark:shadow-gray-900/50`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-3xl">{countdown.emoji}</span>
                            <div>
                              <h3 className="font-semibold text-lg">{countdown.title}</h3>
                              <p className="text-sm opacity-90 flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(countdown.targetDate).toLocaleDateString("zh-CN")}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(countdown.id)}
                            className="hover:bg-white/20 text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="text-center py-4">
                          {isPast ? (
                            <div>
                              <p className="text-4xl font-bold">已过去</p>
                              <p className="text-xl mt-2">{Math.abs(daysLeft)} 天</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-5xl font-bold">{daysLeft}</p>
                              <p className="text-xl mt-2">天</p>
                            </div>
                          )}
                        </div>

                        {countdown.description && (
                          <p className="text-sm opacity-90 mt-4 border-t border-white/20 pt-4">
                            {countdown.description}
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {countdowns.length === 0 && (
            <div className="text-center py-16">
              <Clock className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">还没有倒计时</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                点击右上角按钮创建第一个倒计时吧
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
