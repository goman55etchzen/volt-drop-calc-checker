import { neon } from '@neondatabase/serverless';

// .env から読み込むか、テスト用に直接貼り付け
const databaseUrl = process.env.DATABASE_URL || 'postgresql://...';
const sql = neon(databaseUrl);

async function runTest() {
  console.log('🔄 データベースにクエリを送信中...');

  const voltage = 16; // テストしたい電圧値
  const frequency_hz = 50; // テストしたい周波数

  try {
    // 全件取得テスト
    console.log('--- 全件取得テスト ---');
    const allRows = await sql`
      SELECT model, manufacturer AS maker, capacity_uf AS uf, rated_voltage_v AS voltage, frequency_hz
      FROM capacitors
      ORDER BY rated_voltage_v ASC, capacity_uf ASC
    `;
    console.log('取得件数:', allRows.length);
    console.log('サンプルデータ:', allRows.slice(0, 2));

    // 条件付き検索テスト（動的クエリの動作確認）
    console.log('\n--- 条件付き検索テスト ---');
    const filteredRows = await sql`
      SELECT model, manufacturer AS maker, capacity_uf AS uf, rated_voltage_v AS voltage, frequency_hz
      FROM capacitors
      WHERE rated_voltage_v = ${voltage}
      ${frequency_hz ? sql`AND (frequency_hz = ${frequency_hz} OR frequency_hz IS NULL)` : sql``}
      ORDER BY capacity_uf ASC
    `;
    console.log(`voltage=${voltage} の検索結果件数:`, filteredRows.length);
    console.log(filteredRows);

    console.log('\n✅ 接続・クエリ実行ともに成功しました！');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

runTest();