# 数据库表结构差异分析

## 有差异的表

### tasks表
- 数据库缺少: `priority` (varchar(20)), `startTime` (timestamp), `deadline` (timestamp)

### moodRecords表  
- 数据库缺少: `images` (json)

### todoLists表
- 数据库enum: ('movie','restaurant','music','book','other')
- Schema enum: ('movie','tv','restaurant','music','book','travel','activity','other')
- 缺少: 'tv', 'travel', 'activity'
- 数据库缺少: `tags` (json)

## 匹配的表 ✅
wishes, countdowns, promises, periodRecords, menuItems, fitnessRecords, challenges,
hundredThings, anniversaries, diaries, messages, albums, photos, footprints,
timeCapsules, milestones, ledgerRecords, achievements, fitnessGoals, fitnessLikes,
fitnessComments, challengeProgress, challengeComments, orderHistory,
achievementDefinitions, userAchievementProgress
