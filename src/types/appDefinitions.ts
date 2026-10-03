// src/types/appDefinitions.ts

// ==========================================
// 1. アプリ共通状態・UIロジック型
// ==========================================

export type AppMode = "normal" | "reversed" | "motor";

export type EquipmentInputMode =
  | "device_watt"
  | "device_amp"
  | "breaker_limit";

export type CalculationInputMode = "amp" | "watt";

export type LoadType = "general" | "motor";

export interface CalculationIssue {
  level: "error" | "warning" | "info";
  code: string;
  title: string;
  message: string;
}

// ==========================================
// 2. 各 base.ts の公開窓口
//    定義元は各 base.ts に一本化
// ==========================================

export * from "@/base/cableBase";
export * from "@/base/breakerBase";
export * from "@/base/capacitorBase";
export * from "@/base/airconBase";
export * from "@/base/irvoltBase";
export * from "@/base/motorBase";
