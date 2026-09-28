// src/utils/capacitor.ts
import {
  type CapacitorProduct,
  type CapacitorApiResponse,
  mapDbProductToUi,
} from '@/types/capacitorMaster';

export type { CapacitorProduct };

/**
 * DB(API)からコンデンサのマスターデータを取得し、UI標準型(CapacitorProduct[])に変換して返す
 */
export const fetchCapacitorCatalog = async (): Promise<CapacitorProduct[]> => {
  try {
    const res = await fetch('/api/capacitorDb');
    if (!res.ok) {
      throw new Error(`Failed to fetch capacitor catalog: ${res.statusText}`);
    }
    const data: CapacitorApiResponse = await res.json();
    
    // APIレスポンス内の products 配列を UI 用の CapacitorProduct[] にマッピング
    if (data && Array.isArray(data.products)) {
      return data.products.map(mapDbProductToUi);
    }
    return [];
  } catch (error) {
    console.error('fetchCapacitorCatalog error:', error);
    return [];
  }
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

  // 1. 電圧と周波数でフィルタリング（hz プロパティ未指定時は全周波数対応として受容）
  const filtered = catalog.filter((p) => {
    const voltOk = isVoltageMatch(p.voltage, targetVoltage);
    const hzOk = p.hz === undefined || p.hz === targetHz;
    return voltOk && hzOk;
  });

  if (!filtered.length) return [];

  // 2. 目標静電容量(μF)に最も近い製品を探す
  let closest = filtered[0];
  let minDiff = Math.abs((closest.uf ?? closest.capacity_uf ?? 0) - targetUf);

  for (const p of filtered) {
    const curUf = p.uf ?? p.capacity_uf ?? 0;
    const diff = Math.abs(curUf - targetUf);
    if (diff < minDiff) {
      closest = p;
      minDiff = diff;
    }
  }

  // 3. 最も近い製品と同じ group_id を持つ製品群（他メーカー同等品）を返す
  const targetGroupId = closest.group_id;
  if (!targetGroupId) {
    return [closest];
  }

  return filtered.filter((p) => p.group_id === targetGroupId);
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
    const hzMatch = p.hz === undefined || p.hz === targetHz;
    const curUf = p.uf ?? p.capacity_uf ?? 0;
    const diffRatio = Math.abs(curUf - targetUf) / targetUf;
    const ufMatch = diffRatio <= tolerance;
    
    return voltMatch && hzMatch && ufMatch;
  });
};