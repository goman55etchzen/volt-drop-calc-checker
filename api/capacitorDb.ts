// api/capacitorDb.ts
import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. GET以外のメソッドをブロック
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // 2. 環境変数チェック
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is missing in environment variables.");
    return res.status(500).json({ error: "DATABASE_URL is not configured" });
  }

  try {
    const sql = neon(connectionString);

    // クエリパラメーターの取得
    const { voltage, poles, frequency, output_kw, motor_type } = req.query;

    // パラメータが指定されている場合は「条件検索・推奨選定モード」
    if (voltage && poles && frequency && output_kw) {
      const v = Number(voltage);
      const p = Number(poles);
      const f = Number(frequency);
      const kw = Number(output_kw);
      const mType = String(motor_type || "standard");

      // ① motor_selection_rules から 推奨μF (capacity_uf) を取得
      const rules = await sql`
        SELECT capacity_uf 
        FROM motor_selection_rules
        WHERE voltage_v = ${v}
          AND motor_type = ${mType}
          AND poles = ${p}
          AND frequency_hz = ${f}
          AND output_kw = ${kw}
        LIMIT 1
      `;

      // ルールにヒットしない場合
      if (rules.length === 0 || rules[0].capacity_uf === null) {
        return res.status(200).json({
          mode: "recommendation",
          target_capacity_uf: null,
          products: [],
          message: "条件に合致する推奨基準データが存在しません。",
        });
      }

      const targetUf = Number(rules[0].capacity_uf);

      // ② capacitors テーブルから製品を取得
      // 許容誤差範囲（±10%）を設定して検索
      const minUf = targetUf * 0.9;
      const maxUf = targetUf * 1.1;

      let products = await sql`
        SELECT 
          id AS group_id,
          manufacturer,
          rated_voltage_v AS voltage,
          capacity_uf,
          model AS model_name,
          dimension_a_mm AS width_mm,
          dimension_b_mm AS height_mm,
          dimension_c_mm AS depth_mm
        FROM capacitors
        WHERE rated_voltage_v = ${v}
          AND capacity_uf BETWEEN ${minUf} AND ${maxUf}
        ORDER BY ABS(capacity_uf - ${targetUf}) ASC, manufacturer ASC, model ASC
      `;

      // ③ ±10% 以内に完全一致・該当品がない場合、最も容量が近い上位5件を抽出（50μF以上の大型容量対策）
      if (products.length === 0) {
        products = await sql`
          SELECT 
            id AS group_id,
            manufacturer,
            rated_voltage_v AS voltage,
            capacity_uf,
            model AS model_name,
            dimension_a_mm AS width_mm,
            dimension_b_mm AS height_mm,
            dimension_c_mm AS depth_mm
          FROM capacitors
          WHERE rated_voltage_v = ${v}
          ORDER BY ABS(capacity_uf - ${targetUf}) ASC
          LIMIT 5
        `;
      }

      res.setHeader(
        "Cache-Control",
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      );

      return res.status(200).json({
        mode: "recommendation",
        target_capacity_uf: targetUf,
        products,
      });
    }

    // パラメータがない場合は従来の「全製品一覧取得モード」
    const products = await sql`
      SELECT 
        id AS group_id,
        manufacturer,
        rated_voltage_v AS voltage,
        capacity_uf,
        model AS model_name,
        dimension_a_mm AS width_mm,
        dimension_b_mm AS height_mm,
        dimension_c_mm AS depth_mm
      FROM capacitors
      ORDER BY capacity_uf ASC, rated_voltage_v ASC
    `;

    res.setHeader(
      "Cache-Control",
      "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    );

    return res.status(200).json({
      mode: "all",
      products,
    });
  } catch (error) {
    console.error("Database connection / query error:", error);
    return res.status(500).json({
      error: "Failed to fetch capacitor data from Neon DB",
      details:
        process.env.NODE_ENV === "development" ? String(error) : undefined,
    });
  }
}