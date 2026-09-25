// src/types/base.ts
import {
  CalculationInputMode,
  CableTypeCode,
  LoadType,
  InstallationType
} from './appDefinitions';

// ==========================================
// Base UI コンポーネント Props / Emits インターフェース
// ==========================================

export interface BaseSelectOption {
  label: string;
  value: string | number;
}

export interface BaseSelectProps {
  modelValue: string | number;
  options: BaseSelectOption[];
  disabled?: boolean;
}

export interface BaseSelectEmits {
  (e: 'update:modelValue', value: string | number): void;
  (e: 'change', value?: string | number): void;
}

export interface WireSizeSelectProps {
  selectedWireName: string;
  isOpen: boolean;
  options?: string[];
}

export interface WireSizeSelectEmits {
  (e: 'update:selectedWireName', name: string): void;
  (e: 'open'): void;
  (e: 'close'): void;
  (e: 'select', name: string): void;
}

export interface WireTypeSelectProps {
  modelValue: CableTypeCode | string;
  disabled?: boolean;
}

export interface WireTypeSelectEmits {
  (e: 'update:modelValue', value: CableTypeCode | string): void;
  (e: 'change', value?: CableTypeCode | string): void;
}

export interface ResultCardProps {
  maxLen: number;
  isOverCurrent: boolean;
  title?: string;
  allowableCurrent?: number;
  voltageDrop?: number;
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
  wireCount?: number;
  ambientTemp?: number;
}