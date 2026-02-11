// 数据统计相关函数
import * as db from "./db";

export interface DashboardStats {
  photosCount: number;
  diariesCount: number;
  messagesCount: number;
  wishesCount: number;
  tasksCount: number;
  completedTasksCount: number;
  moodRecordsCount: number;
  footprintsCount: number;
  todoListsCount: number;
  completedTodoListsCount: number;
  achievementsCount: number;
  unlockedAchievementsCount: number;
  hundredThingsCount: number;
  completedHundredThingsCount: number;
  ledgerRecordsCount: number;
  totalIncome: number;
  totalExpense: number;
  countdownsCount: number;
  promisesCount: number;
  completedPromisesCount: number;
  timeCapsulesCount: number;
  unlockedTimeCapsules: number;
}

export async function getDashboardStats(coupleId: number): Promise<DashboardStats> {
  // 获取所有统计数据
  const currentYear = new Date().getFullYear();
  const [
    photos,
    diaries,
    messages,
    wishes,
    tasks,
    moodRecords,
    footprints,
    todoLists,
    achievements,
    hundredThings,
    ledgerRecords,
    countdowns,
    promises,
    timeCapsules,
  ] = await Promise.all([
    db.getPhotosByCoupleId(coupleId),
    db.getDiariesByCoupleId(coupleId),
    db.getMessagesByCoupleId(coupleId),
    db.getWishesByCoupleId(coupleId),
    db.getTasksByCoupleId(coupleId),
    db.getMoodRecordsByCoupleId(coupleId),
    db.getFootprintsByCoupleId(coupleId),
    db.getTodoListsByCoupleId(coupleId),
    db.getAchievementsByCoupleId(coupleId),
    db.getHundredThingsByCoupleIdAndYear(coupleId, currentYear),
    db.getLedgerRecordsByCoupleId(coupleId),
    db.getCountdownsByCoupleId(coupleId),
    db.getPromisesByCoupleId(coupleId),
    db.getTimeCapsulesByCoupleId(coupleId),
  ]);

  // 计算统计数据
  const completedTasks = tasks.filter((t: any) => t.completed).length;
  const completedTodoLists = todoLists.filter((t: any) => t.completed).length;
  const unlockedAchievements = achievements.filter((a: any) => a.unlockedAt !== null).length;
  const completedHundredThings = hundredThings.filter((h: any) => h.completed).length;
  const completedPromises = promises.filter((p: any) => p.status === 'fulfilled').length;
  const unlockedTimeCapsules = timeCapsules.filter((tc: any) => {
    const unlockDate = new Date(tc.unlockDate);
    return unlockDate <= new Date();
  }).length;

  // 计算账本收支
  const totalIncome = ledgerRecords
    .filter((r: any) => r.type === 'income')
    .reduce((sum: number, r: any) => sum + Number(r.amount), 0);
  const totalExpense = ledgerRecords
    .filter((r: any) => r.type === 'expense')
    .reduce((sum: number, r: any) => sum + Number(r.amount), 0);

  return {
    photosCount: photos.length,
    diariesCount: diaries.length,
    messagesCount: messages.length,
    wishesCount: wishes.length,
    tasksCount: tasks.length,
    completedTasksCount: completedTasks,
    moodRecordsCount: moodRecords.length,
    footprintsCount: footprints.length,
    todoListsCount: todoLists.length,
    completedTodoListsCount: completedTodoLists,
    achievementsCount: achievements.length,
    unlockedAchievementsCount: unlockedAchievements,
    hundredThingsCount: hundredThings.length,
    completedHundredThingsCount: completedHundredThings,
    ledgerRecordsCount: ledgerRecords.length,
    totalIncome,
    totalExpense,
    countdownsCount: countdowns.length,
    promisesCount: promises.length,
    completedPromisesCount: completedPromises,
    timeCapsulesCount: timeCapsules.length,
    unlockedTimeCapsules,
  };
}
