import { computed, Ref } from 'vue';
import {
  EnvironmentType,
  PowerFrequency,
  GroundingResult,
  ElcbSelectionResult,
  CapacitorSelectionResult,
  MOTOR_CAPACITOR_TABLE_200V,
  BREAKER_SIZES
} from '@/types/appDefinitions';

export function useOmega(
  voltage: Ref<number>,
  environment: Ref<EnvironmentType>,
  calculatedAmp: Ref<number>,
  outputKw: Ref<number>,
  powerFactor: Ref<number>,
  targetPowerFactor: Ref<number>,
  frequency: Ref<PowerFrequency>
) {
  /**
   * 接地工事および絶縁抵抗の正当な判定計算
   * 基準:
   * - 300V以下: D種接地工事 (接地抵抗 100Ω以下 / 0.5秒以内遮断ELCB適用時 500Ω以下, 絶縁抵抗 0.2MΩ以上)
   * - 300V超 : C種接地工事 (接地抵抗 10Ω以下 / 0.5秒以内遮断ELCB適用時 500Ω以下, 絶縁抵抗 0.4MΩ以上)
   */
  const groundingInfo = computed<GroundingResult>(() => {
    const v = voltage.value;
    const env = environment.value;

    // 300Vを超えるか否かで接地種別を判定
    const isHighVoltage = v > 300;
    const groundType = isHighVoltage ? 'C種接地工事' : 'D種接地工事';
    const groundResistance = isHighVoltage ? 10 : 100;
    const allowableResistanceWithElcb = 500;
    
    // 絶縁抵抗値 (使用電圧)
    // 100V以下: 0.1MΩ以上 / 300V以下: 0.2MΩ以上 / 300V超: 0.4MΩ以上
    let insulationResistance = 0.2;
    if (v <= 100) {
      insulationResistance = 0.1;
    } else if (v > 300) {
      insulationResistance = 0.4;
    }

    // 接地線の太さ (内線規程・技術基準)
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

  /**
   * 漏電遮断器 (ELCB) の選定
   */
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

  /**
   * 進相コンデンサ (力率改善) の計算
   */
  const capacitorInfo = computed<CapacitorSelectionResult>(() => {
    const kw = outputKw.value;
    const pf1 = Math.min(Math.max(powerFactor.value, 0.1), 0.99);
    const pf2 = Math.min(Math.max(targetPowerFactor.value, pf1), 1.0);
    const v = voltage.value;
    const freq = frequency.value;

    // 1. 低圧200V三相誘導電動機用 テーブル(第1表) 判定
    const tableMatch = MOTOR_CAPACITOR_TABLE_200V.find((entry) => entry.kw === kw);
    let isTableStandard = false;

    // 2. 理論値計算: Q = P * (tan(θ1) - tan(θ2))
    const tan1 = Math.tan(Math.acos(pf1));
    const tan2 = Math.tan(Math.acos(pf2));
    const requiredKvar = Number((kw * (tan1 - tan2)).toFixed(2));

    let recommendedKvar = requiredKvar;
    let recommendedMicroFarad = 0;

    if (v === 200 && tableMatch) {
      isTableStandard = true;
      if (freq === 60) {
        recommendedKvar = tableMatch.kvar60Hz;
        recommendedMicroFarad = tableMatch.uf60Hz;
      } else {
        recommendedKvar = tableMatch.kvar50Hz;
        recommendedMicroFarad = tableMatch.uf50Hz;
      }
    } else {
      // 汎用公式から静電容量 (μF) を算出: C = Q / (2 * π * f * V^2)
      const qVar = requiredKvar * 1000;
      const omega = 2 * Math.PI * freq;
      if (omega > 0 && v > 0) {
        const farad = qVar / (omega * Math.pow(v, 2));
        recommendedMicroFarad = Math.round(farad * 1e6);
      }
    }

    const dischargeResistorNote =
      'コンデンサ開放時の残留電荷による感電防止のため、放電抵抗（または自動放電装置）を内蔵または並列接続してください。';

    return {
      requiredKvar,
      recommendedKvar,
      recommendedMicroFarad,
      improvedPowerFactor: pf2,
      dischargeResistorNote,
      isTableStandard,
    };
  });

  return {
    groundingInfo,
    elcbInfo,
    capacitorInfo,
  };
}