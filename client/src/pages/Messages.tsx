import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Heart, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function Messages() {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, refetch } = trpc.message.list.useQuery();
  const { data: dailyQuote } = trpc.message.getDailyQuote.useQuery();

  const sendMessage = trpc.message.send.useMutation({
    onSuccess: () => {
      setNewMessage("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage.mutate({ content: newMessage.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen gradient-warm-subtle flex flex-col">
      <header className="sticky top-0 z-50 glass border-b border-white/20 dark:border-white/10">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">留言板</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-4 flex flex-col">
        {/* 每日情话 */}
        {dailyQuote && (
          <Card className="glass border-white/40 dark:border-white/10 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Heart className="w-4 h-4 text-primary" />
                今日情话
              </div>
              <p className="text-foreground italic">\"{dailyQuote.content}\"</p>
            </CardContent>
          </Card>
        )}

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages && messages.length > 0 ? (
            messages.slice().reverse().map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] ${message.isOwn ? "order-1" : ""}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "glass border-white/40 dark:border-white/10 rounded-bl-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className={`text-xs text-muted-foreground mt-1 ${message.isOwn ? "text-right" : ""}`}>
                    {format(new Date(message.createdAt), "MM/dd HH:mm", { locale: zhCN })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <MessageCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">还没有留言</p>
              <p className="text-sm text-muted-foreground">给TA发送第一条消息吧 💕</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <div className="sticky bottom-0 glass border-t border-white/20 dark:border-white/10 -mx-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="写下你想说的话..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              size="icon" 
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMessage.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
