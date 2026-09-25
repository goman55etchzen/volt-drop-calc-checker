// src/composables/useElb.ts
import { computed, Ref } from 'vue';
import {
  EnvironmentType,
  ElcbSelectionResult,
  THREE_PHASE_BREAKER_SIZES
} from '@/types/appDefinitions';

/**
 * 漏電遮断器（ELCB）の選定・判定ロジックを行うComposable
 * 内線規程 3705-8（幹線の過電流保護）および第148条に準拠
 *
 * @param motorAmp 電動機の定格電流の合計 ∑IM (A)
 * @param otherLoadAmp その他の電気使用機械器具の定格電流の合計 ∑IL (A)
 * @param wireAllowAmp 幹線電線の許容電流 IW (A)
 * @param environment 設置環境 ('normal' | 'enclosure' | 'wet')
 */
export function useElb(
  motorAmp: Ref<number>,
  otherLoadAmp: Ref<number>,
  wireAllowAmp: Ref<number>,
  environment: Ref<EnvironmentType>
) {
  /**
   * 漏電遮断器（ELCB）選定結果の算出
   */
  const elcbInfo = computed<ElcbSelectionResult>(() => {
    const im = motorAmp.value || 0;
    const il = otherLoadAmp.value || 0;
    const iw = wireAllowAmp.value || 0;
    const env = environment.value;

    // --- 内線規程 3705-8 幹線過電流遮断器容量の計算 ---
    // 1. 電動機合計電流による倍率設定 (50A以下: 3.0倍 / 50A超: 2.75倍)
    const motorFactor = im <= 50 ? 3.0 : 2.75;
    const limitByLoad = motorFactor * im + il;

    // 2. 幹線許容電流による上限制限 (2.5 * IW)
    const limitByWire = iw > 0 ? 2.5 * iw : Infinity;

    // 許容される過電流遮断器の上限値 (両条件の最小値)
    const maxAllowedAmp = Math.min(limitByLoad, limitByWire);

    // 3. 定格サイズの選定 (最小30A)
    const MIN_BREAKER_SIZE = 30;
    let recommendedAmp = THREE_PHASE_BREAKER_SIZES.find((size) => size >= limitByLoad) 
      ?? THREE_PHASE_BREAKER_SIZES[THREE_PHASE_BREAKER_SIZES.length - 1];

    // 幹線許容電流制限(2.5*IW)を超える場合は上限以下に抑える
    if (iw > 0 && recommendedAmp > limitByWire) {
      const validSizes = THREE_PHASE_BREAKER_SIZES.filter((size) => size <= limitByWire);
      recommendedAmp = validSizes.length > 0 
        ? validSizes[validSizes.length - 1] 
        : MIN_BREAKER_SIZE;
    }

    if (recommendedAmp < MIN_BREAKER_SIZE) {
      recommendedAmp = MIN_BREAKER_SIZE;
    }

    // --- 設置環境に応じた義務・感度電流判定 ---
    const isMandatory = env === 'wet';
    const sensitivityCurrent = isMandatory ? 15 : (recommendedAmp > 50 ? 100 : 30); // mA
    const operatingTime = '0.1秒以内（高速形）';

    // 定格感度電流に応じた接地抵抗の目標上限値計算
    const maxGroundResistance = sensitivityCurrent === 15 ? 1000 : (sensitivityCurrent === 30 ? 500 : 150);

    // --- 解説文の生成 ---
    let description = '';
    const totalLoad = im + il;

    if (isMandatory) {
      description = `水気・湿気のある場所の回路です（負荷合計: ${totalLoad.toFixed(1)}A）。内線規程3705-8準拠（制限目標: ${limitByLoad.toFixed(1)}A）で定格電流${recommendedAmp}A、感度15mA以下の高感度高速形ELCBの設置が必須です。`;
    } else if (env === 'enclosure') {
      description = `金属外箱収納回路です（負荷合計: ${totalLoad.toFixed(1)}A）。内線規程3705-8準拠により定格電流${recommendedAmp}A、感度${sensitivityCurrent}mAの高速形ELCBを選定しています。`;
    } else {
      description = `内線規程3705-8（3×∑IM＋∑IL ≤ ${limitByLoad.toFixed(1)}A）に基づき、定格電流${recommendedAmp}A（感度${sensitivityCurrent}mA）のELCBを選定しています。`;
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