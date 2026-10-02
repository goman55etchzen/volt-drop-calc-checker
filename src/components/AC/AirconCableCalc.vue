<!-- src/components/AC/AirconCableCalc.vue : エアコン選定 → 限界配線長 連携ページ -->
<script setup lang="ts">
import { ref, nextTick } from "vue";
import AirConditioner from "@/components/AC/AirConditioner.vue";
import AirconWireLimitCard from "@/components/AC/AirconWireLimitCard.vue";
import type { AirconCableSelectionPayload } from "@/base/airconBase";

const payload = ref<AirconCableSelectionPayload | null>(null);
const cardWrap = ref<HTMLElement | null>(null);

/** 入力変更のたびに自動で届くライブ連携 */
const onPreview = (p: AirconCableSelectionPayload) => {
  payload.value = p;
};

/** 「配線計算へ送る」ボタン：確定してカードへスクロール */
const onSelect = async (p: AirconCableSelectionPayload) => {
  payload.value = p;
  await nextTick();
  cardWrap.value?.scrollIntoView({ behavior: "smooth", block: "start" });
};
</script>

<template>
  <div class="aircon-cable-calc">
    <AirConditioner @preview-cable="onPreview" @select-cable="onSelect" />
    <div ref="cardWrap">
      <AirconWireLimitCard :payload="payload" />
    </div>
  </div>
</template>
