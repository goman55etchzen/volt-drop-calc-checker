// src/utils/capacitor.ts
import type {
  CapacitorProduct,
  CapacitorMasterDatabase,
} from "@/types/capacitorMaster";
import { flattenCapacitorMaster } from "@/types/capacitorMaster";

export type { CapacitorProduct, CapacitorDimensions } from "@/types/capacitorMaster";

/**
 * NeonDB (API) からコンデンサ製品マスターを取得する
 */
export async function fetchCapacitorCatalog(): Promise<CapacitorProduct[]> {
  try {
    // 変更: 静的ファイルではなく、VercelのAPIルートを叩く
    const response = await fetch("/api/capacitors");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const masterData = await response.json();
    
    // API側でJSONの階層をどう組んだかによりますが、
    // { products: [...] } で返している前提の処理です
    return flattenCapacitorMaster(masterData.products);
    
  } catch (error) {
    console.error("コンデンサカタログの取得に失敗しました:", error);
    return [];
  }
}

// ※ findClosestCapacitorGroup 等の関数はそのまま変更なしで動作します