import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, SmilePlus, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const quickEmojis = ["❤️", "😘", "🥰", "😍", "💕", "🤗", "😊", "🌹", "💋", "✨", "🎉", "👍"];
const PAGE_SIZE = 20; // 每页加载20条消息

export default function Messages() {
  const [newMessage, setNewMessage] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [offset, setOffset] = useState(0);
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 初始加载和定时刷新（只刷新最新的20条）
  const { data: latestMessages, refetch } = trpc.message.list.useQuery(
    { limit: PAGE_SIZE, offset: 0 },
    {
      refetchInterval: 5000, // 每5秒自动刷新最新消息
      onSuccess: (data) => {
        if (offset === 0) {
          setAllMessages(data);
          setHasMore(data.length === PAGE_SIZE);
        }
      },
    }
  );

  const { data: dailyQuote } = trpc.message.getDailyQuote.useQuery();

  // 加载更多消息
  const loadMoreQuery = trpc.message.list.useQuery(
    { limit: PAGE_SIZE, offset },
    {
      enabled: false, // 手动触发
    }
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const newOffset = offset + PAGE_SIZE;
    
    try {
      const moreMessages = await loadMoreQuery.refetch({ limit: PAGE_SIZE, offset: newOffset });
      if (moreMessages.data && moreMessages.data.length > 0) {
        setAllMessages(prev => [...prev, ...moreMessages.data]);
        setOffset(newOffset);
        setHasMore(moreMessages.data.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("加载更多消息失败:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [offset, isLoadingMore, hasMore, loadMoreQuery]);

  // 监听滚动事件，触发加载更多
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // 滚动到顶部时加载更多历史消息
      if (scrollTop === 0 && hasMore && !isLoadingMore) {
        const previousScrollHeight = scrollHeight;
        loadMore().then(() => {
          // 保持滚动位置，避免跳动
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = container.scrollHeight - previousScrollHeight;
            }
          });
        });
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [loadMore, hasMore, isLoadingMore]);

  const sendMessage = trpc.message.send.useMutation({
    onSuccess: () => {
      setNewMessage("");
      refetch();
      // 滚动到底部
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSend = useCallback(() => {
    if (!newMessage.trim()) return;
    sendMessage.mutate({ content: newMessage.trim() });
  }, [newMessage, sendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojis(false);
    inputRef.current?.focus();
  };

  // 初次加载完成后滚动到底部
  useEffect(() => {
    if (allMessages.length > 0 && offset === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [allMessages.length, offset]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                留言板
              </h1>
              <p className="text-sm text-gray-500">传递甜蜜情话</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* 每日情话 */}
        {dailyQuote && (
          <Card className="bg-gradient-to-r from-pink-100 to-purple-100 border-none">
            <CardContent className="p-4">
              <p className="text-gray-700 italic text-center">"{dailyQuote.content}"</p>
              {dailyQuote.author && (
                <p className="text-sm text-gray-500 text-right mt-2">— {dailyQuote.author}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 消息列表 */}
        <Card className="h-[calc(100vh-280px)]">
          <CardContent 
            ref={messagesContainerRef}
            className="p-4 h-full overflow-y-auto space-y-3"
          >
            {/* 加载更多指示器 */}
            {hasMore && (
              <div className="text-center py-2">
                {isLoadingMore ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">加载中...</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">向上滚动加载更多历史消息</p>
                )}
              </div>
            )}

            {!hasMore && allMessages.length > PAGE_SIZE && (
              <div className="text-center py-2">
                <p className="text-sm text-gray-400">已加载全部消息</p>
              </div>
            )}

            {allMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    msg.isOwn
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                      : "bg-white border"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.isOwn ? "text-pink-100" : "text-gray-400"
                    }`}
                  >
                    {format(new Date(msg.createdAt), "MM-dd HH:mm", { locale: zhCN })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>

        {/* 输入区域 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="说点什么..."
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowEmojis(!showEmojis)}
                >
                  <SmilePlus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={handleSend}
                disabled={!newMessage.trim() || sendMessage.isPending}
                className="bg-gradient-to-r from-pink-500 to-purple-500"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* 快捷表情 */}
            {showEmojis && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg grid grid-cols-6 gap-2">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
