import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal } from "drizzle-orm/mysql-core";

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
  priority: varchar("priority", { length: 20 }).default("medium"),
  isPreset: boolean("isPreset").default(false).notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  completedBy: int("completedBy"),
  photoUrl: text("photoUrl"),
  startTime: timestamp("startTime"),
  deadline: timestamp("deadline"),
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
  images: json("images").$type<string[]>(),
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
  type: mysqlEnum("type", ["movie", "tv", "restaurant", "music", "book", "travel", "activity", "other"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  rating: int("rating"),
  tags: json("tags").$type<string[]>(),
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

// ==================== 倒计时 ====================

export const countdowns = mysqlTable("countdowns", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  userId: int("userId").notNull(),
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

// ==================== 承诺 ====================

export const promises = mysqlTable("promises", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  userId: int("userId").notNull(),
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

// ==================== 经期记录 ====================

export const periodRecords = mysqlTable("periodRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  cycleLength: int("cycleLength"), // 周期长度（天）
  periodLength: int("periodLength"), // 经期长度（天）
  symptoms: json("symptoms").$type<string[]>(), // 症状列表
  painLevel: int("painLevel"), // 痛经程度 1-5
  moodLevel: int("moodLevel"), // 情绪状态 1-5
  notes: text("notes"), // 备注
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PeriodRecord = typeof periodRecords.$inferSelect;
export type InsertPeriodRecord = typeof periodRecords.$inferInsert;

// ==================== 健身记录 ====================

export const fitnessRecords = mysqlTable("fitnessRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: timestamp("date").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }), // 体重（kg）
  exerciseType: varchar("exerciseType", { length: 50 }), // 运动类型
  duration: int("duration"), // 运动时长（分钟）
  calories: int("calories"), // 消耗卡路里
  notes: text("notes"), // 备注
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FitnessRecord = typeof fitnessRecords.$inferSelect;
export type InsertFitnessRecord = typeof fitnessRecords.$inferInsert;

// ==================== 健身目标 ====================

export const fitnessGoals = mysqlTable("fitnessGoals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetWeight: decimal("targetWeight", { precision: 5, scale: 2 }), // 目标体重
  startWeight: decimal("startWeight", { precision: 5, scale: 2 }), // 起始体重
  startDate: timestamp("startDate").notNull(),
  targetDate: timestamp("targetDate"), // 目标日期
  weeklyExerciseGoal: int("weeklyExerciseGoal"), // 每周运动目标（次数）
  isActive: boolean("isActive").default(true), // 是否激活
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FitnessGoal = typeof fitnessGoals.$inferSelect;
export type InsertFitnessGoal = typeof fitnessGoals.$inferInsert;

// ==================== 成就定义 ====================

export const achievementDefinitions = mysqlTable("achievementDefinitions", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 50 }).notNull(), // 大类：运动达人、体重管理等
  name: varchar("name", { length: 100 }).notNull(), // 成就名称
  description: text("description"), // 描述
  icon: varchar("icon", { length: 50 }), // 图标emoji
  tier1Target: int("tier1Target").notNull(), // 第一档目标
  tier2Target: int("tier2Target").notNull(), // 第二档目标
  tier3Target: int("tier3Target").notNull(), // 第三档目标
  tier1Reward: varchar("tier1Reward", { length: 100 }), // 第一档奖励
  tier2Reward: varchar("tier2Reward", { length: 100 }), // 第二档奖励
  tier3Reward: varchar("tier3Reward", { length: 100 }), // 第三档奖励
  type: varchar("type", { length: 50 }).notNull(), // 类型：用于计算进度
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AchievementDefinition = typeof achievementDefinitions.$inferSelect;
export type InsertAchievementDefinition = typeof achievementDefinitions.$inferInsert;

export const userAchievementProgress = mysqlTable("userAchievementProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: int("achievementId").notNull(),
  currentProgress: int("currentProgress").default(0).notNull(), // 当前进度
  tier: int("tier").default(0).notNull(), // 当前档次：0/1/2/3
  unlockedAt: timestamp("unlockedAt"), // 解锁时间
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserAchievementProgress = typeof userAchievementProgress.$inferSelect;
export type InsertUserAchievementProgress = typeof userAchievementProgress.$inferInsert;

// ==================== 点菜板 ====================

export const menuItems = mysqlTable("menuItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // 菜单所有者
  name: varchar("name", { length: 100 }).notNull(), // 菜品名称
  category: varchar("category", { length: 50 }), // 分类：中餐、西餐等
  rating: int("rating").default(3), // 喜爱程度1-5星
  imageUrl: text("imageUrl"), // 图片URL
  notes: text("notes"), // 备注
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

export const orderHistory = mysqlTable("orderHistory", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  orderedBy: int("orderedBy").notNull(), // 谁点的
  menuItemIds: json("menuItemIds").$type<number[]>(), // 点的菜品ID列表
  orderDate: timestamp("orderDate").notNull(),
  completed: boolean("completed").default(false), // 是否完成
  rating: int("rating"), // 评价1-5
  notes: text("notes"), // 备注
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderHistory = typeof orderHistory.$inferSelect;
export type InsertOrderHistory = typeof orderHistory.$inferInsert;

// ==================== 健身互相鼓励 ====================

export const fitnessLikes = mysqlTable("fitnessLikes", {
  id: int("id").autoincrement().primaryKey(),
  recordId: int("recordId").notNull(), // 健身记录ID
  userId: int("userId").notNull(), // 点赞人
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FitnessLike = typeof fitnessLikes.$inferSelect;
export type InsertFitnessLike = typeof fitnessLikes.$inferInsert;

export const fitnessComments = mysqlTable("fitnessComments", {
  id: int("id").autoincrement().primaryKey(),
  recordId: int("recordId").notNull(), // 健身记录ID
  userId: int("userId").notNull(), // 评论人
  content: text("content").notNull(), // 评论内容
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FitnessComment = typeof fitnessComments.$inferSelect;
export type InsertFitnessComment = typeof fitnessComments.$inferInsert;

// ==================== 情侣挑战 ====================

export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  createdBy: int("createdBy").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 挑战类型
  title: varchar("title", { length: 200 }).notNull(), // 标题
  description: text("description"), // 描述
  targetValue: int("targetValue").notNull(), // 目标值
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending/active/completed/failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

export const challengeProgress = mysqlTable("challengeProgress", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  userId: int("userId").notNull(),
  currentProgress: int("currentProgress").default(0).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
});

export type ChallengeProgress = typeof challengeProgress.$inferSelect;
export type InsertChallengeProgress = typeof challengeProgress.$inferInsert;
