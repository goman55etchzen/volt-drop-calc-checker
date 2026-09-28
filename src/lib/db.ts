import { neon } from '@neondatabase/serverless';

// 環境変数から接続クライアントを作成
const sql = neon(process.env.DATABASE_URL!);

// データベースからデータ一覧を取得する関数例
export async function getCapacitorsFromDb() {
  try {
    // クエリを実行してデータを取得
    const data = await sql`SELECT * FROM capacitors`;
    return data;
  } catch (error) {
    console.error('Database fetch error:', error);
    throw error;
  }
}