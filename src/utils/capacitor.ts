// capacitor.ts

export interface CapacitorProduct {
  maker: string;
  model: string;
  group_id: string;
  voltage: number;
  hz: number;
  uf: number;
  kvar: number;
  price?: number;
}

/**
 * DB(API)からコンデンサのマスターデータを取得しフラット化して返す
 */
export const fetchCapacitorCatalog = async (): Promise<CapacitorProduct[]> => {
  const res = await fetch('/api/capacitors');
  const data = await res.json();
  // 必要なフラット化処理などをここに記述
  return data;
};

/**
 * 共通の電圧マッチングロジック
 * （要求電圧に対して +10% までの定格電圧を持つ製品を許容する）
 */
const isVoltageMatch = (productVoltage: number, targetVoltage: number): boolean => {
  return productVoltage >= targetVoltage && productVoltage <= targetVoltage * 1.1;
};

/**
 * 目標値に最も近い推奨コンデンサ（同等品のグループ）を抽出
 */
export const findClosestCapacitorGroup = (
  catalog: CapacitorProduct[],
  targetVoltage: number,
  targetHz: number,
  targetUf: number
): CapacitorProduct[] => {
  if (!catalog.length || targetUf <= 0) return [];

  // 1. 電圧と周波数でフィルタリング
  const filtered = catalog.filter((p) => isVoltageMatch(p.voltage, targetVoltage) && p.hz === targetHz);

  if (!filtered.length) return [];

  // 2. 目標静電容量(μF)に最も近い製品を探す
  let closest = filtered[0];
  let minDiff = Math.abs(closest.uf - targetUf);

  for (const p of filtered) {
    const diff = Math.abs(p.uf - targetUf);
    if (diff < minDiff) {
      closest = p;
      minDiff = diff;
    }
  }

  // 3. 最も近い製品と同じ group_id を持つ製品群（他メーカー同等品）を返す
  return filtered.filter((p) => p.group_id === closest.group_id);
};

/**
 * その他の適応製品候補を抽出（デフォルトで目標μFの ±35% 以内）
 */
export const findCandidateCapacitors = (
  catalog: CapacitorProduct[],
  targetVoltage: number,
  targetHz: number,
  targetUf: number,
  tolerance: number = 0.35
): CapacitorProduct[] => {
  if (!catalog.length || targetUf <= 0) return [];

  return catalog.filter((p) => {
    const voltMatch = isVoltageMatch(p.voltage, targetVoltage);
    const hzMatch = p.hz === targetHz;
    const diffRatio = Math.abs(p.uf - targetUf) / targetUf;
    const ufMatch = diffRatio <= tolerance;
    
    return voltMatch && hzMatch && ufMatch;
  });
};