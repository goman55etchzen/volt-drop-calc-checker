// src/base/capacitorStandard.ts
//
// 低圧進相コンデンサ 取付標準容量（内線規程 JEAC8001 3335節 準拠）
// ★ 電動機個別設置の標準容量表を一元管理する。他ファイルは本モジュールを参照すること。
//
// 出典（相互照合済み）:
//  - パナソニック「ご使用の手引き」p12 進相コンデンサ取付け容量基準表
//  - 指月電機製作所「進相コンデンサと直列リアクトルの選定方法」(a)〜(d)
//  - ニチコン 内線規程改訂 JEAC8001-2016 資料
// kvar は参考値。μF から 2π·f·C·V² で算出（カタログ値との差は丸めのみ）。

export type MotorClass = "standard" | "top_runner";
export type MotorPoles = 2 | 4 | 6;
export type CapacitorPhase = "three" | "single";

export interface StandardCapacitorQuery {
  kw: number;
  hz: 50 | 60;
  phase: CapacitorPhase;
  /** 回路電圧 [V]（三相は200Vのみ、単相は100/200V） */
  voltage: number;
  /** 電動機区分（三相のみ有効） */
  motorClass?: MotorClass;
  /** 極数（トップランナー表のみ有効） */
  poles?: MotorPoles;
}

export interface StandardCapacitorResult {
  uf: number;
  kvar: number;
  /** 表の該当出力 [kW]（実際の出力以上で最小の行） */
  matchedKw: number;
  /** 出力が表の行と一致したか（false = 上位の行を採用） */
  exact: boolean;
  tableId: string;
  tableLabel: string;
  note?: string;
}

export interface CapacitorTableEntry {
  kw: number;
  uf50Hz: number;
  kvar50Hz: number;
  uf60Hz: number;
  kvar60Hz: number;
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

/** C[μF] → kvar（参考値） */
export function ufToKvar(uf: number, hz: number, voltage: number): number {
  return round2((2 * Math.PI * hz * uf * 1e-6 * voltage * voltage) / 1000);
}

// ------------------------------------------------------------------
// 1. 200V 三相モータ（トップランナー以外 = 従来表）  [kW, 50Hz μF, 60Hz μF]
// ------------------------------------------------------------------
const STD_3P_200V: ReadonlyArray<readonly [number, number, number]> = [
  [0.2, 15, 10],
  [0.4, 20, 15],
  [0.75, 30, 20],
  [1.0, 30, 20],
  [1.1, 30, 20],
  [1.5, 40, 30],
  [2.0, 50, 40],
  [2.2, 50, 40],
  [3.0, 50, 40],
  [3.7, 75, 50],
  [4.0, 75, 50],
  [5.0, 100, 75],
  [5.5, 100, 75],
  [7.5, 150, 100],
  [10.0, 200, 150],
  [11.0, 200, 150],
  [15.0, 250, 200],
  [18.5, 300, 250],
  [19.0, 300, 250], // 旧表記（指月カタログ）。18.5kW と同値
  [20.0, 300, 250],
  [22.0, 400, 300],
  [25.0, 400, 300],
  [30.0, 500, 400],
  [37.0, 600, 500],
  [40.0, 600, 500],
  [45.0, 750, 600],
  [50.0, 900, 750],
  [55.0, 900, 750],
];

// ------------------------------------------------------------------
// 2. 200V 三相トップランナー(IE3)モータ ※内線規程2016改定で追加。極数別
// ------------------------------------------------------------------
const TOP_RUNNER_KW = [
  0.2, 0.4, 0.75, 1.5, 2.2, 3.7, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55,
] as const;

type PoleRow = { "50": (number | null)[]; "60": (number | null)[] };

const TOP_RUNNER_3P_200V: Record<MotorPoles, PoleRow> = {
  2: {
    "50": [null, null, 30, 40, 50, 75, 100, 150, 200, 250, 300, 300, 500, 600, 750, 1000],
    "60": [null, null, 20, 30, 40, 50, 75, 100, 150, 150, 200, 250, 300, 400, 400, 600],
  },
  4: {
    "50": [null, null, 40, 75, 100, 150, 200, 250, 300, 400, 500, 800, 900, 1200, 1400, 1400],
    "60": [null, null, 30, 40, 50, 75, 100, 150, 200, 250, 300, 400, 500, 700, 800, 900],
  },
  6: {
    "50": [null, null, 50, 100, 100, 150, 300, 300, 500, 500, 700, 800, 1200, 1300, 1500, 1900],
    "60": [null, null, 30, 50, 75, 100, 150, 200, 300, 300, 400, 400, 500, 750, 900, 1100],
  },
};

// ------------------------------------------------------------------
// 3. 単相モータ  [kW, 100V 50Hz, 100V 60Hz, 200V 50Hz, 200V 60Hz]
// ------------------------------------------------------------------
const SINGLE_PHASE: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [0.1, 50, 50, 20, 20],
  [0.2, 75, 50, 20, 20],
  [0.25, 75, 75, 30, 20],
  [0.4, 75, 75, 30, 20],
  [0.55, 100, 75, 40, 30],
  [0.75, 100, 75, 40, 30],
  [1.1, 100, 100, 50, 40],
];

// ------------------------------------------------------------------
// 後方互換：既存コードが参照する MOTOR_CAPACITOR_TABLE_200V（従来表から生成）
// ------------------------------------------------------------------
export const MOTOR_CAPACITOR_TABLE_200V: CapacitorTableEntry[] = STD_3P_200V.map(
  ([kw, u50, u60]) => ({
    kw,
    uf50Hz: u50,
    kvar50Hz: ufToKvar(u50, 50, 200),
    uf60Hz: u60,
    kvar60Hz: ufToKvar(u60, 60, 200),
  }),
);

// ------------------------------------------------------------------
// 検索
// ------------------------------------------------------------------
const EPS = 1e-6;

function pick<T>(
  rows: ReadonlyArray<{ kw: number; v: T }>,
  kw: number,
): { kw: number; v: T; exact: boolean } | null {
  const sorted = [...rows].sort((a, b) => a.kw - b.kw);
  const hit = sorted.find((r) => r.kw + EPS >= kw);
  if (!hit) return null;
  return { ...hit, exact: Math.abs(hit.kw - kw) < EPS };
}

function lookupStandard3P(q: StandardCapacitorQuery): StandardCapacitorResult | null {
  const hzKey = q.hz === 50 ? 1 : 2;
  const rows = STD_3P_200V.map((r) => ({ kw: r[0], v: r[hzKey] as number }));
  const m = pick(rows, q.kw);
  if (!m) return null;
  return {
    uf: m.v,
    kvar: ufToKvar(m.v, q.hz, 200),
    matchedKw: m.kw,
    exact: m.exact,
    tableId: "3p_200v_standard",
    tableLabel: "200V三相モータ（トップランナー以外）",
  };
}

function lookupTopRunner3P(q: StandardCapacitorQuery): StandardCapacitorResult | null {
  const poles = q.poles ?? 4;
  const arr = TOP_RUNNER_3P_200V[poles][String(q.hz) as "50" | "60"];
  const rows = TOP_RUNNER_KW.map((kw, i) => ({ kw, v: arr[i] }));
  const m = pick(rows, q.kw);
  if (!m) return null;
  if (m.v === null) {
    // 0.4kW以下はトップランナー表に値が無い → 従来表で代替
    const fb = lookupStandard3P(q);
    return fb
      ? { ...fb, note: "0.4kW以下はトップランナー表に規定がないため、従来表の値を採用しています。" }
      : null;
  }
  return {
    uf: m.v,
    kvar: ufToKvar(m.v, q.hz, 200),
    matchedKw: m.kw,
    exact: m.exact,
    tableId: `3p_200v_top_runner_${poles}p`,
    tableLabel: `200V三相トップランナーモータ（${poles}極）`,
  };
}

function lookupSingle(q: StandardCapacitorQuery): StandardCapacitorResult | null {
  if (q.voltage !== 100 && q.voltage !== 200) return null;
  const col = (q.voltage === 100 ? 1 : 3) + (q.hz === 50 ? 0 : 1);
  const rows = SINGLE_PHASE.map((r) => ({ kw: r[0], v: r[col] as number }));
  const m = pick(rows, q.kw);
  if (!m) return null;
  return {
    uf: m.v,
    kvar: ufToKvar(m.v, q.hz, q.voltage),
    matchedKw: m.kw,
    exact: m.exact,
    tableId: `1p_${q.voltage}v`,
    tableLabel: `${q.voltage}V単相モータ`,
  };
}

/**
 * 電動機出力から取付標準容量を検索する。
 * 表に無い（範囲外・未対応電圧）場合は null → 呼び出し側で力率計算にフォールバックすること。
 * 出力が表の行の間にあるときは「出力以上で最小の行」を採用する（容量不足を避ける）。
 */
export function lookupStandardCapacitor(
  q: StandardCapacitorQuery,
): StandardCapacitorResult | null {
  if (!q.kw || q.kw <= 0) return null;
  if (q.phase === "single") return lookupSingle(q);
  if (q.voltage !== 200) return null;
  return q.motorClass === "top_runner" ? lookupTopRunner3P(q) : lookupStandard3P(q);
}
