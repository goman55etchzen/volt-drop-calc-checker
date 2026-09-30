// src/base/capacitorBase.ts

// ==========================================
// 1. コンデンサ関連 型定義 (Types & Interfaces)
// ==========================================

export interface CapacitorDimensions {
  w: number;
  d: number;
  h: number;
}

/**
 * UIおよび選定ロジックで使用する標準化されたコンデンサ製品型
 */
export interface CapacitorProduct {
  id?: number | string;
  maker?: string;
  mfr?: string;
  model?: string;
  part_number?: string;
  group_id: string;
  phase?: string;
  voltage: number;
  hz?: number;
  frequency_hz?: number;
  capacity_uf?: number;
  uf: number;
  kvar?: number;
  kvar_50hz?: number;
  kvar_60hz?: number;
  current_50hz?: number;
  current_60hz?: number;
  price?: number;
  dimensions?: CapacitorDimensions;
  dimension_a_mm?: number;
  dimension_b_mm?: number;
  dimension_c_mm?: number;
  terminal?: string;
  mount?: string;
  weight_kg?: number;
  status?: string;
}

export interface CapacitorSelectionResult {
  requiredKvar: number;
  recommendedKvar: number;
  recommendedMicroFarad?: number;
  improvedPowerFactor?: number;
  dischargeResistorNote: string;
  isTableStandard?: boolean;
}

export interface CapacitorTableEntry {
  kw: number;
  uf50Hz: number;
  kvar50Hz: number;
  uf60Hz: number;
  kvar60Hz: number;
}

// --- データベース RAW マスタ型定義 ---

export interface MasterMetadata {
  title: string;
  filename: string;
  version: string;
  updated_at: string;
  description: string;
}

export interface MaxAllowableVoltage {
  "1.10_times": string;
  "1.15_times": string;
  "1.20_times": string;
  "1.30_times": string;
  note: string;
}

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

export interface RatingDetail {
  frequency_hz: 50 | 60;
  current_a: number;
  kvar: number;
}

export interface PhaseVariant {
  phase: "単相" | "三相";
  model?: string;
  ratings: RatingDetail[];
}

export interface DimensionsMM {
  A?: number;
  B?: number;
  C?: number;
  D?: number;
  E?: number;
  W?: number;
  H?: number;
}

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

export interface MotorOutputSpec {
  hp: string;
  kw: number;
}

export interface PolesCapacityMap {
  [pole: string]: {
    "50hz": (number | null)[];
    "60hz": (number | null)[];
  };
}

export interface MotorSelection200V3P {
  outputs: MotorOutputSpec[];
  recommended_capacities_uf: PolesCapacityMap;
}

export interface MotorSelection200V1P {
  recommended_capacities_uf: {
    "50hz": (number | null)[];
    "60hz": (number | null)[];
  };
}

export interface MotorSelection400V3P {
  outputs: MotorOutputSpec[];
  recommended_capacities_uf: PolesCapacityMap;
}

export interface MotorSelectionTable {
  voltage_200v_3phase: MotorSelection200V3P;
  voltage_200v_single_phase: MotorSelection200V1P;
  voltage_400v_3phase: MotorSelection400V3P;
}

export interface WelderSelectionItem {
  max_input_kva: string;
  capacity_uf: number;
}

export interface PowerFactorSampleData {
  initial_cos_theta_1: number;
  ratios: (number | null)[];
}

export interface PowerFactorImprovementTable {
  unit: string;
  target_cos_theta_2: number[];
  sample_data: PowerFactorSampleData[];
}

export interface CapacitorMasterDatabase {
  metadata: MasterMetadata;
  common_specifications: CommonSpecifications;
  products: ProductMaster[];
  motor_selection_table: MotorSelectionTable;
  welder_selection_table: WelderSelectionItem[];
  power_factor_improvement_table: PowerFactorImprovementTable;
}

// ==========================================
// 2. 標準マスタデータ (Master Tables)
// ==========================================

export const MOTOR_CAPACITOR_TABLE_200V: CapacitorTableEntry[] = [
  { kw: 0.2, uf50Hz: 15, kvar50Hz: 0.19, uf60Hz: 10, kvar60Hz: 0.15 },
  { kw: 0.4, uf50Hz: 20, kvar50Hz: 0.25, uf60Hz: 15, kvar60Hz: 0.23 },
  { kw: 0.75, uf50Hz: 30, kvar50Hz: 0.38, uf60Hz: 20, kvar60Hz: 0.3 },
  { kw: 1.0, uf50Hz: 30, kvar50Hz: 0.38, uf60Hz: 20, kvar60Hz: 0.3 },
  { kw: 1.1, uf50Hz: 30, kvar50Hz: 0.38, uf60Hz: 20, kvar60Hz: 0.3 },
  { kw: 1.5, uf50Hz: 40, kvar50Hz: 0.5, uf60Hz: 30, kvar60Hz: 0.45 },
  { kw: 2.0, uf50Hz: 50, kvar50Hz: 0.63, uf60Hz: 40, kvar60Hz: 0.6 },
  { kw: 2.2, uf50Hz: 50, kvar50Hz: 0.63, uf60Hz: 40, kvar60Hz: 0.6 },
  { kw: 3.0, uf50Hz: 50, kvar50Hz: 0.63, uf60Hz: 40, kvar60Hz: 0.6 },
  { kw: 3.7, uf50Hz: 75, kvar50Hz: 0.94, uf60Hz: 50, kvar60Hz: 0.75 },
  { kw: 4.0, uf50Hz: 75, kvar50Hz: 0.94, uf60Hz: 50, kvar60Hz: 0.75 },
  { kw: 5.0, uf50Hz: 100, kvar50Hz: 1.26, uf60Hz: 75, kvar60Hz: 1.13 },
  { kw: 5.5, uf50Hz: 100, kvar50Hz: 1.26, uf60Hz: 75, kvar60Hz: 1.13 },
  { kw: 7.5, uf50Hz: 150, kvar50Hz: 1.88, uf60Hz: 100, kvar60Hz: 1.51 },
  { kw: 10.0, uf50Hz: 200, kvar50Hz: 2.51, uf60Hz: 150, kvar60Hz: 2.26 },
  { kw: 11.0, uf50Hz: 200, kvar50Hz: 2.51, uf60Hz: 150, kvar60Hz: 2.26 },
  { kw: 15.0, uf50Hz: 250, kvar50Hz: 3.14, uf60Hz: 200, kvar60Hz: 3.02 },
  { kw: 19.0, uf50Hz: 300, kvar50Hz: 3.77, uf60Hz: 250, kvar60Hz: 3.77 },
  { kw: 20.0, uf50Hz: 300, kvar50Hz: 3.77, uf60Hz: 250, kvar60Hz: 3.77 },
  { kw: 22.0, uf50Hz: 400, kvar50Hz: 5.03, uf60Hz: 300, kvar60Hz: 4.52 },
  { kw: 25.0, uf50Hz: 400, kvar50Hz: 5.06, uf60Hz: 300, kvar60Hz: 4.52 },
  { kw: 30.0, uf50Hz: 500, kvar50Hz: 6.28, uf60Hz: 400, kvar60Hz: 6.03 },
  { kw: 37.0, uf50Hz: 600, kvar50Hz: 7.54, uf60Hz: 500, kvar60Hz: 7.54 },
  { kw: 40.0, uf50Hz: 600, kvar50Hz: 7.54, uf60Hz: 500, kvar60Hz: 7.54 },
  { kw: 45.0, uf50Hz: 750, kvar50Hz: 9.42, uf60Hz: 600, kvar60Hz: 9.04 },
  { kw: 50.0, uf50Hz: 900, kvar50Hz: 11.3, uf60Hz: 750, kvar60Hz: 11.3 },
  { kw: 55.0, uf50Hz: 900, kvar50Hz: 11.3, uf60Hz: 750, kvar60Hz: 11.3 },
];

// ==========================================
// 3. ドメイン計算ロジック (Calculation Core)
// ==========================================

export function calculateRequiredKvar(
  motorKw: number,
  powerFactor: number = 0.85,
  targetPowerFactor: number = 0.95,
  efficiency: number = 0.85,
): number {
  if (!motorKw || motorKw <= 0) return 0;

  const pf1 = Math.max(0.01, Math.min(1.0, powerFactor));
  const pf2 = Math.max(0.01, Math.min(1.0, targetPowerFactor));
  const eff = Math.max(0.01, Math.min(1.0, efficiency));

  const acos1 = Math.acos(pf1);
  const acos2 = Math.acos(pf2);
  const kvar = (motorKw / eff) * (Math.tan(acos1) - Math.tan(acos2));

  return kvar > 0 ? Math.round(kvar * 1000) / 1000 : 0;
}

export function calculateTargetUf(
  requiredKvar: number,
  frequency: number,
  voltage: number,
): number {
  if (requiredKvar <= 0 || !frequency || !voltage) return 0;

  const cFarad =
    (requiredKvar * 1000) / (2 * Math.PI * frequency * Math.pow(voltage, 2));
  const uFarad = cFarad * 1000000;

  return Math.round(uFarad * 100) / 100;
}

export function getStandardCapacitorForMotor(
  motorKw: number,
): CapacitorTableEntry | undefined {
  return MOTOR_CAPACITOR_TABLE_200V.find((entry) => entry.kw === motorKw);
}

// ==========================================
// 4. 選定・検索・フィルタリングロジック (Selection Engine)
// ==========================================

export function isVoltageMatch(
  productVoltage: number,
  targetVoltage: number,
): boolean {
  return (
    productVoltage >= targetVoltage && productVoltage <= targetVoltage * 1.1
  );
}

export function extractUf(p: CapacitorProduct): number {
  return p.uf ?? p.capacity_uf ?? 0;
}

export function isHzMatch(p: CapacitorProduct, targetHz: number): boolean {
  const productHz = p.hz ?? p.frequency_hz;
  if (productHz !== undefined && productHz !== 0) return productHz === targetHz;
  return true;
}

export function findClosestCapacitorGroup(
  catalog: CapacitorProduct[],
  targetVoltage: number,
  targetHz: number,
  targetUf: number,
): CapacitorProduct[] {
  if (!catalog.length || targetUf <= 0) return [];

  const filtered = catalog.filter(
    (p) => isVoltageMatch(p.voltage, targetVoltage) && isHzMatch(p, targetHz),
  );

  if (!filtered.length) return [];

  let closest = filtered[0];
  let minDiff = Math.abs(extractUf(closest) - targetUf);

  for (const p of filtered) {
    const diff = Math.abs(extractUf(p) - targetUf);
    if (diff < minDiff) {
      closest = p;
      minDiff = diff;
    }
  }

  return filtered.filter((p) => p.group_id === closest.group_id);
}

export function findCandidateCapacitors(
  catalog: CapacitorProduct[],
  targetVoltage: number,
  targetHz: number,
  targetUf: number,
  tolerance: number = 0.35,
): CapacitorProduct[] {
  if (!catalog.length || targetUf <= 0) return [];

  return catalog.filter((p) => {
    const voltMatch = isVoltageMatch(p.voltage, targetVoltage);
    const hzMatch = isHzMatch(p, targetHz);
    const pUf = extractUf(p);
    const diffRatio = Math.abs(pUf - targetUf) / targetUf;
    const ufMatch = diffRatio <= tolerance;

    return voltMatch && hzMatch && ufMatch;
  });
}

// ==========================================
// 5. データ正規化・アダプター関数 (Transformers)
// ==========================================

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
        maker: p.manufacturer,
        mfr: p.manufacturer,
        model: p.model,
        part_number: p.model,
        group_id: `${p.rated_voltage_v}V_${p.capacity_uf}uF`,
        phase: p.phase,
        voltage: p.rated_voltage_v,
        capacity_uf: p.capacity_uf,
        uf: p.capacity_uf,
        kvar_50hz: r50?.kvar ?? 0,
        kvar_60hz: r60?.kvar ?? 0,
        current_50hz: r50?.current_a ?? 0,
        current_60hz: r60?.current_a ?? 0,
        dimensions,
        dimension_a_mm: dimensions.w,
        dimension_b_mm: dimensions.d,
        dimension_c_mm: dimensions.h,
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
          maker: p.manufacturer,
          mfr: p.manufacturer,
          model: variantModel,
          part_number: variantModel,
          group_id: `${p.rated_voltage_v}V_${p.capacity_uf}uF`,
          phase: variant.phase,
          voltage: p.rated_voltage_v,
          capacity_uf: p.capacity_uf,
          uf: p.capacity_uf,
          kvar_50hz: r50?.kvar ?? 0,
          kvar_60hz: r60?.kvar ?? 0,
          current_50hz: r50?.current_a ?? 0,
          current_60hz: r60?.current_a ?? 0,
          dimensions,
          dimension_a_mm: dimensions.w,
          dimension_b_mm: dimensions.d,
          dimension_c_mm: dimensions.h,
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