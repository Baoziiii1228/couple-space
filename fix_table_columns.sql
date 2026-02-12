-- ============================================
-- 修复数据库表结构差异
-- 日期: 2026-02-12
-- 问题: 数据库表缺少schema中定义的字段，导致功能无法创建
-- ============================================

-- 1. tasks表: 添加缺失的 priority, startTime, deadline 字段
ALTER TABLE tasks ADD COLUMN priority varchar(20) DEFAULT 'medium' AFTER category;
ALTER TABLE tasks ADD COLUMN startTime timestamp NULL AFTER photoUrl;
ALTER TABLE tasks ADD COLUMN deadline timestamp NULL AFTER startTime;

-- 2. moodRecords表: 添加缺失的 images 字段
ALTER TABLE moodRecords ADD COLUMN images json NULL AFTER note;

-- 3. todoLists表: 扩展type enum添加缺失的值，添加tags字段
ALTER TABLE todoLists MODIFY COLUMN type enum('movie','tv','restaurant','music','book','travel','activity','other') NOT NULL;
ALTER TABLE todoLists ADD COLUMN tags json NULL AFTER rating;
