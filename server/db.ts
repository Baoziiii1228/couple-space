import { eq, and, desc, asc, gte, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  couples, InsertCouple,
  albums, InsertAlbum,
  photos, InsertPhoto,
  diaries, InsertDiary,
  diaryComments, InsertDiaryComment,
  anniversaries, InsertAnniversary,
  tasks, InsertTask,
  messages, InsertMessage,
  dailyQuotes, InsertDailyQuote,
  moodRecords, InsertMoodRecord,
  wishes, InsertWish,
  timeCapsules, InsertTimeCapsule,
  footprints, InsertFootprint,
  todoLists, InsertTodoList,
  verificationCodes
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== 用户相关 ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "avatar"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== 情侣配对相关 ====================

export async function createCouple(data: InsertCouple) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(couples).values(data);
  return result[0].insertId;
}

export async function getCoupleByInviteCode(inviteCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(couples).where(eq(couples.inviteCode, inviteCode)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCoupleByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(couples)
    .where(and(
      or(eq(couples.user1Id, userId), eq(couples.user2Id, userId)),
      eq(couples.status, "paired")
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPendingCoupleByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(couples)
    .where(and(eq(couples.user1Id, userId), eq(couples.status, "pending")))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCouple(id: number, data: Partial<InsertCouple>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(couples).set(data).where(eq(couples.id, id));
}

// ==================== 相册相关 ====================

export async function createAlbum(data: InsertAlbum) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(albums).values(data);
  return result[0].insertId;
}

export async function getAlbumsByCoupleId(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(albums).where(eq(albums.coupleId, coupleId)).orderBy(desc(albums.createdAt));
}

export async function updateAlbum(id: number, data: Partial<InsertAlbum>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(albums).set(data).where(eq(albums.id, id));
}

export async function deleteAlbum(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(albums).where(eq(albums.id, id));
}

// ==================== 照片相关 ====================

export async function createPhoto(data: InsertPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(photos).values(data);
  return result[0].insertId;
}

export async function getPhotosByCoupleId(coupleId: number, albumId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(photos.coupleId, coupleId)];
  if (albumId) conditions.push(eq(photos.albumId, albumId));
  return await db.select().from(photos).where(and(...conditions)).orderBy(desc(photos.createdAt));
}

export async function deletePhoto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(photos).where(eq(photos.id, id));
}

// ==================== 日记相关 ====================

export async function createDiary(data: InsertDiary) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(diaries).values(data);
  return result[0].insertId;
}

export async function getDiariesByCoupleId(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(diaries).where(eq(diaries.coupleId, coupleId)).orderBy(desc(diaries.createdAt));
}

export async function getDiaryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(diaries).where(eq(diaries.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateDiary(id: number, data: Partial<InsertDiary>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(diaries).set(data).where(eq(diaries.id, id));
}

export async function deleteDiary(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(diaries).where(eq(diaries.id, id));
}

// ==================== 日记评论相关 ====================

export async function createDiaryComment(data: InsertDiaryComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(diaryComments).values(data);
  return result[0].insertId;
}

export async function getCommentsByDiaryId(diaryId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(diaryComments).where(eq(diaryComments.diaryId, diaryId)).orderBy(asc(diaryComments.createdAt));
}

// ==================== 纪念日相关 ====================

export async function createAnniversary(data: InsertAnniversary) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(anniversaries).values(data);
  return result[0].insertId;
}

export async function getAnniversariesByCoupleId(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(anniversaries).where(eq(anniversaries.coupleId, coupleId)).orderBy(asc(anniversaries.date));
}

export async function updateAnniversary(id: number, data: Partial<InsertAnniversary>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(anniversaries).set(data).where(eq(anniversaries.id, id));
}

export async function deleteAnniversary(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(anniversaries).where(eq(anniversaries.id, id));
}

// ==================== 任务相关 ====================

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(data);
  return result[0].insertId;
}

export async function getTasksByCoupleId(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tasks).where(eq(tasks.coupleId, coupleId)).orderBy(asc(tasks.isCompleted), desc(tasks.createdAt));
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(eq(tasks.id, id));
}

// ==================== 留言相关 ====================

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(data);
  return result[0].insertId;
}

export async function getMessagesByCoupleId(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(messages).where(eq(messages.coupleId, coupleId)).orderBy(desc(messages.createdAt));
}

export async function markMessageAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
}

// ==================== 每日情话相关 ====================

export async function getRandomQuote() {
  const db = await getDb();
  if (!db) return undefined;
  const allQuotes = await db.select().from(dailyQuotes);
  if (allQuotes.length === 0) return undefined;
  return allQuotes[Math.floor(Math.random() * allQuotes.length)];
}

export async function createQuote(data: InsertDailyQuote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dailyQuotes).values(data);
  return result[0].insertId;
}

// ==================== 心情打卡相关 ====================

export async function createMoodRecord(data: InsertMoodRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(moodRecords).values(data);
  return result[0].insertId;
}

export async function getMoodRecordsByCoupleId(coupleId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(moodRecords.coupleId, coupleId)];
  if (startDate) conditions.push(gte(moodRecords.date, startDate));
  if (endDate) conditions.push(lte(moodRecords.date, endDate));
  return await db.select().from(moodRecords).where(and(...conditions)).orderBy(desc(moodRecords.date));
}

export async function getTodayMoodByUserId(userId: number, coupleId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const result = await db.select().from(moodRecords)
    .where(and(
      eq(moodRecords.userId, userId),
      eq(moodRecords.coupleId, coupleId),
      gte(moodRecords.date, today),
      lte(moodRecords.date, tomorrow)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== 愿望清单相关 ====================

export async function createWish(data: InsertWish) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(wishes).values(data);
  return result[0].insertId;
}

export async function getWishesByCoupleId(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(wishes).where(eq(wishes.coupleId, coupleId)).orderBy(asc(wishes.isCompleted), desc(wishes.priority), desc(wishes.createdAt));
}

export async function updateWish(id: number, data: Partial<InsertWish>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(wishes).set(data).where(eq(wishes.id, id));
}

export async function deleteWish(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(wishes).where(eq(wishes.id, id));
}

// ==================== 时光胶囊相关 ====================

export async function createTimeCapsule(data: InsertTimeCapsule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(timeCapsules).values(data);
  return result[0].insertId;
}

export async function getTimeCapsulesByCoupleId(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(timeCapsules).where(eq(timeCapsules.coupleId, coupleId)).orderBy(asc(timeCapsules.openDate));
}

export async function getOpenableTimeCapsules(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return await db.select().from(timeCapsules)
    .where(and(
      eq(timeCapsules.coupleId, coupleId),
      eq(timeCapsules.isOpened, false),
      lte(timeCapsules.openDate, now)
    ))
    .orderBy(asc(timeCapsules.openDate));
}

export async function openTimeCapsule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(timeCapsules).set({ isOpened: true, openedAt: new Date() }).where(eq(timeCapsules.id, id));
}

// ==================== 足迹地图相关 ====================

export async function createFootprint(data: InsertFootprint) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(footprints).values(data);
  return result[0].insertId;
}

export async function getFootprintsByCoupleId(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(footprints).where(eq(footprints.coupleId, coupleId)).orderBy(desc(footprints.visitedAt));
}

export async function updateFootprint(id: number, data: Partial<InsertFootprint>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(footprints).set(data).where(eq(footprints.id, id));
}

export async function deleteFootprint(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(footprints).where(eq(footprints.id, id));
}

// ==================== 待办清单相关 ====================

export async function createTodoList(data: InsertTodoList) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(todoLists).values(data);
  return result[0].insertId;
}

export async function getTodoListsByCoupleId(coupleId: number, type?: "movie" | "restaurant" | "other") {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(todoLists.coupleId, coupleId)];
  if (type) conditions.push(eq(todoLists.type, type));
  return await db.select().from(todoLists).where(and(...conditions)).orderBy(asc(todoLists.isCompleted), desc(todoLists.createdAt));
}

export async function updateTodoList(id: number, data: Partial<InsertTodoList>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(todoLists).set(data).where(eq(todoLists.id, id));
}

export async function deleteTodoList(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(todoLists).where(eq(todoLists.id, id));
}

// ==================== 验证码相关 ====================

export async function createVerificationCode(email: string, code: string, type: "login" | "register" | "reset") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 使旧的验证码失效
  await db.update(verificationCodes)
    .set({ used: true })
    .where(and(eq(verificationCodes.email, email), eq(verificationCodes.used, false)));
  
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟过期
  await db.insert(verificationCodes).values({
    email,
    code,
    type,
    expiresAt,
  });
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const now = new Date();
  const result = await db.select().from(verificationCodes)
    .where(and(
      eq(verificationCodes.email, email),
      eq(verificationCodes.code, code),
      eq(verificationCodes.used, false),
      gte(verificationCodes.expiresAt, now)
    ))
    .limit(1);
  
  if (result.length === 0) return false;
  
  // 标记为已使用
  await db.update(verificationCodes)
    .set({ used: true })
    .where(eq(verificationCodes.id, result[0].id));
  
  return true;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserPassword(userId: number, hashedPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
}
