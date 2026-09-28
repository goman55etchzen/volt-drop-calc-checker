// src/utils/capacitor.ts
import type { CapacitorProduct } from '@/types/capacitorMaster';
import { flattenCapacitorMaster } from '@/types/capacitorMaster';

export type { CapacitorProduct };

/**
 * DB(API)からコンデンサのマスターデータを取得しフラット化して返す
 */
export const fetchCapacitorCatalog = async (): Promise<CapacitorProduct[]> => {
  try {
    const res = await fetch('/api/capacitors');
    if (!res.ok) {
      console.error('コンデンサデータの取得に失敗しました:', res.statusText);
      return [];
    }
    const data = await res.json();

    let rawList: any[] = [];
    if (Array.isArray(data)) {
      rawList = data;
    } else if (data && Array.isArray(data.products)) {
      rawList = data.products;
    }

    if (rawList.length === 0) return [];

    // 既にフラット化されている構造（voltage または capacity_uf/uf が存在）の場合はそのまま返す
    if (rawList[0].voltage !== undefined || rawList[0].capacity_uf !== undefined || rawList[0].uf !== undefined) {
      return rawList as CapacitorProduct[];
    }

    // ネストされたマスタ構造（ProductMaster[]）の場合は flattenCapacitorMaster でフラット化
    if (typeof flattenCapacitorMaster === 'function') {
      return flattenCapacitorMaster(rawList);
    }

    return rawList as CapacitorProduct[];
  } catch (error) {
    console.error('コンデンサカタログの取得中にエラーが発生しました:', error);
    return [];
  }
};

/**
 * 共通の電圧マッチングロジック
 * （要求電圧に対して +10% までの定格電圧を持つ製品を許容する）
 */
const isVoltageMatch = (productVoltage: number, targetVoltage: number): boolean => {
  if (!productVoltage || !targetVoltage) return false;
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
  if (!catalog || !catalog.length || targetUf <= 0) return [];

  // 1. 電圧と周波数でフィルタリング（hz プロパティ未指定・null時は全周波数対応として受容）
  const filtered = catalog.filter((p) => {
    const voltOk = isVoltageMatch(p.voltage, targetVoltage);
    const hzOk = p.hz === undefined || p.hz === null || p.hz === targetHz;
    return voltOk && hzOk;
  });

  if (!filtered.length) return [];

  // 2. 目標静電容量(μF)に最も近い製品を探す (uf と capacity_uf の両プロパティ名・undefinedに対応)
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
  if (!catalog || !catalog.length || targetUf <= 0) return [];

  return catalog.filter((p) => {
    const voltMatch = isVoltageMatch(p.voltage, targetVoltage);
    const hzMatch = p.hz === undefined || p.hz === null || p.hz === targetHz;
    const curUf = p.uf ?? p.capacity_uf ?? 0;
    if (curUf <= 0) return false;

    const diffRatio = Math.abs(curUf - targetUf) / targetUf;
    const ufMatch = diffRatio <= tolerance;

    return voltMatch && hzMatch && ufMatch;
  });
};