import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCapacitorsFromDb, sql } from '../lib/db';

/**
 * クエリパラメータから単一の数値を安全に取得するヘルパー関数
 * @param param - VercelRequest のクエリパラメータ
 * @returns 変換された数値、または無効な場合は undefined
 */
const parseQueryNumber = (param: string | string[] | undefined): number | undefined => {
  if (!param) return undefined;
  
  // 同一キーで複数の値が渡された場合は最初の要素を採用する
  const valueStr = Array.isArray(param) ? param[0] : param;
  const num = Number(valueStr);
  
  return isNaN(num) ? undefined : num;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. HTTPメソッドのチェック (GETリクエストのみ許可)
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // 2. データベース接続設定のチェック
  if (!sql) {
    console.error('[API Error] DATABASE_URL is not configured');
    return res.status(500).json({ error: 'Internal Server Error: Database configuration missing' });
  }

  try {
    // 3. パラメータの安全な抽出とキャスト
    const voltage = parseQueryNumber(req.query.voltage);
    const frequencyHz = parseQueryNumber(req.query.frequency_hz) ?? parseQueryNumber(req.query.hz);

    // 4. データベースからコンデンサ情報を取得
    const capacitors = await getCapacitorsFromDb(voltage, frequencyHz);

    // 5. キャッシュ制御の追加 (エッジCDNで60秒、ブラウザで10秒キャッシュ)
    // 頻繁に更新されないデータであれば、これでDB負荷を劇的に下げられます
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    // 6. 正常レスポンス
    return res.status(200).json(capacitors);

  } catch (error) {
    // サーバーログへのエラー出力
    console.error('[API Error] api/capacitorDb:', error);
    
    // クライアントへのエラーレスポンス
    // セキュリティ対策として、本番環境では詳細なエラーメッセージを隠蔽する
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    return res.status(500).json({ 
      error: 'Failed to fetch capacitor data from database',
      details: isDevelopment ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
}