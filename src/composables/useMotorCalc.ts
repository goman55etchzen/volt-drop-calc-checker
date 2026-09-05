import { ref, computed } from 'vue';

export function useMotorCalc() {
  // 入力状態
  const outputKw = ref<number>(5.5); // モーター出力 [kW]
  const voltage = ref<number>(200);   // 線間電圧 [V]
  const powerFactor = ref<number>(0.85); // 力率 cosθ
  const efficiency = ref<number>(0.85);  // 効率 η

  // 1. 公式による詳細定格電流 I = P / (√3 * V * cosθ * η)
  const calculatedAmp = computed(() => {
    const pWatt = outputKw.value * 1000;
    const denominator = Math.sqrt(3) * voltage.value * powerFactor.value * efficiency.value;
    if (denominator <= 0) return 0;
    return Number((pWatt / denominator).toFixed(2));
  });

  // 2. 簡易計算による目安電流（200V: kW×4, 400V: kW×2）
  const simpleAmp = computed(() => {
    if (voltage.value === 400) {
      return Number((outputKw.value * 2).toFixed(1));
    }
    // デフォルト（200V系）
    return Number((outputKw.value * 4).toFixed(1));
  });

  // 3. 内線規程に基づく電線選定用電流（許容電流の判定基準）
  // 50A以下: 1.25倍 / 50A超: 1.1倍
  const requiredWireAmp = computed(() => {
    const amp = calculatedAmp.value;
    if (amp <= 50) {
      return Number((amp * 1.25).toFixed(2));
    }
    return Number((amp * 1.1).toFixed(2));
  });

  // 4. 過電流遮断器（ブレーカー）容量の目安（直入れ始動時: 3.0倍）
  const breakerCapacity = computed(() => {
    const amp = calculatedAmp.value;
    const sizes = [15, 20, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200, 225, 250, 300];
    const target = amp * 3.0;
    const recommended = sizes.find((s) => s >= target) || sizes[sizes.length - 1];

    return {
      rawTarget: Number(target.toFixed(1)),
      recommended
    };
  });

  // プリセット設定処理
  const setPreset = (kw: number) => {
    outputKw.value = kw;
    // 容量に応じた標準力率の割り当て
    if (kw <= 2.2) {
      powerFactor.value = 0.80;
    } else if (kw <= 7.5) {
      powerFactor.value = 0.85;
    } else {
      powerFactor.value = 0.88;
    }
  };

  return {
    outputKw,
    voltage,
    powerFactor,
    efficiency,
    calculatedAmp,
    simpleAmp,
    requiredWireAmp,
    breakerCapacity,
    setPreset
  };
}