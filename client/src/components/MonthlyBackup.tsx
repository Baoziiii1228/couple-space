import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Download, Loader2, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { backupMonthlyData } from "@/lib/monthlyBackup";
import { toast } from "sonner";

export function MonthlyBackup() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
  const [isBackingUp, setIsBackingUp] = useState(false);

  // 生成年份选项（最近5年）
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 获取所有数据的查询
  const { data: diaries } = trpc.diary.list.useQuery();
  const { data: photos } = trpc.photo.list.useQuery({ albumId: undefined });
  const { data: messages } = trpc.message.list.useQuery({ limit: 10000, offset: 0 });
  const { data: tasks } = trpc.task.list.useQuery();
  const { data: wishes } = trpc.wish.list.useQuery();
  const { data: footprints } = trpc.footprint.list.useQuery();
  const { data: moods } = trpc.mood.list.useQuery();
  // 时光胶囊暂不支持列表查询
  const capsules: any[] = [];
  const { data: promises } = trpc.promise.list.useQuery();
  const { data: achievements } = trpc.achievement.list.useQuery();
  const { data: ledgers } = trpc.ledger.list.useQuery();
  const { data: countdowns } = trpc.countdown.list.useQuery();
  const { data: hundredThings } = trpc.hundredThings.list.useQuery();
  // 待办清单 - 获取所有类型
  const { data: todoMovies } = trpc.todoList.list.useQuery({ type: "movie" });
  const { data: todoBooks } = trpc.todoList.list.useQuery({ type: "book" });
  const { data: todoMusic } = trpc.todoList.list.useQuery({ type: "music" });
  const { data: todoRestaurants } = trpc.todoList.list.useQuery({ type: "restaurant" });
  const { data: todoTravels } = trpc.todoList.list.useQuery({ type: "travel" });
  const { data: todoActivities } = trpc.todoList.list.useQuery({ type: "activity" });
  const { data: todoTv } = trpc.todoList.list.useQuery({ type: "tv" });
  const { data: todoOthers } = trpc.todoList.list.useQuery({ type: "other" });
  
  const todoLists = [
    ...(todoMovies || []),
    ...(todoBooks || []),
    ...(todoMusic || []),
    ...(todoRestaurants || []),
    ...(todoTravels || []),
    ...(todoActivities || []),
    ...(todoTv || []),
    ...(todoOthers || []),
  ];

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);

      // 筛选指定月份的数据
      const filterByMonth = (items: any[] | undefined) => {
        if (!items) return [];
        return items.filter((item) => {
          const date = new Date(item.createdAt || item.visitedAt || item.date);
          return date.getFullYear() === year && date.getMonth() + 1 === month;
        });
      };

      const backupData = {
        diaries: filterByMonth(diaries),
        photos: filterByMonth(photos),
        messages: filterByMonth(messages),
        tasks: filterByMonth(tasks),
        wishes: filterByMonth(wishes),
        footprints: filterByMonth(footprints),
        moods: filterByMonth(moods),
        capsules: [], // 时光胶囊暂不支持
        promises: filterByMonth(promises),
        achievements: filterByMonth(achievements),
        ledgers: filterByMonth(ledgers),
        countdowns: filterByMonth(countdowns),
        hundredThings: filterByMonth(hundredThings),
        todoLists: filterByMonth(todoLists),
      };

      // 检查是否有数据
      const totalItems = Object.values(backupData).reduce(
        (sum, items) => sum + items.length,
        0
      );

      if (totalItems === 0) {
        toast.error(`${year}年${month}月没有数据可以备份`);
        return;
      }

      await backupMonthlyData(year, month, backupData);
      toast.success(`成功备份 ${year}年${month}月 的数据！共 ${totalItems} 条记录`);
    } catch (error) {
      console.error("备份失败:", error);
      toast.error("备份失败，请重试");
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          按月备份数据
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          选择要备份的月份，系统会将该月的所有数据打包成ZIP文件，按分类整理好，方便你上传到百度网盘保存。
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">年份</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">月份</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {month}月
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleBackup}
          disabled={isBackingUp}
        >
          {isBackingUp ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              备份中...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              下载备份
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 备份说明：</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>ZIP文件内按数据类型分类（日记、照片、留言等）</li>
            <li>每个分类包含JSON和Markdown两种格式</li>
            <li>文件名格式：couple-space-backup-2026-02.zip</li>
            <li>下载后可手动上传到百度网盘保存</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
