import { ref, computed, Ref } from 'vue'

export type InputMode = 'device_watt' | 'device_amp' | 'breaker_limit'

export function useEquipment(voltage: Ref<number>) {
  const inputMode = ref<InputMode>('device_watt')
  const unitWatt = ref<number>(60)
  const unitCount = ref<number>(10)
  const customDeviceAmp = ref<number>(10)
  const breakerAmp = ref<number>(20)

  const totalI = computed(() => {
    const v = voltage.value || 1
    if (inputMode.value === 'device_watt') {
      return ((unitWatt.value || 0) * (unitCount.value || 0)) / v
    } else if (inputMode.value === 'device_amp') {
      return customDeviceAmp.value || 0
    } else {
      return (breakerAmp.value || 0) * 0.85
    }
  })

  return {
    inputMode,
    unitWatt,
    unitCount,
    customDeviceAmp,
    breakerAmp,
    totalI
  }
}