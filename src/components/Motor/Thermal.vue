<!-- src/components/Motor/Thermal.vue -->
<template>
  <div class="thermal-card">
    <div class="card-header">
      <span class="icon">⚡</span>
      <h3 class="title">サーマルリレー（過負荷保護）選定</h3>
    </div>

    <div class="card-body">

      <!-- =====================================================
           パターン A: 商用直結 + モーターブレーカー
           → サーマルリレー原則不要、ただし確認事項を提示
           ===================================================== -->
      <template v-if="driveMode === 'direct' && breakerSelectedType === 'motor_breaker'">

        <!-- 原則不要バナー -->
        <div class="status-banner status-banner--ok">
          <span class="status-icon">✅</span>
          <div>
            <p class="status-title">サーマルリレーは原則として追加不要</p>
            <p class="status-desc">
              モーターブレーカーは「配線保護＋モータ過負荷保護」を兼ねる製品のため、
              別途サーマルリレーを設ける必要はありません。
            </p>
          </div>
        </div>

        <!-- 確認推奨事項 -->
        <div class="alert alert--warning">
          <span class="alert-icon">⚠️</span>
          <div>
            <p class="alert-title">ただし、以下の場合は製品仕様を必ず確認してください</p>
            <ul class="check-list">
              <li>
                <span class="check-badge check-badge--yellow">欠相保護</span>
                欠相保護が必要な場合 → 選定したモーターブレーカーに欠相保護機能が
                あるか確認。ない場合は 2E形サーマルリレーの追加を検討。
              </li>
              <li>
                <span class="check-badge check-badge--yellow">特殊始動</span>
                始動時間が長い・頻繁な寸動／間欠運転など特殊な運転条件がある場合 →
                モーターブレーカーの保護特性が運転条件に適合しているか確認。
              </li>
              <li>
                <span class="check-badge check-badge--yellow">電磁接触器</span>
                運転・停止を電磁接触器で行い、過負荷時に電磁接触器を開路したい場合 →
                電磁接触器＋サーマルリレーの構成を検討。
              </li>
            </ul>
          </div>
        </div>

        <!-- 参考：サーマル選定値（折りたたみ） -->
        <details class="collapsible">
          <summary class="collapsible-summary">
            参考：追加する場合のサーマルリレー選定目安
          </summary>
          <div class="collapsible-body">
            <div class="info-row">
              <span class="label">推奨設定電流</span>
              <span class="value">{{ thermalInfo.settingCurrent }} A</span>
            </div>
            <div class="info-row">
              <span class="label">選定目安・調整範囲</span>
              <span class="value-sub">{{ thermalInfo.recommendedAmps }}</span>
            </div>
            <p class="description">{{ thermalInfo.description }}</p>
          </div>
        </details>

      </template>

      <!-- =====================================================
           パターン B: 商用直結 + MCCB
           → サーマルリレー必須、運転条件別の型式案内
           ===================================================== -->
      <template v-else-if="driveMode === 'direct' && breakerSelectedType === 'mccb'">

        <!-- 必要バナー -->
        <div class="status-banner status-banner--required">
          <span class="status-icon">🔴</span>
          <div>
            <p class="status-title">サーマルリレー（電磁接触器）の設置が必要</p>
            <p class="status-desc">
              MCCB（配線用遮断器）は配線保護が主目的で、モータの過負荷保護機能を持ちません。
              電動機保護のため、以下の構成でサーマルリレーを組み合わせてください。
            </p>
          </div>
        </div>

        <!-- 標準接続構成 -->
        <div class="circuit-flow">
          <span class="flow-node">MCCB</span>
          <span class="flow-arrow">→</span>
          <span class="flow-node">電磁接触器</span>
          <span class="flow-arrow">→</span>
          <span class="flow-node flow-node--accent">サーマルリレー</span>
          <span class="flow-arrow">→</span>
          <span class="flow-node">モーター</span>
        </div>

        <!-- 運転条件別サーマル型式ガイド -->
        <div class="guide-section">
          <p class="guide-title">運転条件に応じたサーマルリレーの種類</p>
          <div class="guide-grid">
            <div class="guide-item guide-item--standard">
              <span class="guide-label">標準形（1E）</span>
              <span class="guide-desc">過負荷・拘束保護。通常の連続運転モーターに。</span>
            </div>
            <div class="guide-item guide-item--2e">
              <span class="guide-label">2E形（推奨）</span>
              <span class="guide-desc">過負荷・拘束＋<strong>欠相保護</strong>。欠相を早期検知。三相モーターの標準的な選択肢。</span>
            </div>
            <div class="guide-item">
              <span class="guide-label">遅動形</span>
              <span class="guide-desc">始動時間が長いモーター、重負荷始動用。</span>
            </div>
            <div class="guide-item">
              <span class="guide-label">特殊形</span>
              <span class="guide-desc">頻繁な寸動・インチング・間欠運転など。</span>
            </div>
          </div>
        </div>

        <!-- 欠相保護の補足 -->
        <div class="alert alert--info">
          <span class="alert-icon">ℹ️</span>
          <p class="alert-text">
            三相200Vの電動機では、<strong>欠相保護付き（2E形）</strong>のサーマルリレーを選定することを推奨します。
            欠相は標準形より早期に検知でき、モータの焼損リスクを大幅に低減できます。
          </p>
        </div>

        <!-- 選定値 -->
        <div class="info-row">
          <span class="label">推奨設定電流</span>
          <span class="value">{{ thermalInfo.settingCurrent }} A</span>
        </div>
        <div class="info-row">
          <span class="label">選定目安・調整範囲</span>
          <span class="value-sub">{{ thermalInfo.recommendedAmps }}</span>
        </div>
        <p class="description">{{ thermalInfo.description }}</p>

      </template>

      <!-- =====================================================
           パターン C: インバータ駆動
           → 電子サーマル内蔵。誤トリップ注意。
           ===================================================== -->
      <template v-else>

        <div class="info-row">
          <span class="label">推奨設定電流</span>
          <span class="value">{{ thermalInfo.settingCurrent }} A</span>
        </div>
        <div class="info-row">
          <span class="label">選定目安・調整範囲</span>
          <span class="value-sub">{{ thermalInfo.recommendedAmps }}</span>
        </div>
        <p class="description">{{ thermalInfo.description }}</p>

        <!-- インバータ固有の警告 -->
        <div v-if="thermalInfo.inverterWarning" class="alert alert--warning">
          <span class="alert-icon">⚠️</span>
          <p class="alert-text">{{ thermalInfo.inverterWarning }}</p>
        </div>

      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { ThermalSelectionResult } from '@/composables/useThermal';

defineProps<{
  thermalInfo: ThermalSelectionResult;
  /** Notice.vue から受け取る駆動モード */
  driveMode: 'direct' | 'inverter' | null;
  /** breakerInfo.selectedType をそのまま渡す */
  breakerSelectedType: 'motor_breaker' | 'mccb';
}>();
</script>

<style scoped>
/* ── カード外枠 ── */
.thermal-card {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 16px;
  color: #f8fafc;
}

/* ── ヘッダー ── */
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid #334155;
  padding-bottom: 8px;
}
.icon { font-size: 18px; }
.title {
  font-size: 15px;
  font-weight: 700;
  color: #38bdf8;
  margin: 0;
}

/* ── ボディ共通 ── */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── ステータスバナー ── */
.status-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
}
.status-banner--ok {
  background-color: rgba(16, 185, 129, 0.12);
  border: 1px solid #10b981;
}
.status-banner--required {
  background-color: rgba(239, 68, 68, 0.12);
  border: 1px solid #ef4444;
}
.status-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
.status-title {
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 4px 0;
}
.status-desc {
  font-size: 12px;
  color: #cbd5e1;
  line-height: 1.5;
  margin: 0;
}

/* ── 警告・情報アラート ── */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
}
.alert--warning {
  background-color: rgba(217, 119, 6, 0.15);
  border: 1px solid #d97706;
  color: #fbbf24;
}
.alert--info {
  background-color: rgba(2, 132, 199, 0.12);
  border: 1px solid #0284c7;
  color: #7dd3fc;
}
.alert-icon { font-size: 14px; flex-shrink: 0; margin-top: 2px; }
.alert-title {
  font-size: 12px;
  font-weight: 700;
  margin: 0 0 6px 0;
}
.alert-text {
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
}

/* ── チェックリスト（パターンA警告内） ── */
.check-list {
  margin: 6px 0 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.check-list li {
  font-size: 12px;
  line-height: 1.5;
  color: #fbbf24;
}
.check-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 99px;
  margin-right: 6px;
  white-space: nowrap;
}
.check-badge--yellow {
  background-color: rgba(234, 179, 8, 0.2);
  color: #fde047;
  border: 1px solid #ca8a04;
}

/* ── 接続構成フロー（パターンB） ── */
.circuit-flow {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background-color: #0f172a;
  border-radius: 8px;
  border: 1px solid #334155;
}
.flow-node {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  background-color: #1e293b;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #475569;
}
.flow-node--accent {
  color: #38bdf8;
  border-color: #38bdf8;
  background-color: rgba(56, 189, 248, 0.08);
}
.flow-arrow {
  font-size: 14px;
  color: #475569;
  flex-shrink: 0;
}

/* ── 運転条件ガイドグリッド（パターンB） ── */
.guide-section {
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px;
}
.guide-title {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  margin: 0 0 10px 0;
}
.guide-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
@media (max-width: 380px) {
  .guide-grid { grid-template-columns: 1fr; }
}
.guide-item {
  padding: 8px 10px;
  border-radius: 6px;
  background-color: #1e293b;
  border: 1px solid #334155;
}
.guide-item--standard { border-color: #475569; }
.guide-item--2e {
  border-color: #0284c7;
  background-color: rgba(2, 132, 199, 0.08);
}
.guide-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 4px;
}
.guide-item--2e .guide-label { color: #38bdf8; }
.guide-desc {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.4;
}
.guide-desc strong { color: #38bdf8; }

/* ── 情報行 ── */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #0f172a;
  padding: 8px 12px;
  border-radius: 8px;
}
.label { font-size: 13px; color: #94a3b8; }
.value { font-size: 16px; font-weight: 700; color: #38bdf8; }
.value-sub { font-size: 13px; font-weight: 600; color: #e2e8f0; }

/* ── 説明文 ── */
.description {
  font-size: 12px;
  color: #cbd5e1;
  line-height: 1.5;
  margin: 0;
}

/* ── 折りたたみ（パターンA 参考表示） ── */
.collapsible {
  background-color: #0f172a;
  border: 1px dashed #334155;
  border-radius: 8px;
  overflow: hidden;
}
.collapsible-summary {
  font-size: 12px;
  color: #64748b;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  list-style: none;
}
.collapsible-summary::-webkit-details-marker { display: none; }
.collapsible-summary::before {
  content: '▶ ';
  font-size: 10px;
}
details[open] .collapsible-summary::before { content: '▼ '; }
.collapsible-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 12px;
  border-top: 1px dashed #334155;
}

/* --- PC用レスポンシブ追加 --- */
@media (min-width: 768px) {
  .thermal-card {
    padding: 24px;
  }
  .card-header {
    margin-bottom: 20px;
    padding-bottom: 12px;
  }
  .title {
    font-size: 18px;
  }
  .status-banner {
    padding: 16px 20px;
  }
  .status-title {
    font-size: 15px;
  }
  .status-desc {
    font-size: 13px;
  }
  .guide-grid {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
  .info-row {
    padding: 12px 20px;
  }
  .label, .value-sub {
    font-size: 14px;
  }
  .value {
    font-size: 18px;
  }
  .alert {
    padding: 16px;
  }
  .check-list li {
    font-size: 13px;
  }
  .circuit-flow {
    padding: 14px 20px;
  }
  .flow-node {
    font-size: 13px;
    padding: 6px 14px;
  }
}
</style>