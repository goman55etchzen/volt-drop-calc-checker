// src/types/base.ts
import {
  CalculationInputMode,
  CableTypeCode,
  LoadType,
  InstallationType
} from '@/types/appDefinitions';
import type { CapacitorProduct } from '@/base/capacitorBase';
import type { 
  MotorBreakerSelectionResult, 
  ElcbSelectionResult 
} from '@/types/appDefinitions';

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

export interface CapacitorSectionCardProps {
  voltage: number;
  hz: number;
  targetUf: number;
  catalog: CapacitorProduct[];
  recommendedCapacitors: CapacitorProduct[];
  loading?: boolean;
}

export interface NoticeProps {
  driveMode: 'direct' | 'inverter' | null;
  calculatedAmp: number;
  motorCount: number;
  otherLoadAmp: number;
  voltage: number;
  motorKw: number;
  frequency: number;
  showDetails: boolean;
  breakerInfo: MotorBreakerSelectionResult;
  elcbInfo: ElcbSelectionResult;
  thermalInfo: any;
  recommendedInstallation: string;
  recommendedCapacitors: CapacitorProduct[];
  catalog: CapacitorProduct[];
  targetUf: number;
}