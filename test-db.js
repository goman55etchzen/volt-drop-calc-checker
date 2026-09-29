import pkg from 'pg';
const { Client } = pkg;

// Neonの接続文字列を設定（SSLが必須です）
const connectionString = process.env.DATABASE_URL || 'YOUR_NEON_DATABASE_URL_HERE';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Neon DB への接続に成功しました！');

    // 簡易クエリ実行テスト
    const res = await client.query('SELECT NOW();');
    console.log('⏰ DB現在時刻:', res.rows[0].now);
  } catch (err) {
    console.error('❌ 接続エラー:', err.message);
  } finally {
    await client.end();
  }
}

testConnection();