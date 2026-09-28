// api/capacitorDb.ts
import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// capacitors テーブルの全属性を網羅した型定義
export interface CapacitorRecord {
  id: number;
  family: string | null;
  model: string;
  competitor_model: string | null;
  rated_voltage_v: number;
  phase: string;
  capacity_uf: number;
  current_50hz_a: number | null;
  current_60hz_a: number | null;
  kvar_50hz: number | null;
  kvar_60hz: number | null;
  dimension_a_mm: number | null;
  dimension_b_mm: number | null;
  dimension_c_mm: number | null;
  dimension_d_mm: number | null;
  dimension_e_mm: number | null;
  dimension_f_mm: number | null;
  mass_kg: number | null;
  source_file: string;
  manufacturer: string;
  product: string | null;
  page: string | null;
  type: string | null;
  circuit_voltage_v: number | null;
  frequency_hz: number | null;
  current_a: number | null;
  kvar: number | null;
  terminal_structure: string | null;
  l6_percent: string | null;
  single_phase_100v_usable: boolean | null;
  voltage_note: string | null;
  terminal_type: string | null;
  drawing_no: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is missing in environment variables.");
    return res.status(500).json({ error: "DATABASE_URL is not configured" });
  }

  try {
    const sql = neon(connectionString);
    const { voltage, poles, frequency, output_kw, motor_type } = req.query;

    // パラメータ指定時：条件検索・推奨選定モード
    if (voltage && poles && frequency && output_kw) {
      const v = Number(voltage);
      const p = Number(poles);
      const f = Number(frequency);
      const kw = Number(output_kw);
      const mType = String(motor_type || "standard");

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

      if (rules.length === 0 || rules[0].capacity_uf === null) {
        return res.status(200).json({
          mode: "recommendation",
          target_capacity_uf: null,
          products: [],
          message: "条件に合致する推奨基準データが存在しません。",
        });
      }

      const targetUf = Number(rules[0].capacity_uf);

      // ±10% の許容範囲で検索
      const minUf = targetUf * 0.9;
      const maxUf = targetUf * 1.1;

      let products = await sql<CapacitorRecord[]>`
        SELECT 
          id,
          family,
          model,
          competitor_model,
          rated_voltage_v,
          phase,
          capacity_uf,
          current_50hz_a,
          current_60hz_a,
          kvar_50hz,
          kvar_60hz,
          dimension_a_mm,
          dimension_b_mm,
          dimension_c_mm,
          dimension_d_mm,
          dimension_e_mm,
          dimension_f_mm,
          mass_kg,
          source_file,
          manufacturer,
          product,
          page,
          type,
          circuit_voltage_v,
          frequency_hz,
          current_a,
          kvar,
          terminal_structure,
          l6_percent,
          single_phase_100v_usable,
          voltage_note,
          terminal_type,
          drawing_no,
          status,
          created_at,
          updated_at
        FROM capacitors
        WHERE rated_voltage_v = ${v}
          AND capacity_uf BETWEEN ${minUf} AND ${maxUf}
        ORDER BY ABS(capacity_uf - ${targetUf}) ASC, manufacturer ASC, model ASC
      `;

      // 範囲内に該当品がない場合のフォールバック（上位5件）
      if (products.length === 0) {
        products = await sql<CapacitorRecord[]>`
          SELECT 
            id,
            family,
            model,
            competitor_model,
            rated_voltage_v,
            phase,
            capacity_uf,
            current_50hz_a,
            current_60hz_a,
            kvar_50hz,
            kvar_60hz,
            dimension_a_mm,
            dimension_b_mm,
            dimension_c_mm,
            dimension_d_mm,
            dimension_e_mm,
            dimension_f_mm,
            mass_kg,
            source_file,
            manufacturer,
            product,
            page,
            type,
            circuit_voltage_v,
            frequency_hz,
            current_a,
            kvar,
            terminal_structure,
            l6_percent,
            single_phase_100v_usable,
            voltage_note,
            terminal_type,
            drawing_no,
            status,
            created_at,
            updated_at
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

    // パラメータがない場合：全件取得モード
    const products = await sql<CapacitorRecord[]>`
      SELECT 
        id,
        family,
        model,
        competitor_model,
        rated_voltage_v,
        phase,
        capacity_uf,
        current_50hz_a,
        current_60hz_a,
        kvar_50hz,
        kvar_60hz,
        dimension_a_mm,
        dimension_b_mm,
        dimension_c_mm,
        dimension_d_mm,
        dimension_e_mm,
        dimension_f_mm,
        mass_kg,
        source_file,
        manufacturer,
        product,
        page,
        type,
        circuit_voltage_v,
        frequency_hz,
        current_a,
        kvar,
        terminal_structure,
        l6_percent,
        single_phase_100v_usable,
        voltage_note,
        terminal_type,
        drawing_no,
        status,
        created_at,
        updated_at
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