// 数据导出工具函数

export interface ExportData {
  diaries?: any[];
  photos?: any[];
  messages?: any[];
  tasks?: any[];
  wishes?: any[];
  footprints?: any[];
  anniversaries?: any[];
  moodRecords?: any[];
  todoLists?: any[];
  timeCapsules?: any[];
  hundredThings?: any[];
  ledgerRecords?: any[];
  countdowns?: any[];
  promises?: any[];
}

// 导出为 JSON 文件
export function exportAsJSON(data: ExportData, filename: string = "couple-space-data.json") {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 导出为 Markdown 文件
export function exportAsMarkdown(data: ExportData, filename: string = "couple-space-data.md") {
  let markdown = "# Couple Space 数据导出\n\n";
  markdown += `导出时间: ${new Date().toLocaleString("zh-CN")}\n\n`;
  markdown += "---\n\n";

  // 日记
  if (data.diaries && data.diaries.length > 0) {
    markdown += "## 📖 日记\n\n";
    data.diaries.forEach((diary: any, index: number) => {
      markdown += `### ${index + 1}. ${diary.title || "无标题"}\n\n`;
      markdown += `**日期**: ${new Date(diary.createdAt).toLocaleDateString("zh-CN")}\n\n`;
      markdown += `${diary.content}\n\n`;
      markdown += "---\n\n";
    });
  }

  // 消息
  if (data.messages && data.messages.length > 0) {
    markdown += "## 💬 消息记录\n\n";
    data.messages.forEach((message: any) => {
      const time = new Date(message.createdAt).toLocaleString("zh-CN");
      markdown += `**${time}**: ${message.content}\n\n`;
    });
    markdown += "---\n\n";
  }

  // 任务
  if (data.tasks && data.tasks.length > 0) {
    markdown += "## ✅ 任务\n\n";
    data.tasks.forEach((task: any) => {
      const status = task.completed ? "✓" : "☐";
      markdown += `- [${status}] ${task.title}\n`;
      if (task.description) {
        markdown += `  ${task.description}\n`;
      }
    });
    markdown += "\n---\n\n";
  }

  // 愿望
  if (data.wishes && data.wishes.length > 0) {
    markdown += "## 🎁 愿望清单\n\n";
    data.wishes.forEach((wish: any) => {
      const status = wish.fulfilled ? "✓" : "☐";
      markdown += `- [${status}] ${wish.title}\n`;
      if (wish.description) {
        markdown += `  ${wish.description}\n`;
      }
    });
    markdown += "\n---\n\n";
  }

  // 足迹
  if (data.footprints && data.footprints.length > 0) {
    markdown += "## 📍 足迹\n\n";
    data.footprints.forEach((footprint: any) => {
      markdown += `### ${footprint.location}\n\n`;
      markdown += `**日期**: ${new Date(footprint.date).toLocaleDateString("zh-CN")}\n\n`;
      if (footprint.description) {
        markdown += `${footprint.description}\n\n`;
      }
      markdown += "---\n\n";
    });
  }

  // 纪念日
  if (data.anniversaries && data.anniversaries.length > 0) {
    markdown += "## 🎉 纪念日\n\n";
    data.anniversaries.forEach((anniversary: any) => {
      markdown += `- ${anniversary.emoji || "📅"} **${anniversary.title}**: ${new Date(anniversary.date).toLocaleDateString("zh-CN")}\n`;
    });
    markdown += "\n---\n\n";
  }

  // 账本
  if (data.ledgerRecords && data.ledgerRecords.length > 0) {
    markdown += "## 💰 账本记录\n\n";
    data.ledgerRecords.forEach((record: any) => {
      const type = record.type === "income" ? "收入" : "支出";
      const amount = record.type === "income" ? `+¥${record.amount}` : `-¥${record.amount}`;
      markdown += `- **${new Date(record.date).toLocaleDateString("zh-CN")}** [${type}] ${amount} - ${record.category || "其他"}\n`;
      if (record.description) {
        markdown += `  ${record.description}\n`;
      }
    });
    markdown += "\n---\n\n";
  }

  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
