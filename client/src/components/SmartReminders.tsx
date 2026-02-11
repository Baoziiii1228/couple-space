import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

// 请求通知权限
const requestNotificationPermission = async () => {
  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }
};

// 发送浏览器通知
const sendNotification = (title: string, body: string, icon?: string) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: icon || "/icon-192x192.png",
      badge: "/icon-192x192.png",
    });
  }
};

export function SmartReminders() {
  const [hasPermission, setHasPermission] = useState(false);
  const { data: anniversaries } = trpc.anniversary.list.useQuery();
  const { data: tasks } = trpc.task.list.useQuery();
  const { data: countdowns } = trpc.countdown.list.useQuery();
  const { data: timeCapsules } = trpc.timeCapsule.list.useQuery();

  useEffect(() => {
    if ("Notification" in window) {
      setHasPermission(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    if (!hasPermission) return;

    // 检查纪念日提醒
    if (anniversaries) {
      anniversaries.forEach((anniversary) => {
        const date = new Date(anniversary.date);
        const today = new Date();
        const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // 提前7天、3天、1天提醒
        if (daysUntil === 7 || daysUntil === 3 || daysUntil === 1) {
          const message = `还有 ${daysUntil} 天就是 ${anniversary.title} 啦！`;
          toast.info(message, {
            icon: anniversary.emoji,
            duration: 5000,
          });
          sendNotification("纪念日提醒", message, anniversary.emoji || undefined);
        } else if (daysUntil === 0) {
          const message = `今天是 ${anniversary.title}！`;
          toast.success(message, {
            icon: anniversary.emoji,
            duration: 10000,
          });
          sendNotification("纪念日提醒", message, anniversary.emoji || undefined);
        }
      });
    }

    // 检查任务截止日期提醒
    if (tasks) {
      tasks.forEach((task) => {
        if (task.deadline && !task.isCompleted) {
          const deadline = new Date(task.deadline);
          const today = new Date();
          const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntil === 1) {
            const message = `任务"${task.title}"明天就要截止了！`;
            toast.warning(message, {
              icon: "⏰",
              duration: 5000,
            });
            sendNotification("任务提醒", message);
          } else if (daysUntil === 0) {
            const message = `任务"${task.title}"今天截止！`;
            toast.error(message, {
              icon: "🔥",
              duration: 10000,
            });
            sendNotification("任务提醒", message);
          }
        }
      });
    }

    // 检查倒计时到期提醒
    if (countdowns) {
      countdowns.forEach((countdown) => {
        const targetDate = new Date(countdown.targetDate);
        const today = new Date();
        const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil === 0) {
          const message = `倒计时"${countdown.title}"到期了！`;
          toast.success(message, {
            icon: "🎉",
            duration: 10000,
          });
          sendNotification("倒计时提醒", message);
        }
      });
    }

    // 检查时光胶囊开启提醒
    if (timeCapsules) {
      timeCapsules.forEach((capsule) => {
        if (!capsule.isOpened && capsule.openDate) {
          const openDate = new Date(capsule.openDate);
          const today = new Date();
          const daysUntil = Math.ceil((openDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntil === 0) {
            const message = `时光胶囊"${capsule.title}"可以开启了！`;
            toast.success(message, {
              icon: "🎁",
              duration: 10000,
            });
            sendNotification("时光胶囊提醒", message);
          }
        }
      });
    }
  }, [hasPermission, anniversaries, tasks, countdowns, timeCapsules]);

  if (!("Notification" in window)) {
    return null;
  }

  if (!hasPermission) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">开启智能提醒</h3>
              <p className="text-xs text-muted-foreground mb-3">
                允许通知后，我们会在纪念日、任务截止等重要时刻提醒你
              </p>
              <Button
                size="sm"
                onClick={async () => {
                  await requestNotificationPermission();
                  setHasPermission(Notification.permission === "granted");
                }}
              >
                开启通知
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
