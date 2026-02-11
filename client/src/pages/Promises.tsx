import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Plus, Check, CheckCheck, Trash2, Heart } from "lucide-react";
import { useAuth } from "../_core/hooks/useAuth";

export default function Promises() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");

  const { data: promises = [], refetch } = trpc.promise.list.useQuery();
  const createMutation = trpc.promise.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsOpen(false);
      setContent("");
    },
  });
  const completeMutation = trpc.promise.complete.useMutation({
    onSuccess: () => refetch(),
  });
  const confirmMutation = trpc.promise.confirm.useMutation({
    onSuccess: () => refetch(),
  });
  const deleteMutation = trpc.promise.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleCreate = () => {
    if (!content.trim()) return;
    createMutation.mutate({ content });
  };

  const myPromises = promises.filter((p) => p.isOwn);
  const theirPromises = promises.filter((p) => !p.isOwn);

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: "进行中", className: "bg-yellow-100 text-yellow-800" },
      completed: { text: "已完成", className: "bg-blue-100 text-blue-800" },
      confirmed: { text: "已兑现", className: "bg-green-100 text-green-800" },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            我们的承诺
          </h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-500">
                <Plus className="w-4 h-4 mr-2" />
                许下承诺
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>许下承诺</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="写下你对TA的承诺..."
                  rows={5}
                />
                <Button
                  onClick={handleCreate}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
                  disabled={!content.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? "创建中..." : "许下承诺"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 我的承诺 */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              我的承诺
            </h2>
            <div className="space-y-4">
              {myPromises.map((promise) => {
                const badge = getStatusBadge(promise.status);
                return (
                  <Card key={promise.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate({ id: promise.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    <p className="text-gray-700 mb-4">{promise.content}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{new Date(promise.createdAt).toLocaleDateString("zh-CN")}</span>
                      {promise.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => completeMutation.mutate({ id: promise.id })}
                          disabled={completeMutation.isPending}
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
                <div className="text-center py-12 text-gray-500">
                  <p>还没有承诺，快来许下一个吧！</p>
                </div>
              )}
            </div>
          </div>

          {/* TA的承诺 */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-purple-500" />
              TA的承诺
            </h2>
            <div className="space-y-4">
              {theirPromises.map((promise) => {
                const badge = getStatusBadge(promise.status);
                return (
                  <Card key={promise.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.text}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{promise.content}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{new Date(promise.createdAt).toLocaleDateString("zh-CN")}</span>
                      {promise.status === "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50"
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
                <div className="text-center py-12 text-gray-500">
                  <p>TA还没有许下承诺</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
