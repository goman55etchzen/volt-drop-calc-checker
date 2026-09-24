<template>
  <div class="caution-card-wrapper mt-8">
    <div class="caution-card">
      <h3 class="caution-title">ご利用上の注意</h3>
      <ul class="caution-list">
        <li>
          本ツールは内線規程や関連法規に基づく一般的な簡易計算であり、現場特有の条件
          （高調波、特殊環境、盤内温度上昇など）は考慮していません。
        </li>
        <li>
          実際の施工・選定に際しては、必ず各メーカーの仕様書、電気設備技術基準、内線規程の最新版を確認し、
          有資格者（電気工事士など）の責任において実施してください。
        </li>
        <li>
          本ツールの計算結果を用いて生じた如何なる損害についても、当方は一切の責任を負いません。
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.caution-card-wrapper {
  padding: 0 4px;
}

.caution-card {
  background-color: #1e293b;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  padding: 16px;
}

.caution-title {
  font-size: 14px;
  font-weight: bold;
  color: #fcd34d;
  margin-top: 0;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.caution-title::before {
  content: "⚠️";
}

.caution-list {
  margin: 0;
  padding-left: 20px;
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.5;
}

.caution-list li {
  margin-bottom: 6px;
}
.caution-list li:last-child {
  margin-bottom: 0;
}

/* PC向けレスポンシブ拡張 */
@media (min-width: 768px) {
  .caution-card-wrapper {
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
  .caution-title {
    font-size: 15px;
  }
  .caution-list {
    font-size: 13px;
  }
}
</style>