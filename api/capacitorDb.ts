// api/capacitorDb.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCapacitorsFromDb, sql } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // データベース接続設定のチェック
  if (!sql) {
    return res.status(500).json({ error: 'DATABASE_URL is not configured' });
  }

  try {
    // クエリパラメータの取得と数値変換（無効値の場合は undefined）
    const voltageQuery = req.query.voltage;
    const hzQuery = req.query.frequency_hz || req.query.hz;

    const voltage = voltageQuery && !isNaN(Number(voltageQuery)) ? Number(voltageQuery) : undefined;
    const frequency_hz = hzQuery && !isNaN(Number(hzQuery)) ? Number(hzQuery) : undefined;

    // lib/db.ts の関数を呼び出してデータ取得
    const capacitors = await getCapacitorsFromDb(voltage, frequency_hz);

    return res.status(200).json(capacitors);
  } catch (error) {
    console.error('Error fetching capacitors in api/capacitorDb:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch capacitor data from database',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}