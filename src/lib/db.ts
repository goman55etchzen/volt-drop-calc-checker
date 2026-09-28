// db.ts
import { neon } from "@neondatabase/serverless";

// 環境変数から接続クライアントを作成
const sql = neon(process.env.DATABASE_URL!);

/**
 * データベースからコンデンサ一覧データを取得する関数
 */
export async function getCapacitorsFromDb() {
  try {
    const data = await sql`
      SELECT 
        id,
        manufacturer,
        rated_voltage_v,
        capacity_uf,
        model,
        dimension_a_mm,
        dimension_b_mm,
        dimension_c_mm,
        status,
        created_at,
        updated_at
      FROM capacitors
      ORDER BY capacity_uf ASC, rated_voltage_v ASC
    `;
    return data;
  } catch (error) {
    console.error("Database fetch error:", error);
    throw error;
  }
}