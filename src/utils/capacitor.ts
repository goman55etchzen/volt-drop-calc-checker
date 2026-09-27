// utils/capacitor.ts
import type {
  CapacitorProduct,
  CapacitorMasterDatabase,
} from "@/types/capacitorMaster";
import { flattenCapacitorMaster } from "@/types/capacitorMaster";

export type { CapacitorProduct, CapacitorDimensions } from "@/types/capacitorMaster";

/**
 * public/data/capacitor_master.json からコンデンサ製品マスターを取得し、フラットなデータ構造に変換して返す
 */
export async function fetchCapacitorCatalog(): Promise<CapacitorProduct[]> {
  try {
    // 改修: パスを /data/capacitor_master.json に修正
    const response = await fetch("/data/capacitor_master.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const masterData: CapacitorMasterDatabase = await response.json();
    return flattenCapacitorMaster(masterData.products);
  } catch (error) {
    console.error("コンデンサカタログの取得に失敗しました:", error);
    return [];
  }
}

/**
 * 電圧・周波数・目標静電容量(μF)から最も適合する製品群(group_id)を抽出する
 */
export function findClosestCapacitorGroup(
  products: CapacitorProduct[],
  targetVoltage: number,
  frequency: number,
  targetUf: number | null | undefined
): CapacitorProduct[] {
  if (!targetUf || targetUf <= 0 || products.length === 0) {
    return [];
  }

  // 改修: 電圧のフィルタリングを範囲許容（ターゲット電圧以上〜 +10% 程度）に変更
  // 理由: マスタデータ上の定格電圧が 210V や 220V の場合でも、200V系として抽出できるようにするため
  const voltMatched = products.filter((p) => {
    return p.voltage >= targetVoltage && p.voltage <= targetVoltage * 1.1;
  });
  
  if (voltMatched.length === 0) return [];

  // 2. 目標μFに最も近い製品(group_id)を特定
  const closestProduct = voltMatched.reduce((prev, curr) => {
    const prevDiff = Math.abs(prev.capacity_uf - targetUf);
    const currDiff = Math.abs(curr.capacity_uf - targetUf);
    return currDiff < prevDiff ? curr : prev;
  });

  // 3. 同一 group_id の全メーカー品を抽出
  return voltMatched.filter((p) => p.group_id === closestProduct.group_id);
}