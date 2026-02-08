import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

async function setupCoupleAccounts() {
  const dbUrl = process.env.DATABASE_URL;
  
  const connection = await mysql.createConnection(dbUrl);
  
  try {
    // 删除旧账号和配对关系
    await connection.execute('DELETE FROM users WHERE email IN (?, ?)', 
      ['yejunchao@1228.com', 'zoujiafei@0219.com']);
    
    // 使用 bcrypt 哈希密码
    const hashedPassword1 = await bcrypt.hash('147238yjc', 10);
    const hashedPassword2 = await bcrypt.hash('Feifei0219', 10);
    
    // 创建第一个账号
    const [result1] = await connection.execute(
      'INSERT INTO users (email, password, name, role, openId) VALUES (?, ?, ?, ?, ?)',
      ['yejunchao@1228.com', hashedPassword1, '开发者', 'user', 'dev-' + Date.now()]
    );
    
    const userId1 = result1.insertId;
    console.log('✅ 账号1创建成功，ID:', userId1);
    
    // 创建第二个账号
    const [result2] = await connection.execute(
      'INSERT INTO users (email, password, name, role, openId) VALUES (?, ?, ?, ?, ?)',
      ['zoujiafei@0219.com', hashedPassword2, '情侣', 'user', 'couple-' + Date.now()]
    );
    
    const userId2 = result2.insertId;
    console.log('✅ 账号2创建成功，ID:', userId2);
    
    // 创建配对关系（status 必须是 'paired'）
    const [coupleResult] = await connection.execute(
      'INSERT INTO couples (user1Id, user2Id, status, togetherDate) VALUES (?, ?, ?, ?)',
      [userId1, userId2, 'paired', new Date('2024-11-24')]
    );
    
    const coupleId = coupleResult.insertId;
    console.log('✅ 配对关系创建成功，ID:', coupleId, '，状态: paired');
    
    // 验证配对关系
    const [verify] = await connection.execute(
      'SELECT id, user1Id, user2Id, status FROM couples WHERE id = ?',
      [coupleId]
    );
    
    console.log('✅ 验证配对关系:', verify[0]);
    
    console.log('\n✅ 账号设置完成！');
    console.log('账号1邮箱: yejunchao@1228.com');
    console.log('账号1密码: 147238yjc');
    console.log('账号2邮箱: zoujiafei@0219.com');
    console.log('账号2密码: Feifei0219');
    console.log('纪念日: 2024年11月24日');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await connection.end();
  }
}

setupCoupleAccounts();
