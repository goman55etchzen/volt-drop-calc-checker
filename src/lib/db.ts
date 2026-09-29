// db.ts
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || "";
export const sql = databaseUrl ? neon(databaseUrl) : null;

/**
 * データベースからコンデンサ一覧データを取得
 */
export async function getCapacitorsFromDb(voltage?: number, frequency_hz?: number) {
  if (!sql) throw new Error("DATABASE_URL is not configured");

  try {
    if (voltage) {
      return await sql`
        SELECT 
          id,
          model,
          manufacturer AS maker,
          capacity_uf AS uf,
          rated_voltage_v AS voltage,
          frequency_hz,
          dimension_a_mm,
          dimension_b_mm,
          dimension_c_mm,
          status
        FROM capacitors
        WHERE rated_voltage_v = ${voltage}
        ${frequency_hz ? sql`AND (frequency_hz = ${frequency_hz} OR frequency_hz IS NULL)` : sql``}
        ORDER BY capacity_uf ASC
      `;
    }

    return await sql`
      SELECT 
        id,
        model,
        manufacturer AS maker,
        capacity_uf AS uf,
        rated_voltage_v AS voltage,
        frequency_hz,
        dimension_a_mm,
        dimension_b_mm,
        dimension_c_mm,
        status
      FROM capacitors
      ORDER BY rated_voltage_v ASC, capacity_uf ASC
    `;
  } catch (error) {
    console.error("Database fetch error:", error);
    throw error;
  }
}