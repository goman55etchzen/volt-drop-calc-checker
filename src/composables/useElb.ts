import { computed, Ref } from 'vue';
import {
  EnvironmentType,
  ElcbSelectionResult,
  BREAKER_SIZES
} from '@/types/appDefinitions';

/**
 * 漏電遮断器 (ELCB) 選定 Composable
 * 
 * @param calculatedAmp 負荷電流 (A)
 * @param environment 設置環境 ('normal' | 'enclosure' | 'wet')
 */
export function useElb(
  calculatedAmp: Ref<number>,
  environment: Ref<EnvironmentType>
) {
  const elcbInfo = computed<ElcbSelectionResult>(() => {
    const amp = calculatedAmp.value;
    const env = environment.value;

    // 定格電流は負荷電流の1.5倍を目安に上位選定
    const targetAmp = amp * 1.5;
    const recommendedAmp =
      BREAKER_SIZES.find((s) => s >= targetAmp) || BREAKER_SIZES[BREAKER_SIZES.length - 1];

    const isMandatory = env === 'wet';
    // 水気のある場所は高感度形(15mA)、通常は30mA
    const sensitivityCurrent = isMandatory ? 15 : 30;
    const operatingTime = '0.1秒以内';

    let description = '電動機保護用または漏電保護専用の動作特性を持つELCBを選定してください。';
    if (isMandatory) {
      description = '水気・湿気のある場所のため、定格感度電流15mA以下の高感度高速形漏電遮断器の設置が義務付けられています。';
    }

    return {
      recommendedAmp,
      sensitivityCurrent,
      operatingTime,
      isMandatory,
      description,
    };
  });

  return {
    elcbInfo,
  };
}