import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sun, Moon, Image, Bell, Shield, User } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";

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
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'gradient-warm-rich'}`}>
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
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'gradient-warm-rich'}`}>
      {/* 顶部导航 */}
      <header className={`sticky top-0 z-10 backdrop-blur-md ${isDark ? 'bg-slate-900/80' : 'bg-white/80'} border-b ${isDark ? 'border-slate-700' : 'border-rose-100'}`}>
        <div className="container py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={`text-xl font-semibold ${isDark ? 'text-slate-200' : ''}`}>设置</h1>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {/* 外观设置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`rounded-2xl border-0 ${isDark ? 'bg-slate-800/50' : 'glass-ios'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-slate-200' : ''}`}>
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                外观设置
              </CardTitle>
              <CardDescription className={isDark ? 'text-slate-400' : ''}>
                自定义应用的显示风格
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className={isDark ? 'text-slate-200' : ''}>深色模式</Label>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
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
          <Card className={`rounded-2xl border-0 ${isDark ? 'bg-slate-800/50' : 'glass-ios'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-slate-200' : ''}`}>
                <Image className="w-5 h-5" />
                首页设置
              </CardTitle>
              <CardDescription className={isDark ? 'text-slate-400' : ''}>
                自定义首页显示内容
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className={isDark ? 'text-slate-200' : ''}>显示相册照片</Label>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
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
          <Card className={`rounded-2xl border-0 ${isDark ? 'bg-slate-800/50' : 'glass-ios'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-slate-200' : ''}`}>
                <Bell className="w-5 h-5" />
                通知设置
              </CardTitle>
              <CardDescription className={isDark ? 'text-slate-400' : ''}>
                管理提醒和通知
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className={isDark ? 'text-slate-200' : ''}>纪念日提醒</Label>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
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

        {/* 账户信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className={`rounded-2xl border-0 ${isDark ? 'bg-slate-800/50' : 'glass-ios'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-slate-200' : ''}`}>
                <User className="w-5 h-5" />
                账户信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>用户名</span>
                <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : ''}`}>{user?.name || "未设置"}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>邮箱</span>
                <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : ''}`}>{user?.email || "未设置"}</span>
              </div>
              {isOwner && (
                <div className="flex justify-between">
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>角色</span>
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
            <Card className={`rounded-2xl border-0 ${isDark ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-emerald-50 border border-emerald-200'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  <Shield className="w-5 h-5" />
                  开发者模式
                </CardTitle>
                <CardDescription className={isDark ? 'text-emerald-300/70' : 'text-emerald-600'}>
                  作为项目所有者，你可以无需配对即可预览所有功能
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className={`text-sm ${isDark ? 'text-emerald-300/60' : 'text-emerald-600/80'}`}>
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
