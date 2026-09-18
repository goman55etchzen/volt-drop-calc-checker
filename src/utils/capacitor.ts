// utils/capacitor.ts

export interface CapacitorDimensions {
    w: number;
    d: number;
    h: number;
  }
  
  export interface CapacitorProduct {
    id: string;
    group_id: string;
    mfr: string;
    part_number: string;
    phase: string;
    voltage: number;
    capacity_uf: number;
    kvar_50hz: number;
    kvar_60hz: number;
    current_50hz: number;
    current_60hz: number;
    dimensions: CapacitorDimensions;
    terminal: string;
    mount: string;
    weight_kg: number;
  }
  
  /**
   * public/capacitor.json からコンデンサ製品マスターを取得する
   */
  export async function fetchCapacitorCatalog(): Promise<CapacitorProduct[]> {
    try {
      const response = await fetch('/capacitor.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('コンデンサカタログの取得に失敗しました:', error);
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
  
    // 1. 電圧が一致する製品をフィルタリング
    const voltMatched = products.filter((p) => p.voltage === targetVoltage);
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