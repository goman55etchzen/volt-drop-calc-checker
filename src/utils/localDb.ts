// src/utils/localDb.ts
import type { PowerFrequency } from '@/types/appDefinitions';

const STORAGE_KEYS = {
  FREQUENCY: 'app_motor_calc_frequency',
} as const;

/**
 * 将来のIndexedDB（サーマルリレー/コンデンサ検索機能）を見据えた
 * ローカルデータアクセス・ストレージ管理モジュール
 */
export const localDb = {
  // ==========================================
  // 1. 同期データ (設定・ユーザー環境保持: localStorage)
  // ==========================================
  
  /** 保持された周波数を取得 (未設定時は null) */
  getFrequency(): PowerFrequency | null {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.FREQUENCY);
      if (val === '50' || val === '60') {
        return Number(val) as PowerFrequency;
      }
    } catch (e) {
      console.warn('localStorage read error:', e);
    }
    return null;
  },

  /** 周波数を永続化保存 */
  setFrequency(freq: PowerFrequency): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FREQUENCY, String(freq));
    } catch (e) {
      console.warn('localStorage write error:', e);
    }
  },

  // ==========================================
  // 2. 将来拡張用非同期データ (IndexedDB カタログ検索インターフェース)
  // ==========================================
  
  /**
   * [将来拡張] サーマルリレーカタログのIndexedDB検索
   */
  async searchThermalRelays(params: { current: number; driveMode: string }) {
    // TODO: Dexie.js等のIndexedDBインスタンスから条件検索を実施するロジックをここに集約
    console.log('[localDb] IndexedDB Thermal search stub:', params);
    return [];
  },

  /**
   * [将来拡張] 進相コンデンサカタログのIndexedDB検索
   */
  async searchCapacitors(params: { voltage: number; frequency: number; targetUf: number }) {
    // TODO: Dexie.js等のIndexedDBインスタンスから最適容量グループをクエリ検索
    console.log('[localDb] IndexedDB Capacitor search stub:', params);
    return [];
  }
};