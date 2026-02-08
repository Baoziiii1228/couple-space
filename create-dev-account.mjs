import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

async function createDevAccount() {
  const dbUrl = process.env.DATABASE_URL;
  
  const connection = await mysql.createConnection(dbUrl);
  
  try {
    // 先删除旧账号（如果存在）
    await connection.execute('DELETE FROM users WHERE email IN (?, ?)', 
      ['yejunchao@1228.com', 'partner@1228.com']);
    
    // 使用 bcrypt 哈希密码
    const hashedPassword = await bcrypt.hash('147238yjc', 10);
    
    // 创建开发者账号
    const [result1] = await connection.execute(
      'INSERT INTO users (email, password, name, role, openId) VALUES (?, ?, ?, ?, ?)',
      ['yejunchao@1228.com', hashedPassword, '开发者', 'user', 'dev-' + Date.now()]
    );
    
    const userId1 = result1.insertId;
    console.log('✅ 开发者账号创建成功，ID:', userId1);
    
    // 创建伴侣账号
    const [result2] = await connection.execute(
      'INSERT INTO users (email, password, name, role, openId) VALUES (?, ?, ?, ?, ?)',
      ['partner@1228.com', hashedPassword, '伴侣', 'user', 'partner-' + Date.now()]
    );
    
    const userId2 = result2.insertId;
    console.log('✅ 伴侣账号创建成功，ID:', userId2);
    
    // 创建配对关系
    const [coupleResult] = await connection.execute(
      'INSERT INTO couples (user1Id, user2Id, status, togetherDate) VALUES (?, ?, ?, ?)',
      [userId1, userId2, 'paired', new Date('2024-01-01')]
    );
    
    const coupleId = coupleResult.insertId;
    console.log('✅ 配对关系创建成功，ID:', coupleId);
    
    // 更新两个用户的 coupleId
    await connection.execute('UPDATE users SET coupleId = ? WHERE id = ?', [coupleId, userId1]);
    await connection.execute('UPDATE users SET coupleId = ? WHERE id = ?', [coupleId, userId2]);
    
    console.log('\n✅ 开发者账号创建完成！');
    console.log('开发者邮箱: yejunchao@1228.com');
    console.log('开发者密码: 147238yjc');
    console.log('伴侣邮箱: partner@1228.com');
    console.log('伴侣密码: 147238yjc');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await connection.end();
  }
}

createDevAccount();
