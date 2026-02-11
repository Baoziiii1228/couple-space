import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 检查是否已经安装
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // 监听 beforeinstallprompt 事件
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // 监听应用安装成功事件
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success("安装成功！");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.error("当前浏览器不支持安装功能");
      return;
    }

    try {
      // 显示安装提示
      await deferredPrompt.prompt();

      // 等待用户响应
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        toast.success("正在安装...");
      } else {
        toast.info("已取消安装");
      }

      // 清除 deferredPrompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error("安装失败:", error);
      toast.error("安装失败，请稍后重试");
    }
  };

  // 如果已安装，则不显示按钮
  if (isInstalled) {
    return null;
  }

  // 如果没有 deferredPrompt，显示提示信息
  if (!deferredPrompt) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">已安装或不支持</span>
        <span className="sm:hidden">已安装</span>
      </Button>
    );
  }

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className="gap-2 bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 dark:hover:from-pink-900/30 dark:hover:to-purple-900/30 border-pink-200 dark:border-pink-800"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">安装到桌面</span>
      <span className="sm:hidden">安装</span>
    </Button>
  );
}
