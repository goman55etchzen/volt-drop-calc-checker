// src/types/base.ts
import {
    CalculationInputMode,
    CableTypeCode,
    LoadType,
    InstallationType
  } from '@/appDefinitions'; // 実際のパスに合わせて調整してください
  
  // ==========================================
  // Base UI コンポーネント Props / Emits インターフェース
  // ==========================================
  
  export interface BaseSelectProps {
    modelValue: string;
    options: { label: string; value: string }[];
  }
  
  export interface BaseSelectEmits {
    (e: 'update:modelValue', value: string): void;
    (e: 'change'): void;
  }
  
  export interface WireSizeSelectProps {
    selectedWireName: string;
    isOpen: boolean;
  }
  
  export interface WireSizeSelectEmits {
    (e: 'update:selectedWireName', name: string): void;
    (e: 'open'): void;
    (e: 'close'): void;
  }
  
  export interface WireTypeSelectProps {
    modelValue: string;
  }
  
  export interface WireTypeSelectEmits {
    (e: 'update:modelValue', value: string): void;
    (e: 'change'): void;
  }
  
  export interface ResultCardProps {
    maxLen: number;
    isOverCurrent: boolean;
  }
  
  export interface ReversedResultProps {
    voltage: number;
    targetPercent: number;
    inputMode: CalculationInputMode;
    loadWatt: number;
    loadCurrent: number;
    oneWayDistance: number;
    selectedSystemId: string;
    selectedCableType: CableTypeCode;
    powerFactor: number;
    ignorePowerFactor: boolean;
    loadType: LoadType;
    motorKw: number;
    installationType: InstallationType;
    isContinuous: boolean;
  }