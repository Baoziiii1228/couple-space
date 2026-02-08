import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

async function createCoupleAccount() {
  const dbUrl = process.env.DATABASE_URL;
  
  const connection = await mysql.createConnection(dbUrl);
  
  try {
    // 获取开发者账号的 ID 和 coupleId
    const [devUsers] = await connection.execute(
      'SELECT id, coupleId FROM users WHERE email = ?',
      ['yejunchao@1228.com']
    );
    
    if (devUsers.length === 0) {
      console.error('❌ 错误：找不到开发者账号');
      return;
    }
    
    const devUserId = devUsers[0].id;
    const coupleId = devUsers[0].coupleId;
    
    console.log('✅ 找到开发者账号，ID:', devUserId, '，coupleId:', coupleId);
    
    // 删除旧账号（如果存在）
    await connection.execute('DELETE FROM users WHERE email = ?', ['zoujiafei@0219.com']);
    
    // 使用 bcrypt 哈希密码
    const hashedPassword = await bcrypt.hash('Feifei0219', 10);
    
    // 创建情侣账号
    const [result] = await connection.execute(
      'INSERT INTO users (email, password, name, role, openId, coupleId) VALUES (?, ?, ?, ?, ?, ?)',
      ['zoujiafei@0219.com', hashedPassword, '情侣', 'user', 'couple-' + Date.now(), coupleId]
    );
    
    const coupleUserId = result.insertId;
    console.log('✅ 情侣账号创建成功，ID:', coupleUserId);
    
    // 更新配对关系，将 user2Id 设置为新账号
    await connection.execute(
      'UPDATE couples SET user2Id = ? WHERE id = ?',
      [coupleUserId, coupleId]
    );
    
    console.log('✅ 配对关系已更新');
    
    // 更新纪念日
    await connection.execute(
      'UPDATE couples SET togetherDate = ? WHERE id = ?',
      [new Date('2024-11-24'), coupleId]
    );
    
    console.log('\n✅ 情侣账号创建完成！');
    console.log('开发者邮箱: yejunchao@1228.com');
    console.log('开发者密码: 147238yjc');
    console.log('情侣邮箱: zoujiafei@0219.com');
    console.log('情侣密码: Feifei0219');
    console.log('纪念日: 2024年11月24日');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await connection.end();
  }
}

createCoupleAccount();
