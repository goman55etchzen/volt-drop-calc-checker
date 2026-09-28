// api/capacitors.ts
import { neon } from '@neondatabase/serverless';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 1. GET以外のメソッドをブロック
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // 2. 環境変数チェック
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is missing in environment variables.');
    return res.status(500).json({ error: 'DATABASE_URL is not configured' });
  }

  try {
    const sql = neon(connectionString);

    // 3. capacitorsテーブルからデータを取得
    const products = await sql`
      SELECT 
        group_id,
        manufacturer,
        voltage,
        capacity_uf,
        model_name,
        width_mm,
        height_mm,
        depth_mm
      FROM capacitors
      ORDER BY capacity_uf ASC
    `;

    // 4. Vercel エッジキャッシュヘッダーの付与（1時間キャッシュ / DB負荷軽減）
    res.setHeader(
      'Cache-Control',
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    );

    // 5. { products: [...] } 形式で返却
    return res.status(200).json({ products });

  } catch (error) {
    console.error('Database connection / query error:', error);
    return res.status(500).json({
      error: 'Failed to fetch capacitor data from Neon DB',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}