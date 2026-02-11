import { Button } from "./ui/button";
import { FileJson, FileText, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { exportAsJSON, exportAsMarkdown } from "@/lib/dataExport";
import { toast } from "sonner";
import { useState } from "react";

export function ExportDataButtons() {
  const [isExporting, setIsExporting] = useState(false);

  // 获取所有数据
  const { data: diaries } = trpc.diary.list.useQuery();
  const { data: messages } = trpc.message.list.useQuery();
  const { data: tasks } = trpc.task.list.useQuery();
  const { data: wishes } = trpc.wish.list.useQuery();
  const { data: footprints } = trpc.footprint.list.useQuery();
  const { data: anniversaries } = trpc.anniversary.list.useQuery();
  const { data: moodRecords } = trpc.mood.list.useQuery();
  const { data: todoLists } = trpc.todoList.list.useQuery();
  const { data: timeCapsules } = trpc.timeCapsule.list.useQuery();
  const { data: ledgerRecords } = trpc.ledger.list.useQuery();
  const { data: countdowns } = trpc.countdown.list.useQuery();
  const { data: promises } = trpc.promise.list.useQuery();

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const data = {
        diaries,
        messages,
        tasks,
        wishes,
        footprints,
        anniversaries,
        moodRecords,
        todoLists,
        timeCapsules,
        ledgerRecords,
        countdowns,
        promises,
        exportDate: new Date().toISOString(),
      };
      exportAsJSON(data);
      toast.success("数据已导出为 JSON 文件");
    } catch (error) {
      toast.error("导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMarkdown = async () => {
    setIsExporting(true);
    try {
      const data = {
        diaries,
        messages,
        tasks,
        wishes,
        footprints,
        anniversaries,
        ledgerRecords,
      };
      exportAsMarkdown(data);
      toast.success("数据已导出为 Markdown 文件");
    } catch (error) {
      toast.error("导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        onClick={handleExportJSON}
        disabled={isExporting}
        className="flex-1"
        variant="outline"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileJson className="w-4 h-4 mr-2" />
        )}
        导出为 JSON
      </Button>
      <Button
        onClick={handleExportMarkdown}
        disabled={isExporting}
        className="flex-1"
        variant="outline"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 mr-2" />
        )}
        导出为 Markdown
      </Button>
    </div>
  );
}
