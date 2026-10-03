// composables/useOmega.ts
import { computed, Ref } from 'vue';
import {
  EnvironmentType,
  GroundingResult,
} from '@/types/appDefinitions';
import { useElb } from './useElb';

export function useOmega(
  voltage: Ref<number>,
  environment: Ref<EnvironmentType>,
  calculatedAmp: Ref<number>
) {
  // 分離した useElb Composable を呼び出し
  const { elcbInfo } = useElb(calculatedAmp, environment);

  /**
   * 接地工事および絶縁抵抗の正当な判定計算
   */
  const groundingInfo = computed<GroundingResult>(() => {
    const v = voltage.value;
    const env = environment.value;

    const isHighVoltage = v > 300;
    const groundType = isHighVoltage ? 'C種接地工事' : 'D種接地工事';
    const groundResistance = isHighVoltage ? 10 : 100;
    const allowableResistanceWithElcb = 500;
    
    let insulationResistance = 0.2;
    if (v <= 100) {
      insulationResistance = 0.1;
    } else if (v > 300) {
      insulationResistance = 0.4;
    }

    const groundWireDiameter = isHighVoltage
      ? '1.6mm以上 (推奨2.0mm / 5.5sq以上)'
      : '1.6mm以上';

    const requiresELCB = env === 'wet' || env === 'enclosure';

    const notes: string[] = [];
    if (isHighVoltage) {
      notes.push('使用電圧が300Vを超えるため、C種接地工事が必要です（原則10Ω以下）。');
    } else {
      notes.push('使用電圧が300V以下のため、D種接地工事を適用します（原則100Ω以下）。');
    }

    if (requiresELCB) {
      notes.push(
        '感電防止用漏電遮断器（定格感度電流30mA以下、動作時間0.1秒以内）を設置する場合、接地抵抗値は500Ω以下まで緩和されます。'
      );
    }
    if (env === 'wet') {
      notes.push('水気・湿気のある場所での設置のため、高感度高速形漏電遮断器の設置が法令上義務付けられています。');
    }

    return {
      groundType,
      groundResistance,
      allowableResistanceWithElcb,
      insulationResistance,
      groundWireDiameter,
      requiresELCB,
      notes,
    };
  });

  return {
    groundingInfo,
    elcbInfo,
  };
}

// utils/motorOmega_2.ts
import {
  EnvironmentType,
  GroundingResult,
  ElcbSelectionResult,
} from '@/types/appDefinitions';

/**
 * 電動機用接地工事および絶縁抵抗の判定
 */
export function calculateMotorGrounding(
  voltage: number,
  environment: EnvironmentType
): GroundingResult {
  const isHighVoltage = voltage > 300;
  const groundType = isHighVoltage ? 'C種接地工事' : 'D種接地工事';
  const groundResistance = isHighVoltage ? 10 : 100;
  const allowableResistanceWithElcb = 500;
  const insulationResistance = isHighVoltage ? 0.4 : 0.2;
  const groundWireDiameter = isHighVoltage ? '1.6mm以上 (推奨2.0mm)' : '1.6mm以上';
  const requiresELCB = environment === 'wet' || environment === 'enclosure';

  const notes: string[] = [];
  if (isHighVoltage) {
    notes.push('対地電圧が300Vを超えるため、C種接地工事が必要です。');
  }
  if (environment === 'wet') {
    notes.push('水気・湿気のある場所での設置のため、高感度高速形漏電遮断器の設置が義務付けられています。');
  } else if (environment === 'enclosure') {
    notes.push('金属製外箱内に設置する場合、適切な接地と漏電遮断器による保護が必要です。');
  }

  return {
    groundType,
    groundResistance,
    allowableResistanceWithElcb,
    insulationResistance,
    groundWireDiameter,
    requiresELCB,
    notes,
  };
}

/**
 * 電動機用漏電遮断器 (ELCB) の選定
 */
export function selectMotorELCB(
  calculatedAmp: number,
  environment: EnvironmentType,
  breakerSizes: number[]
): ElcbSelectionResult {
  const targetAmp = calculatedAmp * 1.5;
  const recommendedAmp =
    breakerSizes.find((s) => s >= targetAmp) || breakerSizes[breakerSizes.length - 1];

  const isMandatory = environment === 'wet';
  const sensitivityCurrent = isMandatory ? 15 : 30; // 水気のある場所は15mA、通常は30mA
  const operatingTime = '0.1秒以内';

  let description = '電動機保護用または漏電保護専用の動作特性を持つELCBを選定してください。';
  if (isMandatory) {
    description = '水気・湿気のある場所のため、15mA高感度高速形の漏電遮断器の設置が必須です。';
  }

  return {
    recommendedAmp,
    sensitivityCurrent,
    operatingTime,
    isMandatory,
    description,
  };
}