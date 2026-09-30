// db.ts
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || "";
export const sql = databaseUrl ? neon(databaseUrl) : null;

/**
 * データベースからコンデンサ一覧データを取得
 * @param voltage 定格電圧 (V) - 要求電圧以上〜+10%までの範囲で検索します
 * @param frequency_hz 周波数 (Hz) - 指定周波数または兼用(NULL)を検索します
 */
export async function getCapacitorsFromDb(
  voltage?: number,
  frequency_hz?: number,
) {
  if (!sql) throw new Error("DATABASE_URL is not configured");

  try {
    // 要求電圧に対し +10% 許容上限値を計算
    const maxVoltage = voltage ? voltage * 1.1 : undefined;

    return await sql`
      SELECT 
        id::text AS id,
        model,
        manufacturer AS maker,
        manufacturer,
        capacity_uf::float AS uf,
        capacity_uf::float AS capacity_uf,
        rated_voltage_v::float AS voltage,
        rated_voltage_v::float AS rated_voltage_v,
        frequency_hz::float AS frequency_hz,
        frequency_hz::float AS hz,
        dimension_a_mm::float AS dimension_a_mm,
        dimension_b_mm::float AS dimension_b_mm,
        dimension_c_mm::float AS dimension_c_mm,
        status
      FROM capacitors
      WHERE 1=1
      ${voltage ? sql`AND rated_voltage_v >= ${voltage} AND rated_voltage_v <=${maxVoltage}` : sql``}
      ${frequency_hz ? sql`AND (frequency_hz = ${frequency_hz} OR frequency_hz IS NULL)` : sql``}
      ORDER BY rated_voltage_v ASC, capacity_uf ASC
    `;
  } catch (error) {
    console.error("Database fetch error:", error);
    throw error;
  }
}