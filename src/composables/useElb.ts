import { computed, Ref } from 'vue';
import {
  EnvironmentType,
  ElcbSelectionResult,
  THREE_PHASE_BREAKER_SIZES
} from './appDefinitions';

/**
 * 漏電遮断器（ELCB）の選定・判定ロジックを行うComposable
 *
 * @param calculatedAmp 計算された計算電流 (A)
 * @param environment 設置環境 ('normal' | 'enclosure' | 'wet')
 */
export function useElb(
  calculatedAmp: Ref<number>,
  environment: Ref<EnvironmentType>
) {
  /**
   * 漏電遮断器（ELCB）選定結果の算出
   */
  const elcbInfo = computed<ElcbSelectionResult>(() => {
    const amp = calculatedAmp.value || 0;
    const env = environment.value;

    // 1. 定格電流（フレーム）の選定
    // 計算電流の1.25倍以上の最小遮断器サイズを選定（三相用 20A〜）
    const targetAmp = amp * 1.25;
    const recommendedAmp =
      THREE_PHASE_BREAKER_SIZES.find((size) => size >= targetAmp) ?? 
      THREE_PHASE_BREAKER_SIZES[THREE_PHASE_BREAKER_SIZES.length - 1];

    // 2. 設置環境に応じた義務・感度電流判定
    // 水気・湿気場所（wet）の場合は設置が法的に必須（高感度形 15mA 以下）
    const isMandatory = env === 'wet';
    const sensitivityCurrent = isMandatory ? 15 : 30; // mA
    const operatingTime = '0.1秒以内（高速形）';

    // 3. 定格感度電流に応じたD種接地抵抗の目標上限値計算 (安全電圧 24V 基準)
    // 15mA -> 24 / 0.015 = 1600Ω (内線規程等の規定上限 1000Ω)
    // 30mA -> 24 / 0.030 = 800Ω  (内線規程等の規定上限 500Ω)
    const maxGroundResistance = sensitivityCurrent === 15 ? 1000 : 500;

    // 4. 解説文の生成
    let description = '';
    if (isMandatory) {
      description =
        '水気・湿気のある場所または移動形機器の回路です。定格感度電流15mA以下・動作時間0.1秒以内の高感度高速形漏電遮断器の設置が義務付けられています。';
    } else if (env === 'enclosure') {
      description =
        '金属製外箱等に収納される機器の回路です。感電防止のため、定格感度電流30mA以下の高速形（0.1秒以内）を選定してください。';
    } else {
      description =
        '一般的な屋内回路の感電保護用として、定格感度電流30mA以下・動作時間0.1秒以内の高感度高速形を選定してください。';
    }

    return {
      recommendedAmp,
      sensitivityCurrent,
      operatingTime,
      maxGroundResistance,
      isMandatory,
      description,
    };
  });

  return {
    elcbInfo,
  };
}