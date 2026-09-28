// src/types/capacitorMaster.ts

/**
 * データベース メタデータ
 */
export interface MasterMetadata {
  title: string;
  filename: string;
  version: string;
  updated_at: string;
  description: string;
}

/**
 * 許容最高電圧規定
 */
export interface MaxAllowableVoltage {
  "1.10_times": string;
  "1.15_times": string;
  "1.20_times": string;
  "1.30_times": string;
  note: string;
}

/**
 * 共通仕様
 */
export interface CommonSpecifications {
  standard: string;
  rated_voltage_v: number;
  rated_frequency_hz: number[];
  installation_place: string;
  ambient_temperature: string;
  max_allowable_voltage: MaxAllowableVoltage;
  max_allowable_current: string;
  capacity_tolerance: string;
  loss_factor: string;
  withstand_voltage: string;
  discharge_device: string;
  protective_mechanism: string;
}

/**
 * 周波数別 定格詳細
 */
export interface RatingDetail {
  frequency_hz: 50 | 60;
  current_a: number;
  kvar: number;
}

/**
 * 相別バリエーション（引出端子付・DINレール・配電盤内取付用など）
 */
export interface PhaseVariant {
  phase: "単相" | "三相";
  model?: string;
  ratings: RatingDetail[];
}

/**
 * 外形寸法 (mm)
 */
export interface DimensionsMM {
  A?: number;
  B?: number;
  C?: number;
  D?: number;
  E?: number;
  W?: number;
  H?: number;
}

/**
 * 製品マスタ単体データ（Raw）
 */
export interface ProductMaster {
  manufacturer: string;
  product_series: string;
  model: string;
  competitor_model?: string;
  drawing_no?: string;
  mounting_type?: string;
  rated_voltage_v: number;
  capacity_uf: number;
  phase?: "単相" | "三相";
  ratings?: RatingDetail[];
  phase_variants?: PhaseVariant[];
  dimensions_mm?: DimensionsMM;
  mass_kg?: number;
  status: string;
}

/**
 * 電動機選定表 - 出力仕様
 */
export interface MotorOutputSpec {
  hp: string;
  kw: number;
}

/**
 * 極数別 推奨容量マップ
 */
export interface PolesCapacityMap {
  [pole: string]: {
    "50hz": (number | null)[];
    "60hz": (number | null)[];
  };
}

/**
 * 電動機選定表 - 200V 三相
 */
export interface MotorSelection200V3P {
  outputs: MotorOutputSpec[];
  recommended_capacities_uf: PolesCapacityMap;
}

/**
 * 電動機選定表 - 200V 単相
 */
export interface MotorSelection200V1P {
  recommended_capacities_uf: {
    "50hz": (number | null)[];
    "60hz": (number | null)[];
  };
}

/**
 * 電動機選定表 - 400V 三相
 */
export interface MotorSelection400V3P {
  outputs: MotorOutputSpec[];
  recommended_capacities_uf: PolesCapacityMap;
}

/**
 * 電動機選定表（全体）
 */
export interface MotorSelectionTable {
  voltage_200v_3phase: MotorSelection200V3P;
  voltage_200v_single_phase: MotorSelection200V1P;
  voltage_400v_3phase: MotorSelection400V3P;
}

/**
 * 溶接機選定表 項目
 */
export interface WelderSelectionItem {
  max_input_kva: string;
  capacity_uf: number;
}

/**
 * 力率改善表 サンプルデータ
 */
export interface PowerFactorSampleData {
  initial_cos_theta_1: number;
  ratios: (number | null)[];
}

/**
 * 力率改善表（全体）
 */
export interface PowerFactorImprovementTable {
  unit: string;
  target_cos_theta_2: number[];
  sample_data: PowerFactorSampleData[];
}

/**
 * 低圧進相コンデンサ 統合マスターデータベース型（全体）
 */
export interface CapacitorMasterDatabase {
  metadata: MasterMetadata;
  common_specifications: CommonSpecifications;
  products: ProductMaster[];
  motor_selection_table: MotorSelectionTable;
  welder_selection_table: WelderSelectionItem[];
  power_factor_improvement_table: PowerFactorImprovementTable;
}

// =================================================================
// 既存アプリUIコンポーネントおよび検索ロジックとの完全統合モデル
// =================================================================

export interface CapacitorDimensions {
  w: number;
  d: number;
  h: number;
}

/**
 * アプリ共通の統合 CapacitorProduct 型定義
 */
export interface CapacitorProduct {
  id: string;
  group_id: string;

  // マスタDB・旧UI互換プロパティ
  mfr: string;
  part_number: string;
  capacity_uf: number;
  kvar_50hz: number;
  kvar_60hz: number;
  current_50hz: number;
  current_60hz: number;

  // 検索・選定ロジック（capacitor.ts / useCapacitor.ts）互換プロパティ
  maker: string;
  model: string;
  uf: number;
  voltage: number;
  hz?: number;
  kvar?: number;
  price?: number;

  phase: string;
  dimensions: CapacitorDimensions;
  terminal: string;
  mount: string;
  weight_kg: number;
  status?: string;
}

/** Neon DB (capacitors テーブル / APIレスポンス) の生データ構造[cite: 51] */
export interface DbCapacitorProduct {
  id?: string | number;
  group_id?: string;
  manufacturer: string;
  voltage: number;
  capacity_uf: number;
  model_name: string;
  width_mm?: number;
  height_mm?: number;
  depth_mm?: number;
}

/** API レスポンスの型定義[cite: 51] */
export interface CapacitorApiResponse {
  mode: "recommendation" | "all";
  target_capacity_uf?: number | null;
  products: DbCapacitorProduct[];
  message?: string;
  error?: string;
}

/**
 * DBモデル(DbCapacitorProduct)から アプリ標準(CapacitorProduct) への変換ヘルパー[cite: 51]
 */
export function mapDbProductToUi(dbItem: DbCapacitorProduct): CapacitorProduct {
  const modelName = dbItem.model_name || "UNKNOWN";
  const mfr = dbItem.manufacturer || "UNKNOWN";
  const uf = Number(dbItem.capacity_uf) || 0;
  const volt = Number(dbItem.voltage) || 200;

  return {
    id: String(dbItem.id || `${modelName}_3P`),
    group_id: dbItem.group_id || `${volt}V_${uf}uF`,
    mfr: mfr,
    maker: mfr,
    part_number: modelName,
    model: modelName,
    phase: "三相",
    voltage: volt,
    capacity_uf: uf,
    uf: uf,
    kvar_50hz: 0,
    kvar_60hz: 0,
    current_50hz: 0,
    current_60hz: 0,
    dimensions: {
      w: dbItem.width_mm ?? 0,
      d: dbItem.depth_mm ?? 0,
      h: dbItem.height_mm ?? 0,
    },
    terminal: "",
    mount: "",
    weight_kg: 0,
  };
}

/**
 * Master Database の products 配列をアプリ標準の CapacitorProduct[] に変換・正規化するアダプター関数[cite: 51]
 */
export function flattenCapacitorMaster(
  products: ProductMaster[],
): CapacitorProduct[] {
  const result: CapacitorProduct[] = [];

  for (const p of products) {
    const dims = p.dimensions_mm || {};
    const dimensions: CapacitorDimensions = {
      w: dims.A ?? dims.W ?? 0,
      d: dims.B ?? 0,
      h: dims.C ?? dims.H ?? 0,
    };
    const mountType = p.mounting_type || "";

    if (p.phase && p.ratings) {
      const r50 = p.ratings.find((r) => r.frequency_hz === 50);
      const r60 = p.ratings.find((r) => r.frequency_hz === 60);

      result.push({
        id: `${p.model}_${p.phase}`,
        group_id: `${p.rated_voltage_v}V_${p.capacity_uf}uF`,
        mfr: p.manufacturer,
        maker: p.manufacturer,
        part_number: p.model,
        model: p.model,
        phase: p.phase,
        voltage: p.rated_voltage_v,
        capacity_uf: p.capacity_uf,
        uf: p.capacity_uf,
        kvar_50hz: r50?.kvar ?? 0,
        kvar_60hz: r60?.kvar ?? 0,
        current_50hz: r50?.current_a ?? 0,
        current_60hz: r60?.current_a ?? 0,
        dimensions,
        terminal: mountType,
        mount: mountType,
        weight_kg: p.mass_kg ?? 0,
        status: p.status,
      });
    } else if (p.phase_variants) {
      for (const variant of p.phase_variants) {
        const variantModel = variant.model || p.model;
        const r50 = variant.ratings.find((r) => r.frequency_hz === 50);
        const r60 = variant.ratings.find((r) => r.frequency_hz === 60);

        result.push({
          id: `${variantModel}_${variant.phase}`,
          group_id: `${p.rated_voltage_v}V_${p.capacity_uf}uF`,
          mfr: p.manufacturer,
          maker: p.manufacturer,
          part_number: variantModel,
          model: variantModel,
          phase: variant.phase,
          voltage: p.rated_voltage_v,
          capacity_uf: p.capacity_uf,
          uf: p.capacity_uf,
          kvar_50hz: r50?.kvar ?? 0,
          kvar_60hz: r60?.kvar ?? 0,
          current_50hz: r50?.current_a ?? 0,
          current_60hz: r60?.current_a ?? 0,
          dimensions,
          terminal: mountType,
          mount: mountType,
          weight_kg: p.mass_kg ?? 0,
          status: p.status,
        });
      }
    }
  }

  return result;
}