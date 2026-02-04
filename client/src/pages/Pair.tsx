import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Copy, Check, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";

export default function Pair() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [inviteCode, setInviteCode] = useState("");
  const [togetherDate, setTogetherDate] = useState("");
  const [copied, setCopied] = useState(false);

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
    <div className="min-h-screen gradient-warm-subtle">
      <div className="container py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Heart className="w-12 h-12 text-primary mx-auto mb-4 animate-heartbeat" fill="currentColor" />
            <h1 className="text-2xl font-bold mb-2">情侣配对</h1>
            <p className="text-muted-foreground">
              欢迎你，{user?.name || "亲爱的"}！让我们开始配对吧
            </p>
          </div>

          {coupleStatus?.status === "pending" ? (
            <Card className="glass border-white/40">
              <CardHeader>
                <CardTitle>等待对方加入</CardTitle>
                <CardDescription>将邀请码分享给你的另一半</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-4 bg-secondary rounded-lg text-center">
                    <span className="text-2xl font-mono font-bold tracking-widest">
                      {coupleStatus.inviteCode}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(coupleStatus.inviteCode!)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  邀请码有效期内可多次使用，对方输入后即可配对成功
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">创建邀请</TabsTrigger>
                <TabsTrigger value="join">输入邀请码</TabsTrigger>
              </TabsList>

              <TabsContent value="create">
                <Card className="glass border-white/40">
                  <CardHeader>
                    <CardTitle>创建邀请码</CardTitle>
                    <CardDescription>生成一个邀请码，分享给你的另一半</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="togetherDate">在一起的日期（可选）</Label>
                      <Input
                        id="togetherDate"
                        type="date"
                        value={togetherDate}
                        onChange={(e) => setTogetherDate(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        设置后可以在首页看到在一起的天数
                      </p>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleCreateInvite}
                      disabled={createInvite.isPending}
                    >
                      {createInvite.isPending ? "生成中..." : "生成邀请码"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="join">
                <Card className="glass border-white/40">
                  <CardHeader>
                    <CardTitle>输入邀请码</CardTitle>
                    <CardDescription>输入对方分享的邀请码完成配对</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="inviteCode">邀请码</Label>
                      <Input
                        id="inviteCode"
                        placeholder="请输入8位邀请码"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        maxLength={8}
                        className="text-center text-lg tracking-widest"
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleJoin}
                      disabled={joinByCode.isPending}
                    >
                      {joinByCode.isPending ? "配对中..." : "确认配对"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
