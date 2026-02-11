import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Heart, Camera, BookOpen, MessageCircle, Star } from "lucide-react";
import { toast } from "sonner";

interface AnnualReportProps {
  year?: number;
}

export function AnnualReport({ year = new Date().getFullYear() }: AnnualReportProps) {
  const { data: diaries } = trpc.diary.list.useQuery();
  // 暂时不统计照片，因为 API 需要调整
  const photos: any[] = [];
  const { data: messages } = trpc.message.list.useQuery();
  const { data: tasks } = trpc.task.list.useQuery();
  const { data: moods } = trpc.mood.list.useQuery();
  const { data: anniversaries } = trpc.anniversary.list.useQuery();

  const reportData = useMemo(() => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // 过滤该年度的数据
    const yearDiaries = diaries?.filter(d => {
      const date = new Date(d.createdAt);
      return date >= startDate && date <= endDate;
    }) || [];

    const yearPhotos = photos?.filter((p: any) => {
      const date = new Date(p.uploadedAt);
      return date >= startDate && date <= endDate;
    }) || [];

    const yearMessages = messages?.filter(m => {
      const date = new Date(m.createdAt);
      return date >= startDate && date <= endDate;
    }) || [];

    const yearTasks = tasks?.filter(t => {
      const date = new Date(t.createdAt);
      return date >= startDate && date <= endDate;
    }) || [];

    const completedTasks = yearTasks.filter(t => t.isCompleted);

    const yearMoods = moods?.filter(m => {
      const date = new Date(m.createdAt);
      return date >= startDate && date <= endDate;
    }) || [];

    // 统计最常见的心情
    const moodCounts: Record<string, number> = {};
    yearMoods.forEach(m => {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    });
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

    // 统计最活跃的月份
    const monthlyActivity: Record<number, number> = {};
    [...yearDiaries, ...yearMessages, ...yearPhotos].forEach(item => {
      const month = new Date(item.createdAt || item.uploadedAt).getMonth();
      monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
    });
    const mostActiveMonth = Object.entries(monthlyActivity).sort((a, b) => b[1] - a[1])[0];

    return {
      totalDiaries: yearDiaries.length,
      totalPhotos: yearPhotos.length,
      totalMessages: yearMessages.length,
      totalTasks: yearTasks.length,
      completedTasks: completedTasks.length,
      totalMoods: yearMoods.length,
      topMood: topMood ? { mood: topMood[0], count: topMood[1] } : null,
      mostActiveMonth: mostActiveMonth ? parseInt(mostActiveMonth[0]) + 1 : null,
      anniversariesCount: anniversaries?.length || 0,
    };
  }, [year, diaries, photos, messages, tasks, moods, anniversaries]);

  const downloadReport = () => {
    const report = `
# ${year} 年度报告

## 📊 数据统计

- 📖 写了 **${reportData.totalDiaries}** 篇日记
- 📸 上传了 **${reportData.totalPhotos}** 张照片
- 💬 发送了 **${reportData.totalMessages}** 条消息
- ✅ 完成了 **${reportData.completedTasks}/${reportData.totalTasks}** 个任务
- 😊 记录了 **${reportData.totalMoods}** 次心情
- 🎉 庆祝了 **${reportData.anniversariesCount}** 个纪念日

## 🌟 精彩瞬间

${reportData.topMood ? `- 最常见的心情：${reportData.topMood.mood} (${reportData.topMood.count} 次)` : ''}
${reportData.mostActiveMonth ? `- 最活跃的月份：${reportData.mostActiveMonth} 月` : ''}

## 💝 总结

这一年，我们一起经历了许多美好的时光。
感谢有你陪伴，期待下一年更多的精彩！

---
生成时间：${new Date().toLocaleString('zh-CN')}
    `.trim();

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${year}年度报告.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("报告已下载");
  };

  return (
    <Card className="glass border-white/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">📊 {year} 年度报告</CardTitle>
          <Button size="sm" variant="outline" onClick={downloadReport}>
            <Download className="w-4 h-4 mr-1" />
            下载报告
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 数据统计 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5">
            <BookOpen className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-500">{reportData.totalDiaries}</p>
            <p className="text-sm text-muted-foreground">篇日记</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-pink-500/10 to-pink-500/5">
            <Camera className="w-8 h-8 text-pink-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-pink-500">{reportData.totalPhotos}</p>
            <p className="text-sm text-muted-foreground">张照片</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5">
            <MessageCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-500">{reportData.totalMessages}</p>
            <p className="text-sm text-muted-foreground">条消息</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-500">
              {reportData.completedTasks}/{reportData.totalTasks}
            </p>
            <p className="text-sm text-muted-foreground">完成任务</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <Heart className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-500">{reportData.totalMoods}</p>
            <p className="text-sm text-muted-foreground">次心情</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <Heart className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-500">{reportData.anniversariesCount}</p>
            <p className="text-sm text-muted-foreground">个纪念日</p>
          </div>
        </div>

        {/* 精彩瞬间 */}
        <div className="space-y-3">
          <h3 className="font-semibold">🌟 精彩瞬间</h3>
          {reportData.topMood && (
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-sm">
                最常见的心情：<span className="font-semibold">{reportData.topMood.mood}</span> ({reportData.topMood.count} 次)
              </p>
            </div>
          )}
          {reportData.mostActiveMonth && (
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-sm">
                最活跃的月份：<span className="font-semibold">{reportData.mostActiveMonth} 月</span>
              </p>
            </div>
          )}
        </div>

        {/* 总结 */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
          <p className="text-sm text-center text-muted-foreground">
            这一年，我们一起经历了许多美好的时光。<br />
            感谢有你陪伴，期待下一年更多的精彩！💕
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
