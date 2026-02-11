import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function DataCharts() {
  const { data: stats } = trpc.stats.dashboard.useQuery();
  const { data: moods } = trpc.mood.list.useQuery();
  const { data: ledger } = trpc.ledger.list.useQuery();
  const { data: diaries } = trpc.diary.list.useQuery();

  // 任务完成趋势（最近7天）
  const taskTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    });

    return {
      labels: last7Days,
      datasets: [
        {
          label: '任务完成数',
          data: [2, 3, 1, 4, 2, 5, 3], // 模拟数据，实际应从后端获取
          borderColor: 'rgb(236, 72, 153)',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, []);

  // 心情统计
  const moodData = useMemo(() => {
    if (!moods) return null;
    
    const moodCounts: Record<string, number> = {};
    moods.forEach((mood) => {
      moodCounts[mood.mood] = (moodCounts[mood.mood] || 0) + 1;
    });

    const moodEmojis: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      excited: '🤩',
      calm: '😌',
      angry: '😠',
      love: '😍',
    };

    return {
      labels: Object.keys(moodCounts).map(m => moodEmojis[m] || m),
      datasets: [
        {
          label: '心情次数',
          data: Object.values(moodCounts),
          backgroundColor: [
            'rgba(255, 206, 86, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
          ],
        },
      ],
    };
  }, [moods]);

  // 账本收支统计（最近6个月）
  const ledgerData = useMemo(() => {
    if (!ledger) return null;

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' });
    });

    // 按月份统计收支
    const monthlyIncome: number[] = new Array(6).fill(0);
    const monthlyExpense: number[] = new Array(6).fill(0);

    ledger.forEach((item) => {
      const itemDate = new Date(item.date);
      const monthKey = itemDate.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' });
      const monthIndex = last6Months.indexOf(monthKey);
      
      if (monthIndex !== -1) {
        if (item.type === 'income') {
          monthlyIncome[monthIndex] += Number(item.amount);
        } else {
          monthlyExpense[monthIndex] += Number(item.amount);
        }
      }
    });

    return {
      labels: last6Months,
      datasets: [
        {
          label: '收入',
          data: monthlyIncome,
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
        },
        {
          label: '支出',
          data: monthlyExpense,
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
        },
      ],
    };
  }, [ledger]);

  // 日记发布频率（最近12个月）
  const diaryFrequencyData = useMemo(() => {
    if (!diaries) return null;

    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      return {
        key: date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' }),
        label: date.toLocaleDateString('zh-CN', { month: '2-digit' }),
      };
    });

    const monthlyCounts = new Array(12).fill(0);

    diaries.forEach((diary) => {
      const diaryDate = new Date(diary.createdAt);
      const monthKey = diaryDate.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' });
      const monthIndex = last12Months.findIndex(m => m.key === monthKey);
      
      if (monthIndex !== -1) {
        monthlyCounts[monthIndex]++;
      }
    });

    return {
      labels: last12Months.map(m => m.label),
      datasets: [
        {
          label: '日记篇数',
          data: monthlyCounts,
          backgroundColor: 'rgba(153, 102, 255, 0.8)',
        },
      ],
    };
  }, [diaries]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* 任务完成趋势 */}
      <Card className="glass border-white/40 dark:border-white/20">
        <CardHeader>
          <CardTitle className="text-lg">📈 任务完成趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Line data={taskTrendData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 心情统计 */}
        {moodData && (
          <Card className="glass border-white/40 dark:border-white/20">
            <CardHeader>
              <CardTitle className="text-lg">😊 心情统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Pie data={moodData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 账本收支 */}
        {ledgerData && (
          <Card className="glass border-white/40 dark:border-white/20">
            <CardHeader>
              <CardTitle className="text-lg">💰 收支统计（最近6个月）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Bar data={ledgerData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 日记发布频率 */}
      {diaryFrequencyData && (
        <Card className="glass border-white/40 dark:border-white/20">
          <CardHeader>
            <CardTitle className="text-lg">📖 日记发布频率（最近12个月）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar data={diaryFrequencyData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
