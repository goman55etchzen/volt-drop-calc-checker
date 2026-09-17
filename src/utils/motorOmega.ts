import { EnvironmentType, GroundingResult } from '@/types/appDefinitions';

/**
 * 電圧と設置環境から必要な接地工事・接地抵抗値・絶縁抵抗値を算出する
 * 
 * @param voltage 線間電圧 (V)
 * @param environment 設置環境 ('normal' | 'enclosure' | 'wet')
 * @returns GroundingResult
 */
export function calculateMotorGrounding(
  voltage: number,
  environment: EnvironmentType
): GroundingResult {
  const isOver300V = voltage > 300;
  const notes: string[] = [];

  // 1. 接地種別の判定 (電気設備技術基準の解釈 第28条・29条)
  const groundType = isOver300V ? 'C種接地工事' : 'D種接地工事';

  // 2. 基準接地抵抗値と絶縁抵抗値の判定
  const groundResistance = isOver300V ? 10 : 100;
  const insulationResistance = isOver300V ? 0.4 : 0.2;
  const groundWireDiameter = isOver300V
    ? '1.6mm以上 (公称断面積 2.0sq以上)'
    : '1.6mm以上';

  let requiresELCB = false;

  // 3. 設置環境に伴う漏電遮断器(ELCB)の必要性チェック
  if (environment === 'wet') {
    requiresELCB = true;
    notes.push(
      '水気のある場所への設置です。感電防止用漏電遮断器（定格感度電流15mA以下・動作時間0.1秒以内）の設置が必須です。'
    );
  } else if (environment === 'enclosure') {
    notes.push(
      '金属製外箱・鉄骨構造環境です。接触感電防止のため漏電遮断器の設置を推奨します。'
    );
  }

  // 4. ELCB設置時の接地抵抗値緩和 (500Ω以下)
  if (requiresELCB || environment === 'enclosure') {
    notes.push(
      '0.5秒以内に自動遮断する漏電遮断器を設ける場合、接地抵抗値は 500Ω 以下まで緩和可能です。'
    );
  }

  return {
    groundType,
    groundResistance,
    allowableResistanceWithElcb: 500,
    insulationResistance,
    groundWireDiameter,
    requiresELCB,
    notes,
  };
}