// src/composables/useAirconCableLink.ts
//
// エアコン選定結果 (AirconCableSelectionPayload) を配線計算 (useCabling) に流し込み、
// 「使用電線の限界配線長」を CableBase 基準で算出する連携コンポーザブル。
import { ref, computed } from "vue";
import { useCabling } from "@/composables/useCabling";
import {
  CableBase,
  getWireSizesForCable,
  type CableTypeCode,
} from "@/base/cableBase";
import {
  AIRCON_WIRE_COUNT,
  type AirconCableSelectionPayload,
} from "@/base/airconBase";
import { extractWireSizeName } from "@/utils/airconCalc";

export type LinkStatus = "idle" | "ok" | "warn" | "ng";

const floor1 = (v: number): number =>
  Number.isFinite(v) ? Math.floor(v * 10) / 10 : 0;

export function useAirconCableLink() {
  // ---- 配線計算側の入力（エアコン選定結果で上書きされる） ----
  const voltage = ref<number>(100);
  const totalI = ref<number>(15);
  const selectedWireName = ref<string>("1.6mm");
  const selectedCableId = ref<CableTypeCode>("vv");
  const targetPercent = ref<number>(2.0);
  const distance = ref<number>(0);

  const payload = ref<AirconCableSelectionPayload | null>(null);

  const cabling = useCabling(
    voltage,
    totalI,
    selectedWireName,
    selectedCableId,
    targetPercent,
    { distance, wireCount: ref(AIRCON_WIRE_COUNT) }
  );

  /** エアコン選定結果を取り込む */
  function applyAirconPayload(p: AirconCableSelectionPayload) {
    const prev = payload.value;
    payload.value = p;

    voltage.value = p.voltage;
    totalI.value = p.currentA;
    selectedCableId.value = p.cableType;
    targetPercent.value = p.targetDropPercent;
    distance.value = p.wiringDistanceMeters ?? 0;
    cabling.selectedSystemId.value = p.systemId;

    // 推奨電線が変わったときだけ電線を上書き（手動変更は維持）
    if (!prev || prev.wireSize !== p.wireSize || prev.cableType !== p.cableType) {
      selectedWireName.value = resolveWire(p.wireSize);
    }
  }

  /** 電線を推奨サイズに戻す */
  function resetToRecommended() {
    if (payload.value) selectedWireName.value = resolveWire(payload.value.wireSize);
  }

  function resolveWire(wireSize: string): string {
    const n = extractWireSizeName(wireSize);
    return CableBase.getCableSpec(n)?.size ?? n;
  }

  // ---- 限界配線長（CableBase 基準・片道 m） ----
  const limitMeters = computed(() => floor1(cabling.maxLen.value));

  const limit3Meters = computed(() =>
    floor1(
      CableBase.calculateMaxDistance(
        voltage.value,
        3.0,
        totalI.value,
        selectedWireName.value,
        cabling.selectedSystemId.value
      )
    )
  );

  /** 選択可能な電線（ケーブル種別で使えるサイズのみ） */
  const wireOptions = computed(() => getWireSizesForCable(selectedCableId.value));

  /** 予定配線長に対する電圧降下判定 */
  const dropCheck = computed(() => {
    if (distance.value <= 0) return null;
    const volts = Math.round(cabling.voltageDrop.value * 100) / 100;
    const percent = Math.round(cabling.voltageDropPercent.value * 100) / 100;
    return {
      volts,
      percent,
      okTarget: percent <= targetPercent.value,
      ok3: percent <= 3.0,
    };
  });

  const status = computed<LinkStatus>(() => {
    if (!payload.value) return "idle";
    if (cabling.isOverCurrent.value) return "ng";
    const d = dropCheck.value;
    if (!d) return "ok";
    if (d.okTarget) return "ok";
    return d.ok3 ? "warn" : "ng";
  });

  /** 熱的許容電流 [A]（選択中電線） */
  const allowAmp = computed(() => cabling.allowableCurrentInfo.value.totalAllowAmp);

  /** 電線サイズ別一覧（熱的に使えるものだけ） */
  const wireRows = computed(() =>
    cabling.allWireEvaluations.value.filter((r) => r.allowAmpereByHeat > 0)
  );

  return {
    // 状態
    payload,
    voltage,
    totalI,
    selectedWireName,
    selectedCableId,
    targetPercent,
    distance,
    // 操作
    applyAirconPayload,
    resetToRecommended,
    stepWireSize: cabling.stepWireSize,
    // 結果
    limitMeters,
    limit3Meters,
    wireOptions,
    dropCheck,
    status,
    allowAmp,
    wireRows,
    suitableWire: cabling.suitableWire,
    isOverCurrent: cabling.isOverCurrent,
    selectedSystemId: cabling.selectedSystemId,
    currentSystem: cabling.currentSystem,
    cabling,
  };
}
