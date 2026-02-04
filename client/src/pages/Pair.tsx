import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import Heart3D from "@/components/Heart3D";
import { useTypewriter } from "@/hooks/useTypewriter";

export default function Pair() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [inviteCode, setInviteCode] = useState("");
  const [togetherDate, setTogetherDate] = useState("");
  const [copied, setCopied] = useState(false);

  // 打字机效果
  const welcomeText = `欢迎你，${user?.name || "亲爱的"}！让我们开始配对吧`;
  const { displayText, isComplete } = useTypewriter(welcomeText, 80, 300);

  const { data: coupleStatus, refetch } = trpc.couple.getStatus.useQuery();
  
  const createInvite = trpc.couple.createInvite.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("邀请码已生成！");
    },
    onError: (err) => toast.error(err.message),
  });

  const joinByCode = trpc.couple.joinByCode.useMutation({
    onSuccess: () => {
      toast.success("配对成功！");
      setLocation("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("已复制到剪贴板");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateInvite = () => {
    createInvite.mutate({ togetherDate: togetherDate || undefined });
  };

  const handleJoin = () => {
    if (!inviteCode.trim()) {
      toast.error("请输入邀请码");
      return;
    }
    joinByCode.mutate({ inviteCode: inviteCode.trim() });
  };

  // 如果已经配对，跳转到首页
  if (coupleStatus?.status === "paired") {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen gradient-warm-rich relative overflow-hidden">
      {/* 装饰性渐变光斑 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-pink-200/40 to-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-orange-200/30 to-pink-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-white/20 to-transparent rounded-full blur-2xl" />
      </div>

      <div className="container relative py-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </motion.div>

        <div className="max-w-md mx-auto">
          {/* 头部区域 */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* 立体爱心 */}
            <div className="flex justify-center mb-6">
              <Heart3D size="xl" animate={true} />
            </div>
            
            <h1 className="text-2xl font-bold mb-3 bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
              情侣配对
            </h1>
            
            {/* 打字机效果欢迎语 */}
            <p className="text-muted-foreground h-6">
              {displayText}
              <span className={`inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle ${isComplete ? 'animate-blink' : ''}`} />
            </p>
          </motion.div>

          {coupleStatus?.status === "pending" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="glass-ios glass-shine rounded-3xl card-ios-hover">
                <CardHeader>
                  <CardTitle>等待对方加入</CardTitle>
                  <CardDescription>将邀请码分享给你的另一半</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-4 bg-white/60 backdrop-blur-sm rounded-2xl text-center border border-white/40 shadow-inner">
                      <span className="text-2xl font-mono font-bold tracking-widest text-primary">
                        {coupleStatus.inviteCode}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl bg-white/60 backdrop-blur-sm border-white/40 hover:bg-white/80"
                      onClick={() => handleCopy(coupleStatus.inviteCode!)}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    邀请码有效期内可多次使用，对方输入后即可配对成功
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Tabs defaultValue="create" className="w-full">
                {/* iOS风格Tab栏 */}
                <TabsList className="grid w-full grid-cols-2 p-1 bg-white/50 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm mb-4">
                  <TabsTrigger 
                    value="create" 
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    创建邀请
                  </TabsTrigger>
                  <TabsTrigger 
                    value="join"
                    className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    输入邀请码
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="create">
                  <Card className="glass-ios glass-shine rounded-3xl card-ios-hover border-0">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">创建邀请码</CardTitle>
                      <CardDescription>生成一个邀请码，分享给你的另一半</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="togetherDate" className="text-sm font-medium">在一起的日期（可选）</Label>
                        <Input
                          id="togetherDate"
                          type="date"
                          value={togetherDate}
                          onChange={(e) => setTogetherDate(e.target.value)}
                          className="rounded-xl bg-white/60 backdrop-blur-sm border-white/40 focus:bg-white/80 transition-colors"
                        />
                        <p className="text-xs text-muted-foreground">
                          设置后可以在首页看到在一起的天数
                        </p>
                      </div>
                      <Button 
                        className="w-full rounded-xl h-11 bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 shadow-lg shadow-rose-500/25 transition-all duration-300" 
                        onClick={handleCreateInvite}
                        disabled={createInvite.isPending}
                      >
                        {createInvite.isPending ? "生成中..." : "生成邀请码"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="join">
                  <Card className="glass-ios glass-shine rounded-3xl card-ios-hover border-0">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">输入邀请码</CardTitle>
                      <CardDescription>输入对方分享的邀请码完成配对</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="inviteCode" className="text-sm font-medium">邀请码</Label>
                        <Input
                          id="inviteCode"
                          placeholder="请输入8位邀请码"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                          maxLength={8}
                          className="text-center text-lg tracking-widest rounded-xl bg-white/60 backdrop-blur-sm border-white/40 focus:bg-white/80 transition-colors font-mono"
                        />
                      </div>
                      <Button 
                        className="w-full rounded-xl h-11 bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 shadow-lg shadow-rose-500/25 transition-all duration-300" 
                        onClick={handleJoin}
                        disabled={joinByCode.isPending}
                      >
                        {joinByCode.isPending ? "配对中..." : "确认配对"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
