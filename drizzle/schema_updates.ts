// 新功能的数据库 schema 更新

import { mysqlTable, int, varchar, text, timestamp, boolean, mysqlEnum, json } from "drizzle-orm/mysql-core";

// ==================== 更新：任务表添加时间字段 ====================
// tasks 表需要添加：
// - startTime: timestamp (开始时间)
// - deadline: timestamp (截止时间)

// ==================== 更新：心情打卡添加图片字段 ====================
// moodRecords 表需要添加：
// - images: json (图片数组，最多2张)

// ==================== 更新：待办清单扩展 ====================
// todoLists 表需要：
// 1. 修改 type 枚举：添加 'tv', 'travel', 'activity'
// 2. 添加 tags 字段：json (标签数组)

// ==================== 新增：倒计时表 ====================
export const countdowns = mysqlTable("countdowns", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  userId: int("userId").notNull(), // 创建人
  title: varchar("title", { length: 200 }).notNull(),
  targetDate: timestamp("targetDate").notNull(),
  type: mysqlEnum("type", ["milestone", "meetup", "custom"]).notNull(),
  description: text("description"),
  emoji: varchar("emoji", { length: 10 }),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Countdown = typeof countdowns.$inferSelect;
export type InsertCountdown = typeof countdowns.$inferInsert;

// ==================== 新增：承诺表 ====================
export const promises = mysqlTable("promises", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  userId: int("userId").notNull(), // 承诺人
  content: text("content").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "confirmed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  confirmedAt: timestamp("confirmedAt"),
  confirmedBy: int("confirmedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Promise = typeof promises.$inferSelect;
export type InsertPromise = typeof promises.$inferInsert;

// ==================== 成就定义（扩展） ====================
export const ACHIEVEMENT_DEFINITIONS = {
  // 恋爱天数相关
  days_7: { name: "相识一周", description: "在一起7天了", emoji: "💝" },
  days_30: { name: "满月之喜", description: "在一起30天了", emoji: "🌙" },
  days_100: { name: "百日纪念", description: "在一起100天了", emoji: "💯" },
  days_200: { name: "二百天", description: "在一起200天了", emoji: "🎊" },
  days_365: { name: "周年纪念", description: "在一起一年了", emoji: "🎉" },
  days_520: { name: "520天", description: "在一起520天了", emoji: "💖" },
  days_999: { name: "天长地久", description: "在一起999天了", emoji: "💑" },
  
  // 互动相关
  first_message: { name: "第一条消息", description: "发送了第一条留言", emoji: "💌" },
  messages_10: { name: "甜言蜜语", description: "发送了10条留言", emoji: "💬" },
  messages_100: { name: "话痨情侣", description: "发送了100条留言", emoji: "📱" },
  
  first_photo: { name: "第一张照片", description: "上传了第一张照片", emoji: "📷" },
  photos_10: { name: "摄影爱好者", description: "上传了10张照片", emoji: "📸" },
  photos_100: { name: "回忆满满", description: "上传了100张照片", emoji: "🖼️" },
  
  // 日记相关
  first_diary: { name: "第一篇日记", description: "写了第一篇日记", emoji: "📝" },
  diaries_10: { name: "记录生活", description: "写了10篇日记", emoji: "📖" },
  diaries_50: { name: "日记达人", description: "写了50篇日记", emoji: "📚" },
  
  // 任务相关
  first_task: { name: "第一个任务", description: "完成了第一个任务", emoji: "✅" },
  tasks_10: { name: "行动派", description: "完成了10个任务", emoji: "🎯" },
  tasks_50: { name: "任务大师", description: "完成了50个任务", emoji: "🏆" },
  
  // 清单相关
  first_todo: { name: "第一个清单", description: "添加了第一个清单项", emoji: "📋" },
  todos_10: { name: "计划达人", description: "完成了10个清单项", emoji: "✨" },
  
  // 心情相关
  mood_streak_7: { name: "坚持打卡", description: "连续打卡7天", emoji: "🌟" },
  mood_streak_30: { name: "习惯养成", description: "连续打卡30天", emoji: "⭐" },
  
  // 特殊相关
  first_anniversary: { name: "第一个纪念日", description: "创建了第一个纪念日", emoji: "🎂" },
  first_promise: { name: "第一个承诺", description: "许下了第一个承诺", emoji: "🤝" },
  promise_keeper: { name: "守信之人", description: "兑现了10个承诺", emoji: "💪" },
};
