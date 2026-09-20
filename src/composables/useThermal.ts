// composables/useThermal.ts
import { computed, Ref } from 'vue';

export interface ThermalSelectionResult {
  recommendedAmps: string;
  settingCurrent: number;
  description: string;
  isSupported: boolean;
}

/**
 * サーマルリレー（過負荷保護）の選定・判定ロジックを行うComposable
 * @param motorAmp 電動機の定格電流 (1台あたり) または計算電流 (A)
 * @param driveMode 駆動方式 ('direct' | 'inverter')
 * @param motorCount 電動機台数
 */
export function useThermal(
  motorAmp: Ref<number>,
  driveMode: Ref<'direct' | 'inverter'>,
  motorCount: Ref<number>
) {
  const thermalInfo = computed<ThermalSelectionResult>(() => {
    const amp = motorAmp.value || 0;
    const count = motorCount.value || 1;
    const isInv = driveMode.value === 'inverter';

    // サーマルリレーの設定電流は通常、電動機定格電流を基準に選定
    const settingCurrent = Number((amp * 1.0).toFixed(2));

    let description = '';
    if (isInv) {
      description = `インバータ駆動時の電動機保護用サーマルリレー選定：電動機定格電流 ${amp.toFixed(1)}A に対し、サーマル設定電流を ${settingCurrent}A に設定します。（※インバータ二次側にサーマルリレーを設置する場合は、インバータの高調波による影響や電子サーマル機能との重複・保護特性に十分ご注意ください）`;
    } else {
      description = `商用直結回路の電磁開閉器用サーマルリレー選定：電動機定格電流 ${amp.toFixed(1)}A に適合するサーマルリレー（${count}台分）を選定しています。`;
    }

    return {
      recommendedAmps: `${settingCurrent} A基準 (調整範囲対応)`,
      settingCurrent,
      description,
      isSupported: true,
    };
  });

  return {
    thermalInfo,
  };
}