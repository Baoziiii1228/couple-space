import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Search, BookOpen, MessageCircle, Star, Gift, MapPin, Film, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "./ui/button";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");

  // 获取所有数据
  const { data: diaries } = trpc.diary.list.useQuery(undefined, { enabled: open });
  const { data: messages } = trpc.message.list.useQuery(undefined, { enabled: open });
  const { data: tasks } = trpc.task.list.useQuery(undefined, { enabled: open });
  const { data: wishes } = trpc.wish.list.useQuery(undefined, { enabled: open });
  const { data: footprints } = trpc.footprint.list.useQuery(undefined, { enabled: open });
  const { data: todoLists } = trpc.todoList.list.useQuery(undefined, { enabled: open });
  const { data: timeCapsules } = trpc.timeCapsule.list.useQuery(undefined, { enabled: open });

  // 搜索结果
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const results: Array<{
      type: string;
      icon: any;
      title: string;
      content: string;
      link: string;
      color: string;
    }> = [];

    // 搜索日记
    diaries?.forEach((diary: any) => {
      if (
        diary.title?.toLowerCase().includes(lowerQuery) ||
        diary.content?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: "日记",
          icon: BookOpen,
          title: diary.title || "无标题",
          content: diary.content?.substring(0, 100) || "",
          link: "/diary",
          color: "text-orange-500",
        });
      }
    });

    // 搜索消息
    messages?.forEach((message: any) => {
      if (message.content?.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: "消息",
          icon: MessageCircle,
          title: message.content.substring(0, 50),
          content: message.content.substring(0, 100),
          link: "/messages",
          color: "text-green-500",
        });
      }
    });

    // 搜索任务
    tasks?.forEach((task: any) => {
      if (
        task.title?.toLowerCase().includes(lowerQuery) ||
        task.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: "任务",
          icon: Star,
          title: task.title,
          content: task.description || "",
          link: "/tasks",
          color: "text-yellow-500",
        });
      }
    });

    // 搜索愿望
    wishes?.forEach((wish: any) => {
      if (
        wish.title?.toLowerCase().includes(lowerQuery) ||
        wish.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: "愿望",
          icon: Gift,
          title: wish.title,
          content: wish.description || "",
          link: "/wishes",
          color: "text-purple-500",
        });
      }
    });

    // 搜索足迹
    footprints?.forEach((footprint: any) => {
      if (
        footprint.location?.toLowerCase().includes(lowerQuery) ||
        footprint.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: "足迹",
          icon: MapPin,
          title: footprint.location,
          content: footprint.description || "",
          link: "/footprints",
          color: "text-teal-500",
        });
      }
    });

    // 搜索待办清单
    todoLists?.forEach((todo: any) => {
      if (
        todo.title?.toLowerCase().includes(lowerQuery) ||
        todo.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: "清单",
          icon: Film,
          title: todo.title,
          content: todo.description || "",
          link: "/todo-list",
          color: "text-rose-500",
        });
      }
    });

    // 搜索时光胶囊
    timeCapsules?.forEach((capsule: any) => {
      if (
        capsule.title?.toLowerCase().includes(lowerQuery) ||
        capsule.content?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: "胶囊",
          icon: Clock,
          title: capsule.title,
          content: capsule.content?.substring(0, 100) || "",
          link: "/time-capsule",
          color: "text-indigo-500",
        });
      }
    });

    return results.slice(0, 20); // 最多显示20条结果
  }, [query, diaries, messages, tasks, wishes, footprints, todoLists, timeCapsules]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>全局搜索</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索日记、消息、任务、愿望..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mt-4">
          {query.trim() === "" ? (
            <div className="text-center text-muted-foreground py-8">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>输入关键词开始搜索</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>没有找到相关内容</p>
            </div>
          ) : (
            searchResults.map((result, index) => (
              <Link key={index} href={result.link}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => onOpenChange(false)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <result.icon className={`w-5 h-5 ${result.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs ${result.color} font-medium`}>{result.type}</span>
                        <span className="font-medium truncate">{result.title}</span>
                      </div>
                      {result.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.content}
                        </p>
                      )}
                    </div>
                  </div>
                </Button>
              </Link>
            ))
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          找到 {searchResults.length} 条结果
        </div>
      </DialogContent>
    </Dialog>
  );
}
