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

        <!-- 確認推奨事項（視認性を向上させた警告ボックス） -->
        <div class="alert alert--warning alert-highlight">
          <span class="alert-icon">⚠️</span>
          <div>
            <p class="alert-title font-bold text-amber-300">ただし、以下の場合は製品仕様を必ず確認してください</p>
            <ul class="check-list">
              <li>
                <span class="check-badge check-badge--yellow">欠相保護</span>
                欠相保護が必要な場合 → 選定したモーターブレーカーに欠相保護機能があるか確認。ない場合は 2E形サーマルリレーの追加を検討。
              </li>
              <li>
                <span class="check-badge check-badge--yellow">特殊始動</span>
                始動時間が長い・頻繁な寸動／間欠運転など特殊な運転条件がある場合 → モーターブレーカーの保護特性が適合しているか確認。
              </li>
              <li>
                <span class="check-badge check-badge--yellow">電磁接触器</span>
                運転・停止を電磁接触器で行い、過負荷時に電磁接触器を開路したい場合 → 電磁接触器＋サーマルリレーの構成を検討。
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
            欠相は標準形より早期に検知でき、モータの焼損リスクを大幅に軽減できます。
          </p>
        </div>

        <!-- 視認性を高めた選定値ボックス -->
        <div class="result-highlight-box">
          <div class="info-row">
            <span class="label">推奨設定電流</span>
            <span class="value">{{ thermalInfo.settingCurrent }} A</span>
          </div>
          <div class="info-row mt-2">
            <span class="label">選定目安・調整範囲</span>
            <span class="value-sub">{{ thermalInfo.recommendedAmps }}</span>
          </div>
          <p class="description mt-2">{{ thermalInfo.description }}</p>
        </div>

      </template>

      <!-- =====================================================
           パターン C: インバータ駆動
           ===================================================== -->
      <template v-else>

        <!-- 視認性を高めた選定値ボックス -->
        <div class="result-highlight-box">
          <div class="info-row">
            <span class="label">推奨設定電流</span>
            <span class="value">{{ thermalInfo.settingCurrent }} A</span>
          </div>
          <div class="info-row mt-2">
            <span class="label">選定目安・調整範囲</span>
            <span class="value-sub">{{ thermalInfo.recommendedAmps }}</span>
          </div>
          <p class="description mt-2">{{ thermalInfo.description }}</p>
        </div>

        <!-- インバータ固有の警告（視認性を向上させたハイライト表示） -->
        <div v-if="thermalInfo.inverterWarning" class="alert alert--warning alert-highlight">
          <span class="alert-icon">⚠️</span>
          <div>
            <p class="alert-title font-bold text-amber-300">インバータ二次側サーマル設置時の重要注意</p>
            <p class="alert-text">{{ thermalInfo.inverterWarning }}</p>
          </div>
        </div>

      </template>

      <!-- =====================================================
           全パターン共通：実務上の注意事項・特殊条件チェック (8項目)
           ===================================================== -->
      <details class="collapsible field-notes-collapsible mt-2">
        <summary class="collapsible-summary summary-highlight">
          📋 実務上の注意事項・外部サーマル（THR）検討チェック（8項目）
        </summary>
        <div class="collapsible-body">
          <p class="field-notes-intro">以下の条件に1つでも該当（YES）する場合は、外部サーマルリレーの設置または選定の見直しを強く推奨します。</p>
          <div class="field-checks-grid">
            <div class="check-card">
              <span class="check-no">①</span>
              <div class="check-content">
                <span class="check-title">1台のINVで複数モータを駆動？</span>
                <span class="check-action action-yes">YES → ほぼ必須（個別に設置）</span>
              </div>
            </div>
            <div class="check-card">
              <span class="check-no">②</span>
              <div class="check-content">
                <span class="check-title">INV容量がモータ容量より大幅に大きい？</span>
                <span class="check-action action-yes">YES → 外部サーマル設置を検討</span>
              </div>
            </div>
            <div class="check-card">
              <span class="check-no">③</span>
              <div class="check-content">
                <span class="check-title">特殊・多極（多極変極など）モータ？</span>
                <span class="check-action action-yes">YES → 保護特性の適合を検討</span>
              </div>
            </div>
            <div class="check-card">
              <span class="check-no">④</span>
              <div class="check-content">
                <span class="check-title">低周波数（低速）での長時間連続運転？</span>
                <span class="check-action action-yes">YES → モータ冷却方式（外部ファン等）の確認</span>
              </div>
            </div>
            <div class="check-card">
              <span class="check-no">⑤</span>
              <div class="check-content">
                <span class="check-title">頻繁な寸動・インチング・間欠運転？</span>
                <span class="check-action action-yes">YES → 特殊形・動作特性の確認</span>
              </div>
            </div>
            <div class="check-card">
              <span class="check-no">⑥</span>
              <div class="check-content">
                <span class="check-title">商用バイパス回路（切り替え運転）あり？</span>
                <span class="check-action action-yes">YES → 商用回路側にバイパス保護を構成</span>
              </div>
            </div>
            <div class="check-card">
              <span class="check-no">⑦</span>
              <div class="check-content">
                <span class="check-title">客先・プラント仕様書でTHR設置指定？</span>
                <span class="check-action action-yes">YES → 指定通り設置</span>
              </div>
            </div>
            <div class="check-card">
              <span class="check-no">⑧</span>
              <div class="check-content">
                <span class="check-title">特殊な過負荷・欠相保護要件がある？</span>
                <span class="check-action action-yes">YES → 2E形または外部保護リレーを検討</span>
              </div>
            </div>
          </div>
        </div>
      </details>

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
  gap: 12px;
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

/* ── 警告・情報アラート（視認性向上） ── */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
}
.alert--warning {
  background-color: rgba(217, 119, 6, 0.18);
  border: 1px solid #f59e0b;
  color: #fde68a;
}
.alert--info {
  background-color: rgba(2, 132, 199, 0.12);
  border: 1px solid #0284c7;
  color: #7dd3fc;
}
.alert-highlight {
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);
}
.alert-icon { font-size: 16px; flex-shrink: 0; margin-top: 2px; }
.alert-title {
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 4px 0;
}
.alert-text {
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
  color: #fef3c7;
}

/* ── 強調結果ボックス ── */
.result-highlight-box {
  background-color: #0f172a;
  border: 1px solid #475569;
  border-radius: 10px;
  padding: 14px;
}

/* ── チェックリスト（警告内）ガイド ── */
.check-list {
  margin: 6px 0 0 0;
  padding-left: 16px;
  list-style: disc;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.check-list li {
  font-size: 12px;
  line-height: 1.5;
  color: #fef3c7;
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
  background-color: rgba(234, 179, 8, 0.25);
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
  background-color: rgba(56, 189, 248, 0.1);
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
}
.label { font-size: 13px; color: #94a3b8; }
.value { font-size: 18px; font-weight: 800; color: #38bdf8; }
.value-sub { font-size: 13px; font-weight: 700; color: #e2e8f0; }

/* ── 説明文 ── */
.description {
  font-size: 12px;
  color: #cbd5e1;
  line-height: 1.5;
  margin: 0;
}

/* ── 折りたたみ（共通スタイル） ── */
.collapsible {
  background-color: #0f172a;
  border: 1px dashed #334155;
  border-radius: 8px;
  overflow: hidden;
}
.collapsible-summary {
  font-size: 12px;
  color: #94a3b8;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  list-style: none;
  font-weight: 600;
}
.collapsible-summary::-webkit-details-marker { display: none; }
.collapsible-summary::before {
  content: '▶ ';
  font-size: 10px;
  color: #38bdf8;
}
details[open] .collapsible-summary::before { content: '▼ '; }
.collapsible-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-top: 1px dashed #334155;
}

/* ── 実務上の注意事項用スタイル ── */
.field-notes-collapsible {
  border-style: solid;
  border-color: #0284c7;
  background-color: #0f172a;
}
.summary-highlight {
  color: #38bdf8;
  background-color: rgba(2, 132, 199, 0.1);
  font-weight: 700;
}
.field-notes-intro {
  font-size: 11px;
  color: #cbd5e1;
  margin: 0 0 6px 0;
  line-height: 1.4;
}
.field-checks-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}
.check-card {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background-color: #1e293b;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #334155;
}
.check-no {
  font-size: 12px;
  font-weight: bold;
  color: #38bdf8;
  flex-shrink: 0;
}
.check-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.check-title {
  font-size: 12px;
  font-weight: bold;
  color: #f8fafc;
}
.check-action {
  font-size: 11px;
  font-weight: 600;
}
.action-yes {
  color: #fbbf24;
}

.mt-2 { margin-top: 8px; }

/* --- PC用レスポンシブ拡張 --- */
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
  .field-checks-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .value {
    font-size: 20px;
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