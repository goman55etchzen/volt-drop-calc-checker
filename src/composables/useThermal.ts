// composables/useThermal.ts
import { computed, type Ref } from 'vue';

/* ============================================================================
 * サーマルリレー選定カタログ
 * ----------------------------------------------------------------------------
 * 各メーカーの技術資料（選定表）から「整定電流範囲（A）」が一意に読み取れる
 * データのみを転記しています。
 *
 * データ出典:
 *  - Schneider Electric TeSys K シリーズ  LR2K / LR7K （8-10, 8-11ページ）
 *  - Schneider Electric TeSys F シリーズ  LR9F        （10-21ページ）
 *  - MISUMI  サーマルリレー SMR-12 / SMR-32 / SMR-63 系列
 *  - MISUMI  ミニコンタクタ用サーマルリレー GTH-12M 系列
 *
 * 除外したデータとその理由:
 *  - 富士電機（TK/TR シリーズ）: 選定表がモータ容量・電圧（200V/400V）・
 *    周波数（50Hz/60Hz）ごとに複数のヒートエレメント定格が併記されており、
 *    OCRベースでは列の対応関係を一意に確定できなかったため未収録です。
 *  - テンパール、三菱電機、東芝、日立: 同様にモータ容量→整定電流の対応が
 *    複数系列・複数電圧にまたがって記載されており、誤対応のリスクが
 *    あるため未収録です。
 *  必要に応じて `FUJI_NOTE` などにメモを残していますので、該当メーカーの
 *  製品を使う場合は必ず元カタログで整定範囲を確認してください。
 * ==========================================================================*/

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

/** カタログに含めなかったメーカーに関する注意書き（UI表示用） */
export const UNVERIFIED_BRANDS_NOTE =
  '富士電機・テンパール・三菱電機・東芝・日立の各カタログは、モータ容量→整定電流の対応が電圧・周波数別に複雑に記載されており、' +
  '誤読のリスクがあるため本選定ロジックには未収録です。該当メーカーを使用する場合は必ず元カタログで整定範囲をご確認ください。';

/* ============================================================================
 * 選定結果の型
 * ==========================================================================*/

export interface ThermalCandidate extends ThermalCatalogEntry {
  /** 整定範囲の幅（狭いほど「ジャストサイズ」） */
  rangeWidth: number;
  /** 整定範囲の中心からの相対位置（0=中心, 1=上限/下限ギリギリ） */
  marginRatio: number;
}

export interface ThermalSelectionResult {
  /** 選定の基準となる電流（＝モータ定格電流、またはユーザー入力電流）[A] */
  settingCurrent: number;
  /** 画面表示用の要約文字列 */
  recommendedAmps: string;
  /** 選定結果の説明文 */
  description: string;
  /** 1件以上候補が見つかったか */
  isSupported: boolean;
  /** 整定範囲に適合する全候補（複数メーカー） */
  candidates: ThermalCandidate[];
  /** メーカーごとの最適候補（整定範囲が最も狭く、ジャストサイズなもの） */
  bestByBrand: Record<string, ThermalCandidate | null>;
  /** インバータ駆動時の注意文（該当する場合のみ） */
  inverterWarning: string | null;
}

/* ============================================================================
 * 選定ロジック
 * ==========================================================================*/

function toCandidate(entry: ThermalCatalogEntry, amp: number): ThermalCandidate {
  const rangeWidth = entry.maxA - entry.minA;
  const center = (entry.maxA + entry.minA) / 2;
  const halfWidth = rangeWidth / 2 || 1; // ゼロ割回避
  const marginRatio = Math.abs(amp - center) / halfWidth;
  return { ...entry, rangeWidth, marginRatio };
}

/** 指定電流[A]にヒットする候補を、範囲が狭い（ジャストサイズな）順に返す */
function findCandidates(amp: number): ThermalCandidate[] {
  return THERMAL_CATALOG.filter((e) => amp >= e.minA && amp <= e.maxA)
    .map((e) => toCandidate(e, amp))
    .sort((a, b) => a.rangeWidth - b.rangeWidth || a.marginRatio - b.marginRatio);
}

/** メーカー（series単位）ごとに最も適合度の高い候補を1件ずつ抽出 */
function pickBestBySeries(candidates: ThermalCandidate[]): Record<string, ThermalCandidate | null> {
  const result: Record<string, ThermalCandidate | null> = {};
  for (const c of candidates) {
    const key = `${c.brand} / ${c.series}`;
    if (!result[key]) {
      result[key] = c; // 既にrangeWidth昇順にソート済みなので最初の1件が最適
    }
  }
  return result;
}

/**
 * サーマルリレー（過負荷保護）の選定・判定ロジックを行うComposable
 * @param motorAmp 電動機の定格電流 (1台あたり) または計算電流 (A)
 * @param driveMode 駆動方式 ('direct' | 'inverter')
 * @param motorCount 電動機台数（※サーマルリレーは1モータにつき1個選定するため、
 *                    選定結果そのものには影響しません。表示用の参考値です）
 */
export function useThermal(
  motorAmp: Ref<number>,
  driveMode: Ref<'direct' | 'inverter'>,
  motorCount: Ref<number>
) {
  const thermalInfo = computed<ThermalSelectionResult>(() => {
    const amp = Number(motorAmp.value) || 0;
    const count = Number(motorCount.value) || 1;
    const isInv = driveMode.value === 'inverter';

    const settingCurrent = Number(amp.toFixed(2));
    const candidates = amp > 0 ? findCandidates(settingCurrent) : [];
    const bestByBrand = pickBestBySeries(candidates);
    const isSupported = candidates.length > 0;

    const inverterWarning = isInv
      ? 'インバータ二次側にサーマルリレーを設置する場合、インバータの高調波電流により' +
        'サーマルリレーが誤トリップ、または保護特性がずれる可能性があります。' +
        'インバータの電子サーマル機能（モータ保護機能）との重複・干渉にも注意してください。'
      : null;

    let description: string;
    if (!amp) {
      description = 'モータ定格電流を入力してください。';
    } else if (isSupported) {
      const top = candidates[0];
      description =
        `モータ定格電流 ${amp.toFixed(2)}A（${count}台分の内訳ではなく1台あたりの電流）に対し、` +
        `${candidates.length}件の適合候補が見つかりました。最もジャストサイズな候補は ` +
        `${top.brand} ${top.series} の「${top.model}」（整定範囲 ${top.minA}～${top.maxA}A）です。`;
    } else {
      description =
        `モータ定格電流 ${amp.toFixed(2)}A に適合するサーマルリレーが、収録カタログ内には見つかりませんでした。` +
        `${UNVERIFIED_BRANDS_NOTE}`;
    }

    const recommendedAmps = isSupported
      ? `${candidates[0].minA}〜${candidates[0].maxA} A（型式: ${candidates[0].model}）`
      : `${settingCurrent} A（適合候補なし）`;

    return {
      settingCurrent,
      recommendedAmps,
      description,
      isSupported,
      candidates,
      bestByBrand,
      inverterWarning,
    };
  });

  return {
    thermalInfo,
  };
}
