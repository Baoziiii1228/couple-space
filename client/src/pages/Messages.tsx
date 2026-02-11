import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, SmilePlus, Loader2, Search, Filter, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const quickEmojis = ["❤️", "😘", "🥰", "😍", "💕", "🤗", "😊", "🌹", "💋", "✨", "🎉", "👍"];

const quickMessages = [
  { label: "💕 我爱你", text: "我爱你❤️" },
  { label: "🌹 想你了", text: "好想你呀~" },
  { label: "😘 晚安", text: "晚安，做个好梦💤" },
  { label: "🎁 惊喜", text: "给你准备了惊喜哦🎁" },
  { label: "🍽️ 吃饭吗", text: "一起吃饭吗？" },
  { label: "🎬 看电影", text: "一起看电影吗？" },
  { label: "💪 加油", text: "加油！你最棒💪" },
  { label: "🤗 抱抱", text: "给你一个大大的拥抱🤗" },
  { label: "😊 开心", text: "今天好开心呀😊" },
  { label: "🌟 你最棒", text: "你是最棒的🌟" },
];
const PAGE_SIZE = 20; // 每页加载20条消息

export default function Messages() {
  const [newMessage, setNewMessage] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadOffset, setLoadOffset] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [senderFilter, setSenderFilter] = useState<"all" | "mine" | "partner">("all");
  const [showFilters, setShowFilters] = useState(false);

  // 初始加载和定时刷新（只刷新最新的20条）
  const { data: latestMessages, refetch } = trpc.message.list.useQuery(
    { limit: PAGE_SIZE, offset: 0 },
    {
      refetchInterval: 5000, // 每5秒自动刷新最新消息
    }
  );

  // 用 useEffect 替代已弃用的 onSuccess
  useEffect(() => {
    if (latestMessages && !isLoadingMore) {
      setAllMessages(prev => {
        // 如果还没有加载过更多历史消息，直接替换
        if (loadOffset === 0) {
          return latestMessages;
        }
        // 如果已经加载了历史消息，只更新最新部分
        const oldMessages = prev.slice(latestMessages.length);
        return [...latestMessages, ...oldMessages];
      });
      if (!initialLoaded) {
        setHasMore(latestMessages.length === PAGE_SIZE);
        setInitialLoaded(true);
      }
    }
  }, [latestMessages]);

  const { data: dailyQuote } = trpc.message.getDailyQuote.useQuery();

  const utils = trpc.useUtils();

  // 加载更多消息 - 使用 utils.client 直接调用
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const newOffset = loadOffset + PAGE_SIZE;
    
    try {
      const moreMessages = await utils.client.message.list.query({ 
        limit: PAGE_SIZE, 
        offset: newOffset 
      });
      if (moreMessages && moreMessages.length > 0) {
        setAllMessages(prev => [...prev, ...moreMessages]);
        setLoadOffset(newOffset);
        setHasMore(moreMessages.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("加载更多消息失败:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [loadOffset, isLoadingMore, hasMore, utils]);

  // 监听滚动事件，触发加载更多
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop } = container;
      // 滚动到顶部时加载更多历史消息
      if (scrollTop === 0 && hasMore && !isLoadingMore) {
        const previousScrollHeight = container.scrollHeight;
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

  const inputRef = useRef<HTMLInputElement>(null);

  // 初次加载完成后滚动到底部
  useEffect(() => {
    if (allMessages.length > 0 && loadOffset === 0 && initialLoaded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [initialLoaded]);

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
        {/* 搜索和筛选栏 */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索消息内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* 筛选按钮 */}
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                筛选
              </Button>
              {(dateFilter !== "all" || senderFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFilter("all");
                    setSenderFilter("all");
                  }}
                  className="gap-1"
                >
                  <X className="h-3 w-3" />
                  清除筛选
                </Button>
              )}
            </div>

            {/* 筛选选项 */}
            {showFilters && (
              <div className="space-y-3 pt-2 border-t">
                {/* 日期筛选 */}
                <div>
                  <label className="text-sm font-medium mb-2 block">日期范围</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: "all", label: "全部" },
                      { value: "today", label: "今天" },
                      { value: "week", label: "本周" },
                      { value: "month", label: "本月" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={dateFilter === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDateFilter(option.value as any)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 发送者筛选 */}
                <div>
                  <label className="text-sm font-medium mb-2 block">发送者</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: "all", label: "全部" },
                      { value: "mine", label: "我的" },
                      { value: "partner", label: "TA的" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={senderFilter === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSenderFilter(option.value as any)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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

            {allMessages
              .filter((msg) => {
                // 搜索过滤
                if (searchQuery && !msg.content.toLowerCase().includes(searchQuery.toLowerCase())) {
                  return false;
                }

                // 日期过滤
                if (dateFilter !== "all") {
                  const msgDate = new Date(msg.createdAt);
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  
                  if (dateFilter === "today") {
                    if (msgDate < today) return false;
                  } else if (dateFilter === "week") {
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    if (msgDate < weekAgo) return false;
                  } else if (dateFilter === "month") {
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    if (msgDate < monthAgo) return false;
                  }
                }

                // 发送者过滤
                if (senderFilter !== "all") {
                  if (senderFilter === "mine" && !msg.isOwn) return false;
                  if (senderFilter === "partner" && msg.isOwn) return false;
                }

                return true;
              })
              .map((msg) => (
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

            {/* 快捷标签 */}
            <div className="mt-3 space-y-2">
              <div className="text-xs text-gray-500">快捷标签</div>
              <div className="flex flex-wrap gap-2">
                {quickMessages.map((msg, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setNewMessage(msg.text)}
                  >
                    {msg.label}
                  </Button>
                ))}
              </div>
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
