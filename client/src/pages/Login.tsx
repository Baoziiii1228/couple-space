import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // 验证码登录状态
  const [codeEmail, setCodeEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 密码登录状态
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // 注册状态
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regCode, setRegCode] = useState("");
  const [regCodeSent, setRegCodeSent] = useState(false);
  const [regCountdown, setRegCountdown] = useState(0);

  const utils = trpc.useUtils();

  // 已登录则跳转
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (regCountdown > 0) {
      const timer = setTimeout(() => setRegCountdown(regCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [regCountdown]);

  const sendCodeMutation = trpc.auth.sendCode.useMutation({
    onSuccess: () => {
      toast.success("验证码已发送到你的邮箱");
      setCodeSent(true);
      setCountdown(60);
    },
    onError: (err) => toast.error(err.message),
  });

  const sendRegCodeMutation = trpc.auth.sendCode.useMutation({
    onSuccess: () => {
      toast.success("验证码已发送到你的邮箱");
      setRegCodeSent(true);
      setRegCountdown(60);
    },
    onError: (err) => toast.error(err.message),
  });

  const loginWithCodeMutation = trpc.auth.loginWithCode.useMutation({
    onSuccess: async () => {
      toast.success("登录成功！");
      await utils.auth.me.invalidate();
      setLocation("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const loginWithPasswordMutation = trpc.auth.loginWithPassword.useMutation({
    onSuccess: async () => {
      toast.success("登录成功！");
      await utils.auth.me.invalidate();
      setLocation("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      toast.success("注册成功！");
      await utils.auth.me.invalidate();
      setLocation("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSendCode = () => {
    if (!codeEmail) {
      toast.error("请输入邮箱地址");
      return;
    }
    sendCodeMutation.mutate({ email: codeEmail, type: "login" });
  };

  const handleSendRegCode = () => {
    if (!regEmail) {
      toast.error("请输入邮箱地址");
      return;
    }
    sendRegCodeMutation.mutate({ email: regEmail, type: "register" });
  };

  const handleCodeLogin = () => {
    if (!codeEmail || !verifyCode) {
      toast.error("请填写完整信息");
      return;
    }
    loginWithCodeMutation.mutate({ email: codeEmail, code: verifyCode });
  };

  const handlePasswordLogin = () => {
    if (!loginEmail || !loginPassword) {
      toast.error("请填写完整信息");
      return;
    }
    loginWithPasswordMutation.mutate({ email: loginEmail, password: loginPassword });
  };

  const handleRegister = () => {
    if (!regEmail || !regPassword || !regCode) {
      toast.error("请填写完整信息");
      return;
    }
    registerMutation.mutate({
      email: regEmail,
      password: regPassword,
      name: regName || undefined,
      code: regCode,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-warm-subtle flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm-subtle flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-pink-900/20' : 'bg-pink-200/40'}`} />
        <div className={`absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-orange-900/20' : 'bg-orange-200/30'}`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 shadow-lg mb-4"
          >
            <Heart className="w-8 h-8 text-white" fill="white" />
          </motion.div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
            Couple Space
          </h1>
          <p className="text-muted-foreground mt-1">属于你们的专属空间</p>
        </div>

        <Card className="glass-ios border-white/40 dark:border-white/10">
          <CardContent className="p-6">
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-secondary/50 dark:bg-secondary/30">
                <TabsTrigger value="code" className="text-sm">验证码登录</TabsTrigger>
                <TabsTrigger value="password" className="text-sm">密码登录</TabsTrigger>
                <TabsTrigger value="register" className="text-sm">注册</TabsTrigger>
              </TabsList>

              {/* 验证码登录 */}
              <TabsContent value="code" className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    邮箱地址
                  </Label>
                  <Input
                    type="email"
                    placeholder="请输入邮箱"
                    value={codeEmail}
                    onChange={(e) => setCodeEmail(e.target.value)}
                    className="bg-white/50 dark:bg-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>验证码</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="6位验证码"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      maxLength={6}
                      className="bg-white/50 dark:bg-white/10"
                    />
                    <Button
                      variant="outline"
                      onClick={handleSendCode}
                      disabled={countdown > 0 || sendCodeMutation.isPending}
                      className="whitespace-nowrap min-w-[100px]"
                    >
                      {sendCodeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : countdown > 0 ? (
                        `${countdown}s`
                      ) : (
                        "发送验证码"
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={handleCodeLogin}
                  disabled={loginWithCodeMutation.isPending}
                >
                  {loginWithCodeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      登录 <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* 密码登录 */}
              <TabsContent value="password" className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    邮箱地址
                  </Label>
                  <Input
                    type="email"
                    placeholder="请输入邮箱"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="bg-white/50 dark:bg-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    密码
                  </Label>
                  <Input
                    type="password"
                    placeholder="请输入密码"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="bg-white/50 dark:bg-white/10"
                  />
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={handlePasswordLogin}
                  disabled={loginWithPasswordMutation.isPending}
                >
                  {loginWithPasswordMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      登录 <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* 注册 */}
              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    邮箱地址
                  </Label>
                  <Input
                    type="email"
                    placeholder="请输入邮箱"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="bg-white/50 dark:bg-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>验证码</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="6位验证码"
                      value={regCode}
                      onChange={(e) => setRegCode(e.target.value)}
                      maxLength={6}
                      className="bg-white/50 dark:bg-white/10"
                    />
                    <Button
                      variant="outline"
                      onClick={handleSendRegCode}
                      disabled={regCountdown > 0 || sendRegCodeMutation.isPending}
                      className="whitespace-nowrap min-w-[100px]"
                    >
                      {sendRegCodeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : regCountdown > 0 ? (
                        `${regCountdown}s`
                      ) : (
                        "发送验证码"
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    昵称（可选）
                  </Label>
                  <Input
                    placeholder="给自己起个名字"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="bg-white/50 dark:bg-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    密码
                  </Label>
                  <Input
                    type="password"
                    placeholder="至少6位密码"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="bg-white/50 dark:bg-white/10"
                  />
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={handleRegister}
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      注册 <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          登录即表示同意我们的服务条款和隐私政策
        </p>
      </motion.div>
    </div>
  );
}
