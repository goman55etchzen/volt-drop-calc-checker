// api/capacitors.ts
import { neon } from '@neondatabase/serverless';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 環境変数から接続文字列を取得
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' });
  }

  try {
    const sql = neon(connectionString);
    
    // capacitorsテーブルから全件取得 (必要に応じてORDER BY等を指定)
    const products = await sql`
      SELECT 
        group_id, manufacturer, voltage, capacity_uf, 
        model_name, width_mm, height_mm, depth_mm 
      FROM capacitors
      ORDER BY capacity_uf ASC
    `;

    // 既存の capacitor_master.json の構造に合わせてラップして返す
    res.status(200).json({ products });

  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Failed to fetch capacitor data' });
  }
}