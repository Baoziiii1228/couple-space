import JSZip from "jszip";
import { saveAs } from "file-saver";
import { format } from "date-fns";

interface BackupData {
  diaries?: any[];
  photos?: any[];
  messages?: any[];
  tasks?: any[];
  wishes?: any[];
  footprints?: any[];
  moods?: any[];
  capsules?: any[];
  promises?: any[];
  achievements?: any[];
  ledgers?: any[];
  countdowns?: any[];
  hundredThings?: any[];
  todoLists?: any[];
}

/**
 * 按月备份数据到ZIP文件
 * @param year 年份
 * @param month 月份 (1-12)
 * @param data 要备份的数据
 */
export async function backupMonthlyData(
  year: number,
  month: number,
  data: BackupData
): Promise<void> {
  const zip = new JSZip();
  const monthStr = month.toString().padStart(2, "0");
  const backupName = `couple-space-backup-${year}-${monthStr}`;

  // 创建备份信息文件
  const backupInfo = {
    backupDate: new Date().toISOString(),
    year,
    month,
    dataTypes: Object.keys(data).filter(key => data[key as keyof BackupData]?.length),
    totalItems: Object.values(data).reduce((sum, items) => sum + (items?.length || 0), 0),
  };

  zip.file("backup-info.json", JSON.stringify(backupInfo, null, 2));

  // 按数据类型分类存储
  const categories = {
    "01-日记": data.diaries,
    "02-照片": data.photos,
    "03-留言": data.messages,
    "04-任务": data.tasks,
    "05-愿望": data.wishes,
    "06-足迹": data.footprints,
    "07-心情": data.moods,
    "08-时光胶囊": data.capsules,
    "09-承诺": data.promises,
    "10-成就": data.achievements,
    "11-账本": data.ledgers,
    "12-倒计时": data.countdowns,
    "13-百件清单": data.hundredThings,
    "14-待办清单": data.todoLists,
  };

  // 为每个分类创建文件夹和JSON文件
  for (const [folderName, items] of Object.entries(categories)) {
    if (items && items.length > 0) {
      const folder = zip.folder(folderName);
      if (folder) {
        // 保存JSON格式数据
        folder.file(`${folderName}.json`, JSON.stringify(items, null, 2));

        // 保存Markdown格式数据（可读性更好）
        const markdown = convertToMarkdown(folderName, items);
        folder.file(`${folderName}.md`, markdown);
      }
    }
  }

  // 生成ZIP文件并下载
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${backupName}.zip`);
}

/**
 * 将数据转换为Markdown格式
 */
function convertToMarkdown(category: string, items: any[]): string {
  let markdown = `# ${category}\n\n`;
  markdown += `> 共 ${items.length} 条记录\n\n`;
  markdown += `---\n\n`;

  items.forEach((item, index) => {
    markdown += `## ${index + 1}. ${getItemTitle(item)}\n\n`;

    // 根据不同类型展示不同字段
    if (item.content) {
      markdown += `${item.content}\n\n`;
    }
    if (item.description) {
      markdown += `**描述**: ${item.description}\n\n`;
    }
    if (item.title && !getItemTitle(item).includes(item.title)) {
      markdown += `**标题**: ${item.title}\n\n`;
    }
    if (item.amount) {
      markdown += `**金额**: ¥${item.amount}\n\n`;
    }
    if (item.address) {
      markdown += `**地址**: ${item.address}\n\n`;
    }
    if (item.mood) {
      markdown += `**心情**: ${item.mood}\n\n`;
    }
    if (item.priority) {
      markdown += `**优先级**: ${item.priority}\n\n`;
    }
    if (item.status) {
      markdown += `**状态**: ${item.status}\n\n`;
    }
    if (item.createdAt) {
      markdown += `**创建时间**: ${format(new Date(item.createdAt), "yyyy-MM-dd HH:mm:ss")}\n\n`;
    }

    markdown += `---\n\n`;
  });

  return markdown;
}

/**
 * 获取项目标题
 */
function getItemTitle(item: any): string {
  if (item.title) return item.title;
  if (item.content) {
    const preview = item.content.substring(0, 30);
    return preview.length < item.content.length ? `${preview}...` : preview;
  }
  return "无标题";
}

/**
 * 备份所有数据（不按月份）
 */
export async function backupAllData(data: BackupData): Promise<void> {
  const now = new Date();
  await backupMonthlyData(now.getFullYear(), now.getMonth() + 1, data);
}
