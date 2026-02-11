import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Plus, Check, CheckCheck, Trash2, Heart, ArrowLeft } from "lucide-react";
import { useAuth } from "../_core/hooks/useAuth";
import { useTheme } from "../contexts/ThemeContext";
import { useLocation } from "wouter";

const quickPromiseTags = [
  { label: "💪 每天运动", text: "我承诺每天和TA一起运动" },
  { label: "📚 一起学习", text: "我承诺和TA一起学习进步" },
  { label: "🍽️ 一起做饭", text: "我承诺和TA一起做饭" },
  { label: "🚗 一起旅行", text: "我承诺和TA一起去旅行" },
  { label: "💰 一起存钱", text: "我承诺和TA一起存钱" },
  { label: "🏠 一起打扫", text: "我承诺和TA一起打扫家务" },
  { label: "📱 少玩手机", text: "我承诺少玩手机多陪伴TA" },
  { label: "😊 保持开心", text: "我承诺保持开心的心态" },
  { label: "💕 每天说爱你", text: "我承诺每天对TA说我爱你" },
  { label: "🌟 互相支持", text: "我承诺永远支持TA" },
];

export default function Promises() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");

  const { data: promises = [], refetch } = trpc.promise.list.useQuery();
  const createMutation = trpc.promise.create.useMutation();
  const completeMutation = trpc.promise.complete.useMutation();
  const confirmMutation = trpc.promise.confirm.useMutation();
  const deleteMutation = trpc.promise.delete.useMutation();

  // React Query v5: 使用 useEffect 替代 onSuccess
  useEffect(() => {
    if (createMutation.isSuccess) {
      refetch();
      setIsOpen(false);
      setContent("");
      createMutation.reset();
    }
  }, [createMutation.isSuccess]);

  useEffect(() => {
    if (completeMutation.isSuccess || confirmMutation.isSuccess || deleteMutation.isSuccess) {
      refetch();
      completeMutation.reset();
      confirmMutation.reset();
      deleteMutation.reset();
    }
  }, [completeMutation.isSuccess, confirmMutation.isSuccess, deleteMutation.isSuccess]);

  const handleCreate = () => {
    if (!content.trim()) return;
    createMutation.mutate({ content });
  };

  const myPromises = promises.filter((p) => p.isOwn);
  const theirPromises = promises.filter((p) => !p.isOwn);

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: "进行中", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
      completed: { text: "已完成", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
      confirmed: { text: "已兑现", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/dashboard")}
              className="hover:bg-white/50 dark:hover:bg-gray-800/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                我们的承诺
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                记录对彼此的每一个承诺
              </p>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                许下承诺
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-gray-800 dark:text-white">
              <DialogHeader>
                <DialogTitle className="dark:text-white">许下承诺</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-white">快捷标签</label>
                  <div className="flex flex-wrap gap-2">
                    {quickPromiseTags.map((tag, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                        onClick={() => setContent(tag.text)}
                      >
                        {tag.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="写下你对TA的承诺..."
                  rows={5}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
                <Button
                  onClick={handleCreate}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                  disabled={!content.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? "创建中..." : "许下承诺"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Promises Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 我的承诺 */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 dark:text-pink-400" />
              我的承诺
            </h2>
            <div className="space-y-4">
              {myPromises.map((promise) => {
                const badge = getStatusBadge(promise.status);
                return (
                  <Card key={promise.id} className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate({ id: promise.id })}
                        className="hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                      </Button>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{promise.content}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-500">
                      <span>{new Date(promise.createdAt).toLocaleDateString("zh-CN")}</span>
                      {promise.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => completeMutation.mutate({ id: promise.id })}
                          disabled={completeMutation.isPending}
                          className="border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          标记完成
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
              {myPromises.length === 0 && (
                <Card className="p-12 text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur border-gray-200 dark:border-gray-700">
                  <Heart className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">还没有承诺，快来许下一个吧！</p>
                </Card>
              )}
            </div>
          </div>

          {/* TA的承诺 */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Heart className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              TA的承诺
            </h2>
            <div className="space-y-4">
              {theirPromises.map((promise) => {
                const badge = getStatusBadge(promise.status);
                return (
                  <Card key={promise.id} className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.text}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{promise.content}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-500">
                      <span>{new Date(promise.createdAt).toLocaleDateString("zh-CN")}</span>
                      {promise.status === "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                          onClick={() => confirmMutation.mutate({ id: promise.id })}
                          disabled={confirmMutation.isPending}
                        >
                          <CheckCheck className="w-4 h-4 mr-1" />
                          确认兑现
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
              {theirPromises.length === 0 && (
                <Card className="p-12 text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur border-gray-200 dark:border-gray-700">
                  <Heart className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">TA还没有许下承诺</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
