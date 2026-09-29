// src/base/themalBase.ts

/* ============================================================================
 * 1. 型定義 (Types & Interfaces)
 * ==========================================================================*/

/** カタログのエントリ定義 */
export interface ThermalCatalogEntry {
    /** メーカー名 */
    brand: string;
    /** シリーズ名（フレームサイズ等を含む） */
    series: string;
    /** 型式 */
    model: string;
    /** 整定範囲 下限[A] */
    minA: number;
    /** 整定範囲 上限[A] */
    maxA: number;
    /** 欠相保護の有無など、系列上の位置付け */
    note?: string;
    /** データの信頼度（転記元の表が一意に読めたかどうか） */
    verified: boolean;
  }
  
  /** 選定候補（評価用メタデータ付き） */
  export interface ThermalCandidate extends ThermalCatalogEntry {
    /** 整定範囲の幅（狭いほど「ジャストサイズ」） */
    rangeWidth: number;
    /** 整定範囲の中心からの相対位置（0=中心, 1=上限/下限ギリギリ） */
    marginRatio: number;
  }
  
  /** サーマルリレー選定の入力パラメータ */
  export interface ThermalSelectParams {
    /** モータの定格電流または入力電流 [A] */
    motorAmp: number;
    /** 駆動方式 ('direct' | 'inverter' | null) */
    driveMode?: 'direct' | 'inverter' | null;
    /** モータ台数（※サーマルリレーは1モータにつき1個選定するため参考値） */
    motorCount?: number;
  }
  
  /** サーマルリレー選定結果の出力構造 */
  export interface ThermalSelectionResult {
    /** 選定の基準となる電流（＝モータ定格電流）[A] */
    settingCurrent: number;
    /** 画面表示用の要約文字列（例: "1.8 - 2.6 A"） */
    recommendedAmps: string;
    /** 選定結果の説明文 */
    description: string;
    /** 適合する候補が1件以上存在するか */
    isSupported: boolean;
    /** 整定範囲に適合する全候補 */
    candidates: ThermalCandidate[];
    /** 系列（メーカー・シリーズ）ごとの最適候補 */
    bestByBrand: Record<string, ThermalCandidate | null>;
    /** インバータ駆動時の注意文（該当時のみ） */
    inverterWarning: string | null;
  }
  
  /* ============================================================================
   * 2. 定数・マスタデータ (Constants & Catalog)
   * ==========================================================================*/
  
  export const UNVERIFIED_BRANDS_NOTE =
    '富士電機・テンパール・三菱電機・東芝・日立の各カタログは、モータ容量→整定電流の対応が電圧・周波数別に複雑に記載されており、' +
    '誤読のリスクがあるため本選定ロジックには未収録です。該当メーカーを使用する場合は必ず元カタログで整定範囲をご確認ください。';
  
  export const THERMAL_CATALOG: ThermalCatalogEntry[] = [
    // ---- Schneider TeSys K : LR2K（過負荷+欠相保護）/ LR7K（過負荷保護のみ） ----
    { brand: 'Schneider', series: 'TeSys K (LR2K)', model: 'LR2K0301', minA: 0.11, maxA: 0.16, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR2K)', model: 'LR2K0302', minA: 0.16, maxA: 0.23, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR2K)', model: 'LR2K0303', minA: 0.23, maxA: 0.36, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR2K)', model: 'LR2K0304', minA: 0.36, maxA: 0.54, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR2K)', model: 'LR2K0305', minA: 0.54, maxA: 0.8, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR7K・過負荷のみ)', model: 'LR7K0305', minA: 0.54, maxA: 0.8, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR2K)', model: 'LR2K0306', minA: 0.8, maxA: 1.2, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR7K・過負荷のみ)', model: 'LR7K0306', minA: 0.8, maxA: 1.2, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR2K)', model: 'LR2K0307', minA: 1.2, maxA: 1.8, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR7K・過負荷のみ)', model: 'LR7K0307', minA: 1.2, maxA: 1.8, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR2K)', model: 'LR2K0308', minA: 1.8, maxA: 2.6, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR7K・過負荷のみ)', model: 'LR7K0308', minA: 1.8, maxA: 2.6, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR2K)', model: 'LR2K0310', minA: 2.6, maxA: 3.7, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR7K・過負荷のみ)', model: 'LR7K0310', minA: 2.6, maxA: 3.7, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR2K)', model: 'LR2K0312', minA: 3.7, maxA: 5.5, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR7K・過負荷のみ)', model: 'LR7K0312', minA: 3.7, maxA: 5.5, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR2K)', model: 'LR2K0314', minA: 5.5, maxA: 8, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR7K・過負荷のみ)', model: 'LR7K0314', minA: 5.5, maxA: 8, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR2K)', model: 'LR2K0316', minA: 8, maxA: 11.5, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR7K・過負荷のみ)', model: 'LR7K0316', minA: 8, maxA: 11.5, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR2K)', model: 'LR2K0321', minA: 10, maxA: 14, verified: true },
    { brand: 'Schneider', series: 'TeSys K (LR2K)', model: 'LR2K0322', minA: 12, maxA: 16, verified: true },
  
    // ---- Schneider TeSys F : LR9F（電子式モータ保護リレー） ----
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス10)', model: 'LR9F5357', minA: 30, maxA: 50, note: '適用電磁接触器 F185', verified: true },
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス10)', model: 'LR9F5363', minA: 48, maxA: 80, note: '適用電磁接触器 F185', verified: true },
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス10)', model: 'LR9F5367', minA: 60, maxA: 100, note: '適用電磁接触器 F185', verified: true },
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス10)', model: 'LR9F5369', minA: 90, maxA: 150, note: '適用電磁接触器 F185', verified: true },
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス10)', model: 'LR9F5371', minA: 132, maxA: 220, note: '適用電磁接触器 F225, F265', verified: true },
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス10)', model: 'LR9F7375', minA: 200, maxA: 330, note: '適用電磁接触器 F225～F500', verified: true },
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス10)', model: 'LR9F7379', minA: 300, maxA: 500, note: '適用電磁接触器 F225～F500', verified: true },
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス10)', model: 'LR9F7381', minA: 380, maxA: 630, note: '適用電磁接触器 F400～F630,F800', verified: true },
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス20)', model: 'LR9F5557', minA: 30, maxA: 50, note: '適用電磁接触器 F185', verified: true },
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス20)', model: 'LR9F5563', minA: 48, maxA: 80, note: '適用電磁接触器 F185', verified: true },
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス20)', model: 'LR9F5567', minA: 60, maxA: 100, note: '適用電磁接触器 F185', verified: true },
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス20)', model: 'LR9F5569', minA: 90, maxA: 150, note: '適用電磁接触器 F185', verified: true },
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス20)', model: 'LR9F5571', minA: 132, maxA: 220, note: '適用電磁接触器 F225, F265', verified: true },
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス20)', model: 'LR9F7575', minA: 200, maxA: 330, note: '適用電磁接触器 F225～F500', verified: true },
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス20)', model: 'LR9F7579', minA: 300, maxA: 500, note: '適用電磁接触器 F225～F500', verified: true },
    { brand: 'Schneider', series: 'TeSys F (LR9F・トリップクラス20)', model: 'LR9F7581', minA: 380, maxA: 630, note: '適用電磁接触器 F400～F630,F800', verified: true },
  
    // ---- MISUMI SMR-12（電磁接触器フレームサイズ AF18） ----
    { brand: 'MISUMI', series: 'SMR-12 (AF18)', model: 'SMR-12-0.52', minA: 0.4, maxA: 0.63, verified: true },
    { brand: 'MISUMI', series: 'SMR-12 (AF18)', model: 'SMR-12-0.82', minA: 0.63, maxA: 1, verified: true },
    { brand: 'MISUMI', series: 'SMR-12 (AF18)', model: 'SMR-12-1.3', minA: 1, maxA: 1.6, verified: true },
    { brand: 'MISUMI', series: 'SMR-12 (AF18)', model: 'SMR-12-2.1', minA: 1.6, maxA: 2.5, verified: true },
    { brand: 'MISUMI', series: 'SMR-12 (AF18)', model: 'SMR-12-3.3', minA: 2.5, maxA: 4, verified: true },
    { brand: 'MISUMI', series: 'SMR-12 (AF18)', model: 'SMR-12-5', minA: 4, maxA: 6, verified: true },
    { brand: 'MISUMI', series: 'SMR-12 (AF18)', model: 'SMR-12-6.5', minA: 5, maxA: 8, verified: true },
    { brand: 'MISUMI', series: 'SMR-12 (AF18)', model: 'SMR-12-7.5', minA: 6, maxA: 9, verified: true },
    { brand: 'MISUMI', series: 'SMR-12 (AF18)', model: 'SMR-12-8.5', minA: 7, maxA: 10, verified: true },
  
    // ---- MISUMI SMR-32（電磁接触器フレームサイズ AF22/40） ----
    { brand: 'MISUMI', series: 'SMR-32 (AF22/40)', model: 'SMR-32-0.52', minA: 0.4, maxA: 0.63, verified: true },
    { brand: 'MISUMI', series: 'SMR-32 (AF22/40)', model: 'SMR-32-0.82', minA: 0.63, maxA: 1, verified: true },
    { brand: 'MISUMI', series: 'SMR-32 (AF22/40)', model: 'SMR-32-1.3', minA: 1, maxA: 1.6, verified: true },
    { brand: 'MISUMI', series: 'SMR-32 (AF22/40)', model: 'SMR-32-2.1', minA: 1.6, maxA: 2.5, verified: true },
    { brand: 'MISUMI', series: 'SMR-32 (AF22/40)', model: 'SMR-32-3.3', minA: 2.5, maxA: 4, verified: true },
    { brand: 'MISUMI', series: 'SMR-32 (AF22/40)', model: 'SMR-32-5', minA: 4, maxA: 6, verified: true },
    { brand: 'MISUMI', series: 'SMR-32 (AF22/40)', model: 'SMR-32-6.5', minA: 5, maxA: 8, verified: true },
    { brand: 'MISUMI', series: 'SMR-32 (AF22/40)', model: 'SMR-32-7.5', minA: 6, maxA: 9, verified: true },
    { brand: 'MISUMI', series: 'SMR-32 (AF22/40)', model: 'SMR-32-8.5', minA: 7, maxA: 10, verified: true },
    { brand: 'MISUMI', series: 'SMR-32 (AF22/40)', model: 'SMR-32-11', minA: 9, maxA: 13, verified: true },
    { brand: 'MISUMI', series: 'SMR-32 (AF22/40)', model: 'SMR-32-15', minA: 12, maxA: 18, verified: true },
    { brand: 'MISUMI', series: 'SMR-32 (AF22/40)', model: 'SMR-32-19', minA: 16, maxA: 22, verified: true },
    { brand: 'MISUMI', series: 'SMR-32 (AF22/40)', model: 'SMR-32-21.5', minA: 18, maxA: 25, verified: true },
    { brand: 'MISUMI', series: 'SMR-32 (AF22/40)', model: 'SMR-32-27', minA: 22, maxA: 32, verified: true },
  
    // ---- MISUMI SMR-63（電磁接触器フレームサイズ AF65） ----
    { brand: 'MISUMI', series: 'SMR-63 (AF65)', model: 'SMR-63-15S', minA: 12, maxA: 18, verified: true },
    { brand: 'MISUMI', series: 'SMR-63 (AF65)', model: 'SMR-63-19S', minA: 16, maxA: 22, verified: true },
    { brand: 'MISUMI', series: 'SMR-63 (AF65)', model: 'SMR-63-21.5S', minA: 18, maxA: 25, verified: true },
    { brand: 'MISUMI', series: 'SMR-63 (AF65)', model: 'SMR-63-30S', minA: 24, maxA: 36, verified: true },
    { brand: 'MISUMI', series: 'SMR-63 (AF65)', model: 'SMR-63-34S', minA: 28, maxA: 40, verified: true },
    { brand: 'MISUMI', series: 'SMR-63 (AF65)', model: 'SMR-63-42S', minA: 34, maxA: 50, verified: true },
    { brand: 'MISUMI', series: 'SMR-63 (AF65)', model: 'SMR-63-55S', minA: 45, maxA: 65, verified: true },
  
    // ---- MISUMI GTH-12M（ミニコンタクタ用サーマルリレー） ----
    { brand: 'MISUMI', series: 'GTH-12M (ミニコンタクタ用)', model: 'GTH-12M-0.14', minA: 0.1, maxA: 0.16, verified: true },
    { brand: 'MISUMI', series: 'GTH-12M (ミニコンタクタ用)', model: 'GTH-12M-0.21', minA: 0.16, maxA: 0.25, verified: true },
    { brand: 'MISUMI', series: 'GTH-12M (ミニコンタクタ用)', model: 'GTH-12M-0.33', minA: 0.25, maxA: 0.4, verified: true },
    { brand: 'MISUMI', series: 'GTH-12M (ミニコンタクタ用)', model: 'GTH-12M-0.52', minA: 0.4, maxA: 0.63, verified: true },
    { brand: 'MISUMI', series: 'GTH-12M (ミニコンタクタ用)', model: 'GTH-12M-0.82', minA: 0.63, maxA: 1, verified: true },
    { brand: 'MISUMI', series: 'GTH-12M (ミニコンタクタ用)', model: 'GTH-12M-1.3', minA: 1, maxA: 1.6, verified: true },
    { brand: 'MISUMI', series: 'GTH-12M (ミニコンタクタ用)', model: 'GTH-12M-2.1', minA: 1.6, maxA: 2.5, verified: true },
    { brand: 'MISUMI', series: 'GTH-12M (ミニコンタクタ用)', model: 'GTH-12M-3.3', minA: 2.5, maxA: 4, verified: true },
    { brand: 'MISUMI', series: 'GTH-12M (ミニコンタクタ用)', model: 'GTH-12M-5', minA: 4, maxA: 6, verified: true },
    { brand: 'MISUMI', series: 'GTH-12M (ミニコンタクタ用)', model: 'GTH-12M-6.5', minA: 5, maxA: 8, verified: true },
    { brand: 'MISUMI', series: 'GTH-12M (ミニコンタクタ用)', model: 'GTH-12M-7.5', minA: 6, maxA: 9, verified: true },
    { brand: 'MISUMI', series: 'GTH-12M (ミニコンタクタ用)', model: 'GTH-12M-8.5', minA: 7, maxA: 10, verified: true },
    { brand: 'MISUMI', series: 'GTH-12M (ミニコンタクタ用)', model: 'GTH-12M-12', minA: 9, maxA: 13, verified: true },
    { brand: 'MISUMI', series: 'GTH-12M (ミニコンタクタ用)', model: 'GTH-12M-14', minA: 12, maxA: 16, verified: true },
  ];
  
  /* ============================================================================
   * 3. 補助選定関数 (Utility Functions)
   * ==========================================================================*/
  
  /** カタログから指定要素を評価用 candidate に変換 */
  function toThermalCandidate(entry: ThermalCatalogEntry, amp: number): ThermalCandidate {
    const rangeWidth = entry.maxA - entry.minA;
    const center = (entry.maxA + entry.minA) / 2;
    const halfWidth = rangeWidth / 2 || 1;
    const marginRatio = Math.abs(amp - center) / halfWidth;
    return { ...entry, rangeWidth, marginRatio };
  }
  
  /** 指定電流[A]にヒットする全候補をジャストサイズ順（範囲狭＞中心近）にソートして抽出 */
  export function findThermalCandidates(amp: number): ThermalCandidate[] {
    if (amp <= 0) return [];
    return THERMAL_CATALOG.filter((e) => amp >= e.minA && amp <= e.maxA)
      .map((e) => toThermalCandidate(e, amp))
      .sort((a, b) => a.rangeWidth - b.rangeWidth || a.marginRatio - b.marginRatio);
  }
  
  /** シリーズ（メーカー・製品群）ごとの最適候補を1件ずつ抽出 */
  export function pickBestThermalBySeries(
    candidates: ThermalCandidate[]
  ): Record<string, ThermalCandidate | null> {
    const result: Record<string, ThermalCandidate | null> = {};
    for (const c of candidates) {
      const key = `${c.brand} / ${c.series}`;
      if (!result[key]) {
        result[key] = c;
      }
    }
    return result;
  }
  
  /* ============================================================================
   * 4. メイン選定関数 (Main Calculation Engine)
   * ==========================================================================*/
  
  /**
   * サーマルリレー（過負荷保護リレー）の選定計算を実行する
   */
  export function selectThermalRelay(params: ThermalSelectParams): ThermalSelectionResult {
    const { motorAmp, driveMode = 'direct', motorCount = 1 } = params;
    const settingCurrent = Number((Number(motorAmp) || 0).toFixed(2));
    const isInv = driveMode === 'inverter';
  
    // 1. 候補の検索とシリーズ別ベスト選定
    const candidates = findThermalCandidates(settingCurrent);
    const bestByBrand = pickBestThermalBySeries(candidates);
    const isSupported = candidates.length > 0;
  
    // 2. 表示用推奨整定範囲の作成
    let recommendedAmps = '該当なし';
    if (isSupported) {
      const top = candidates[0];
      recommendedAmps = `${top.minA} ～ ${top.maxA} A (整定値: ${settingCurrent}A)`;
    }
  
    // 3. インバータ警告文の判定
    let inverterWarning: string | null = null;
    if (isInv) {
      inverterWarning =
        'インバータ二次側（電動機側）にサーマルリレーを設置する場合、高調波による過熱・誤作動を防止するため、' +
        '電子式サーマルリレーの使用またはインバータ自体の電子サーマル機能の利用を推奨します。';
    }
  
    // 4. 説明文の構築
    let description = `モータ定格電流 ${settingCurrent}A に対して、整定範囲に ${settingCurrent}A を含むサーマルリレーを選定します。`;
    if (motorCount > 1) {
      description += `（※${motorCount}台設置時は各モータ個別に1台ずつサーマルリレーを設けてください）`;
    }
    if (!isSupported && settingCurrent > 0) {
      description = `定格電流 ${settingCurrent}A に対応するサーマルリレーがカタログデータ内に見つかりません。大型モータ用の電子式過電流保護リレー等の採用をご検討ください。`;
    }
  
    return {
      settingCurrent,
      recommendedAmps,
      description,
      isSupported,
      candidates,
      bestByBrand,
      inverterWarning,
    };
  }