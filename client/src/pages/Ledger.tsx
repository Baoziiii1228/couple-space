import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Wallet, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const expenseCategories = [
  { value: "dining", label: "🍽️ 餐饮", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: "transport", label: "🚗 交通", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "shopping", label: "🛍️ 购物", color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" },
  { value: "entertainment", label: "🎬 娱乐", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "travel", label: "✈️ 旅行", color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400" },
  { value: "gift", label: "🎁 礼物", color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  { value: "living", label: "🏠 生活", color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
  { value: "medical", label: "💊 医疗", color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" },
  { value: "education", label: "📚 学习", color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" },
  { value: "other", label: "📦 其他", color: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400" },
];

const incomeCategories = [
  { value: "salary", label: "💰 工资", color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
  { value: "bonus", label: "🎉 奖金", color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { value: "redpacket", label: "🧧 红包", color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  { value: "other", label: "📦 其他", color: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400" },
];

const paidByOptions = [
  { value: "user1", label: "我付的" },
  { value: "user2", label: "TA付的" },
  { value: "split", label: "AA制" },
  { value: "together", label: "共同" },
];

export default function Ledger() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [newRecord, setNewRecord] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    category: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    paidBy: "together" as "user1" | "user2" | "split" | "together",
  });

  const { data: records, refetch } = trpc.ledger.list.useQuery({
    startDate: `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-01`,
    endDate: `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-31`,
  });

  const { data: stats, refetch: refetchStats } = trpc.ledger.stats.useQuery({
    year: selectedMonth.year,
    month: selectedMonth.month,
  });

  const createRecord = trpc.ledger.create.useMutation({
    onSuccess: () => {
      toast.success("记账成功！");
      setIsCreateOpen(false);
      setNewRecord({
        type: "expense",
        amount: "",
        category: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        paidBy: "together",
      });
      refetch();
      refetchStats();
    },
    onError: (err) => toast.error(err.message),
  });

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deleteRecord = trpc.ledger.delete.useMutation({
    onSuccess: () => {
      toast.success("已删除");
      setDeleteId(null);
      refetch();
      refetchStats();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!newRecord.amount || !newRecord.category) {
      toast.error("请填写金额和分类");
      return;
    }
    if (isNaN(parseFloat(newRecord.amount)) || parseFloat(newRecord.amount) <= 0) {
      toast.error("请输入有效金额");
      return;
    }
    createRecord.mutate({
      type: newRecord.type,
      amount: parseFloat(newRecord.amount).toFixed(2),
      category: newRecord.category,
      description: newRecord.description || undefined,
      date: newRecord.date,
      paidBy: newRecord.paidBy,
    });
  };

  const changeMonth = (delta: number) => {
    setSelectedMonth(prev => {
      let m = prev.month + delta;
      let y = prev.year;
      if (m > 12) { m = 1; y++; }
      if (m < 1) { m = 12; y--; }
      return { year: y, month: m };
    });
  };

  // 按日期分组
  const groupedRecords = useMemo(() => {
    if (!records) return [];
    const groups: Record<string, typeof records> = {};
    records.forEach(r => {
      const dateKey = format(new Date(r.date), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(r);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        dateLabel: format(new Date(date), "MM月dd日 EEEE", { locale: zhCN }),
        items,
        dayTotal: items.reduce((sum, i) => {
          const amount = parseFloat(i.amount);
          return i.type === "expense" ? sum - amount : sum + amount;
        }, 0),
      }));
  }, [records]);

  // 按分类统计
  const categoryStats = useMemo(() => {
    if (!records) return [];
    const catMap: Record<string, number> = {};
    records.filter(r => r.type === "expense").forEach(r => {
      catMap[r.category] = (catMap[r.category] || 0) + parseFloat(r.amount);
    });
    return Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => {
        const catInfo = expenseCategories.find(c => c.value === category);
        return { category, label: catInfo?.label || category, color: catInfo?.color || "", amount };
      });
  }, [records]);

  const currentCategories = newRecord.type === "expense" ? expenseCategories : incomeCategories;

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
            <h1 className="font-semibold">恋爱账本</h1>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                记一笔
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>记一笔</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* 收支切换 */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={newRecord.type === "expense" ? "default" : "outline"}
                    onClick={() => setNewRecord({ ...newRecord, type: "expense", category: "" })}
                    className="gap-1"
                  >
                    <TrendingDown className="w-4 h-4" />
                    支出
                  </Button>
                  <Button
                    variant={newRecord.type === "income" ? "default" : "outline"}
                    onClick={() => setNewRecord({ ...newRecord, type: "income", category: "" })}
                    className="gap-1"
                  >
                    <TrendingUp className="w-4 h-4" />
                    收入
                  </Button>
                </div>

                {/* 金额 */}
                <div className="space-y-2">
                  <Label>金额</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">¥</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newRecord.amount}
                      onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                      className="pl-8 text-lg font-semibold"
                    />
                  </div>
                </div>

                {/* 分类 */}
                <div className="space-y-2">
                  <Label>分类</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {currentCategories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        className={`p-2 rounded-lg text-center text-xs transition-all ${
                          newRecord.category === cat.value
                            ? "ring-2 ring-primary scale-105"
                            : "hover:scale-105"
                        } ${cat.color}`}
                        onClick={() => setNewRecord({ ...newRecord, category: cat.value })}
                      >
                        {cat.label.split(' ')[0]}
                        <div className="text-[10px] mt-0.5">{cat.label.split(' ')[1]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 谁付的 */}
                {newRecord.type === "expense" && (
                  <div className="space-y-2">
                    <Label>谁付的</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {paidByOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={newRecord.paidBy === opt.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewRecord({ ...newRecord, paidBy: opt.value as any })}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 日期 */}
                <div className="space-y-2">
                  <Label>日期</Label>
                  <Input
                    type="date"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                  />
                </div>

                {/* 备注 */}
                <div className="space-y-2">
                  <Label>备注（可选）</Label>
                  <Textarea
                    placeholder="记录一下..."
                    value={newRecord.description}
                    onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <Button className="w-full" onClick={handleCreate} disabled={createRecord.isPending}>
                  {createRecord.isPending ? "记录中..." : "记一笔"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* 月份选择 */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-lg font-semibold">
            {selectedMonth.year}年{selectedMonth.month}月
          </span>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="glass border-white/40 dark:border-white/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">支出</p>
              <p className="text-lg font-bold text-red-500">
                ¥{(stats?.totalExpense ?? 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-white/40 dark:border-white/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">收入</p>
              <p className="text-lg font-bold text-green-500">
                ¥{(stats?.totalIncome ?? 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-white/40 dark:border-white/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">结余</p>
              <p className={`text-lg font-bold ${(stats?.balance ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ¥{(stats?.balance ?? 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 分类统计 */}
        {categoryStats.length > 0 && (
          <Card className="glass border-white/40 dark:border-white/20">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">支出分类</h3>
              <div className="space-y-2">
                {categoryStats.map((cat) => {
                  const percentage = stats?.totalExpense ? (cat.amount / stats.totalExpense * 100) : 0;
                  return (
                    <div key={cat.category} className="flex items-center gap-3">
                      <span className="text-sm w-20 flex-shrink-0">{cat.label}</span>
                      <div className="flex-1 h-6 bg-secondary/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-20 text-right">¥{cat.amount.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 账单列表 */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="expense">支出</TabsTrigger>
            <TabsTrigger value="income">收入</TabsTrigger>
          </TabsList>

          {["expense", "income"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {groupedRecords
                .map(group => ({
                  ...group,
                  items: group.items.filter(i => i.type === tab),
                }))
                .filter(group => group.items.length > 0)
                .map((group) => (
                  <div key={group.date}>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-sm font-medium text-muted-foreground">{group.dateLabel}</span>
                    </div>
                    <Card className="glass border-white/40 dark:border-white/20">
                      <CardContent className="p-0 divide-y divide-border/30">
                        {group.items.map((record) => {
                          const allCats = [...expenseCategories, ...incomeCategories];
                          const catInfo = allCats.find(c => c.value === record.category);
                          return (
                            <div key={record.id} className="flex items-center justify-between p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${catInfo?.color || 'bg-gray-100'}`}>
                                  {catInfo?.label.split(' ')[0] || '📦'}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{catInfo?.label.split(' ')[1] || record.category}</p>
                                  {record.description && (
                                    <p className="text-xs text-muted-foreground">{record.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${record.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                                  {record.type === 'expense' ? '-' : '+'}¥{parseFloat(record.amount).toFixed(2)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-7 h-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => setDeleteId(record.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>
                ))}

              {groupedRecords.every(g => g.items.filter(i => i.type === tab).length === 0) && (
                <Card className="glass border-white/40 dark:border-white/20">
                  <CardContent className="p-12 text-center">
                    <Wallet className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      本月暂无{tab === "expense" ? "支出" : "收入"}记录
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      记一笔
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <ConfirmDeleteDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteRecord.mutate({ id: deleteId })}
        title="删除记录"
        description="确定要删除这条账目记录吗？删除后无法恢复。"
        isPending={deleteRecord.isPending}
      />
    </div>
  );
}
