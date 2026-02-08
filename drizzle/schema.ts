import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

// ==================== 用户系统 ====================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: varchar("password", { length: 255 }), // bcrypt hashed password
  avatar: text("avatar"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// 验证码表
export const verificationCodes = mysqlTable("verificationCodes", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  type: mysqlEnum("type", ["login", "register", "reset"]).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false).notNull(),
  attemptCount: int("attemptCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 情侣配对表
export const couples = mysqlTable("couples", {
  id: int("id").autoincrement().primaryKey(),
  user1Id: int("user1Id").notNull(),
  user2Id: int("user2Id"),
  inviteCode: varchar("inviteCode", { length: 16 }).notNull().unique(),
  togetherDate: timestamp("togetherDate"), // 在一起的日期
  status: mysqlEnum("status", ["pending", "paired", "dissolved"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Couple = typeof couples.$inferSelect;
export type InsertCouple = typeof couples.$inferInsert;

// ==================== 情侣相册 ====================

export const albums = mysqlTable("albums", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  coverUrl: text("coverUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Album = typeof albums.$inferSelect;
export type InsertAlbum = typeof albums.$inferInsert;

export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  albumId: int("albumId"),
  uploaderId: int("uploaderId").notNull(),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  caption: text("caption"),
  takenAt: timestamp("takenAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

// ==================== 恋爱日记 ====================

export const diaries = mysqlTable("diaries", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  authorId: int("authorId").notNull(),
  title: varchar("title", { length: 200 }),
  content: text("content").notNull(),
  mood: varchar("mood", { length: 50 }),
  weather: varchar("weather", { length: 50 }),
  images: json("images").$type<string[]>(),
  isPrivate: boolean("isPrivate").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Diary = typeof diaries.$inferSelect;
export type InsertDiary = typeof diaries.$inferInsert;

export const diaryComments = mysqlTable("diaryComments", {
  id: int("id").autoincrement().primaryKey(),
  diaryId: int("diaryId").notNull(),
  authorId: int("authorId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DiaryComment = typeof diaryComments.$inferSelect;
export type InsertDiaryComment = typeof diaryComments.$inferInsert;

// ==================== 纪念日管理 ====================

export const anniversaries = mysqlTable("anniversaries", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  date: timestamp("date").notNull(),
  isLunar: boolean("isLunar").default(false).notNull(),
  repeatType: mysqlEnum("repeatType", ["none", "yearly", "monthly"]).default("yearly").notNull(),
  reminderDays: int("reminderDays").default(3),
  emoji: varchar("emoji", { length: 10 }),
  bgImage: text("bgImage"), // 背景图片URL
  bgColor: varchar("bgColor", { length: 100 }), // 背景颜色或渐变
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Anniversary = typeof anniversaries.$inferSelect;
export type InsertAnniversary = typeof anniversaries.$inferInsert;

// ==================== 情侣任务 ====================

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  isPreset: boolean("isPreset").default(false).notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  completedBy: int("completedBy"),
  photoUrl: text("photoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ==================== 留言板 ====================

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// 每日情话
export const dailyQuotes = mysqlTable("dailyQuotes", {
  id: int("id").autoincrement().primaryKey(),
  content: text("content").notNull(),
  author: varchar("author", { length: 100 }),
  category: varchar("category", { length: 50 }),
});

export type DailyQuote = typeof dailyQuotes.$inferSelect;
export type InsertDailyQuote = typeof dailyQuotes.$inferInsert;

// ==================== 心情打卡 ====================

export const moodRecords = mysqlTable("moodRecords", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  userId: int("userId").notNull(),
  mood: mysqlEnum("mood", ["happy", "excited", "peaceful", "sad", "angry", "anxious", "tired", "loving"]).notNull(),
  note: text("note"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MoodRecord = typeof moodRecords.$inferSelect;
export type InsertMoodRecord = typeof moodRecords.$inferInsert;

// ==================== 愿望清单 ====================

export const wishes = mysqlTable("wishes", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  creatorId: int("creatorId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wish = typeof wishes.$inferSelect;
export type InsertWish = typeof wishes.$inferInsert;

// ==================== 时光胶囊 ====================

export const timeCapsules = mysqlTable("timeCapsules", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  senderId: int("senderId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  images: json("images").$type<string[]>(),
  openDate: timestamp("openDate").notNull(),
  isOpened: boolean("isOpened").default(false).notNull(),
  openedAt: timestamp("openedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TimeCapsule = typeof timeCapsules.$inferSelect;
export type InsertTimeCapsule = typeof timeCapsules.$inferInsert;

// ==================== 足迹地图 ====================

export const footprints = mysqlTable("footprints", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  creatorId: int("creatorId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  latitude: varchar("latitude", { length: 20 }).notNull(),
  longitude: varchar("longitude", { length: 20 }).notNull(),
  address: text("address"),
  photos: json("photos").$type<string[]>(),
  visitedAt: timestamp("visitedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Footprint = typeof footprints.$inferSelect;
export type InsertFootprint = typeof footprints.$inferInsert;

// ==================== 待办清单（电影/美食） ====================

export const todoLists = mysqlTable("todoLists", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  creatorId: int("creatorId").notNull(),
  type: mysqlEnum("type", ["movie", "restaurant", "music", "book", "other"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  rating: int("rating"),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TodoList = typeof todoLists.$inferSelect;
export type InsertTodoList = typeof todoLists.$inferInsert;

// ==================== 恋爱大事记（里程碑） ====================

export const milestones = mysqlTable("milestones", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  creatorId: int("creatorId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  emoji: varchar("emoji", { length: 10 }),
  eventDate: timestamp("eventDate").notNull(),
  category: varchar("category", { length: 50 }), // manual, diary, task, anniversary, footprint, wish
  relatedId: int("relatedId"), // 关联的记录ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = typeof milestones.$inferInsert;

// ==================== 成就系统 ====================

export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  key: varchar("key", { length: 100 }).notNull(), // 成就标识
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

// ==================== 一起做100件事 ====================

export const hundredThings = mysqlTable("hundredThings", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  year: int("year").notNull(), // 年份
  thingIndex: int("thingIndex").notNull(), // 事项序号 1-100
  title: varchar("title", { length: 200 }).notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  completedBy: int("completedBy"),
  note: text("note"), // 完成感想
  photoUrl: text("photoUrl"), // 打卡照片
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HundredThing = typeof hundredThings.$inferSelect;
export type InsertHundredThing = typeof hundredThings.$inferInsert;

// ==================== 恋爱账本 ====================

export const ledgerRecords = mysqlTable("ledgerRecords", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  creatorId: int("creatorId").notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  amount: varchar("amount", { length: 20 }).notNull(), // 金额（字符串存储避免精度问题）
  category: varchar("category", { length: 50 }).notNull(), // 分类
  description: text("description"),
  date: timestamp("date").notNull(),
  paidBy: mysqlEnum("paidBy", ["user1", "user2", "split", "together"]).default("together").notNull(), // 谁付的
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LedgerRecord = typeof ledgerRecords.$inferSelect;
export type InsertLedgerRecord = typeof ledgerRecords.$inferInsert;

// ==================== 情侣游戏 ====================

export const gameRecords = mysqlTable("gameRecords", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  gameType: varchar("gameType", { length: 50 }).notNull(), // truth_or_dare, questions, dice
  content: json("content").$type<Record<string, any>>(), // 游戏数据
  result: text("result"), // 游戏结果
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});  

export type GameRecord = typeof gameRecords.$inferSelect;
export type InsertGameRecord = typeof gameRecords.$inferInsert;
