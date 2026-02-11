import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sun, Moon, Image, Bell, Shield, User, Download, FileJson, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { ExportDataButtons } from "@/components/ExportDataButtons";
import { ThemeColorPicker } from "@/components/ThemeColorPicker";
import { MonthlyBackup } from "@/components/MonthlyBackup";

export default function Settings() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // 设置状态（从localStorage读取）
  const [showPhotosOnHome, setShowPhotosOnHome] = useState(() => {
    const stored = localStorage.getItem("showPhotosOnHome");
    return stored !== "false"; // 默认开启
  });

  const [enableNotifications, setEnableNotifications] = useState(() => {
    const stored = localStorage.getItem("enableNotifications");
    return stored !== "false";
  });

  // 保存设置到localStorage
  useEffect(() => {
    localStorage.setItem("showPhotosOnHome", String(showPhotosOnHome));
  }, [showPhotosOnHome]);

  useEffect(() => {
    localStorage.setItem("enableNotifications", String(enableNotifications));
  }, [enableNotifications]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-warm-rich dark:bg-slate-900">
        <div className="animate-pulse">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const isOwner = user?.role === "admin";

  return (
    <div className="min-h-screen gradient-warm-rich dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-rose-100 dark:bg-slate-900/80 dark:border-slate-700">
        <div className="container py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold dark:text-slate-200">设置</h1>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {/* 主题颜色 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <ThemeColorPicker />
        </motion.div>

        {/* 外观设置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-2xl border-0 glass-ios dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-slate-200">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                外观设置
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                自定义应用的显示风格
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="dark:text-slate-200">深色模式</Label>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">
                    切换深色/浅色主题
                  </p>
                </div>
                <Switch
                  checked={isDark}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 首页设置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="rounded-2xl border-0 glass-ios dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-slate-200">
                <Image className="w-5 h-5" />
                首页设置
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                自定义首页显示内容
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="dark:text-slate-200">显示相册照片</Label>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">
                    在首页息屏时展示相册中的照片
                  </p>
                </div>
                <Switch
                  checked={showPhotosOnHome}
                  onCheckedChange={setShowPhotosOnHome}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 通知设置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="rounded-2xl border-0 glass-ios dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-slate-200">
                <Bell className="w-5 h-5" />
                通知设置
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                管理提醒和通知
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="dark:text-slate-200">纪念日提醒</Label>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">
                    在重要日期前收到提醒
                  </p>
                </div>
                <Switch
                  checked={enableNotifications}
                  onCheckedChange={setEnableNotifications}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 数据导出 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="rounded-2xl border-0 glass-ios dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-slate-200">
                <Download className="w-5 h-5" />
                数据导出
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                导出你的所有数据作为备份
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ExportDataButtons />
            </CardContent>
          </Card>
        </motion.div>

        {/* 按月备份 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <MonthlyBackup />
        </motion.div>

        {/* 账户信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="rounded-2xl border-0 glass-ios dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-slate-200">
                <User className="w-5 h-5" />
                账户信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground dark:text-slate-400">用户名</span>
                <span className="text-sm font-medium dark:text-slate-200">{user?.name || "未设置"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground dark:text-slate-400">邮箱</span>
                <span className="text-sm font-medium dark:text-slate-200">{user?.email || "未设置"}</span>
              </div>
              {isOwner && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground dark:text-slate-400">角色</span>
                  <span className="text-sm font-medium text-emerald-500">开发者</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 开发者模式说明 */}
        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="rounded-2xl border-0 bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Shield className="w-5 h-5" />
                  开发者模式
                </CardTitle>
                <CardDescription className="text-emerald-600 dark:text-emerald-300/70">
                  作为项目所有者，你可以无需配对即可预览所有功能
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-emerald-600/80 dark:text-emerald-300/60">
                  开发者模式已自动启用。你可以直接访问所有页面进行测试和预览，无需邀请另一半完成配对。
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
