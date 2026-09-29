// src/base/cableBase.ts

import {
    CableTypeCode,
    CableSpec,
    WireSize,
    SystemType,
    AvailableWireResult,
    CABLE_SPECS,
    CABLE_TYPES,
    SYSTEM_DEFINITIONS,
    WIRE_SIZES,
    calculateAllowableCurrent
  } from '@/types/appDefinitions';
  
  export interface VoltageDropParams {
    systemId: string;
    current: number;
    distance: number;
    wireSizeName: string;
    powerFactor?: number;
    useImpedance?: boolean;
  }
  
  export interface WireSelectionParams {
    systemId: string;
    voltage: number;
    targetDropPercent: number;
    current: number;
    distance: number;
    cableType: CableTypeCode;
    ambientTemp?: number;
    wireCount?: number;
    parallelCount?: number;
    powerFactor?: number;
  }
  
  export class CableBase {
    public static getSystem(systemId: string): SystemType {
      return (
        SYSTEM_DEFINITIONS.find((s) => s.id === systemId) || SYSTEM_DEFINITIONS[0]
      );
    }
  
    public static getCableSpec(wireSizeName: string): CableSpec | undefined {
      return CABLE_SPECS.find((spec) => spec.size === wireSizeName);
    }
  
    public static getWireSize(wireSizeName: string): WireSize | undefined {
      return WIRE_SIZES.find((w) => w.name === wireSizeName);
    }
  
    public static isValidWireSize(wireSizeName: string): boolean {
      return WIRE_SIZES.some((w) => w.name === wireSizeName);
    }
  
    public static getAdjacentWireSize(
      currentWireName: string,
      step: 'next' | 'prev'
    ): string {
      const index = WIRE_SIZES.findIndex((w) => w.name === currentWireName);
      if (index === -1) return currentWireName;
  
      if (step === 'next' && index < WIRE_SIZES.length - 1) {
        return WIRE_SIZES[index + 1].name;
      }
      if (step === 'prev' && index > 0) {
        return WIRE_SIZES[index - 1].name;
      }
      return currentWireName;
    }
  
    /**
     * 1. 電圧降下 e (V) の計算
     */
    public static calculateVoltageDrop(params: VoltageDropParams): number {
      const {
        systemId,
        current,
        distance,
        wireSizeName,
        powerFactor = 1.0,
        useImpedance = false
      } = params;
  
      if (current <= 0 || distance <= 0) return 0;
  
      const system = this.getSystem(systemId);
      const spec = this.getCableSpec(wireSizeName);
  
      if (useImpedance && spec) {
        const cosTheta = Math.min(Math.max(powerFactor, 0), 1.0);
        const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
        const impedanceTerm = spec.r * cosTheta + spec.x * sinTheta;
  
        return system.kFactor * current * (distance / 1000) * impedanceTerm;
      } else {
        const wire = this.getWireSize(wireSizeName);
        const area = wire ? wire.area : spec ? spec.area : 0;
  
        if (area <= 0 || system.k <= 0) return 0;
  
        return (system.k * current * distance) / (1000 * area);
      }
    }
  
    /**
     * 2. 許容電圧降下を満たす最大配線長 L (m) の計算
     */
    public static calculateMaxDistance(
      voltage: number,
      targetPercent: number,
      current: number,
      wireSizeName: string,
      systemId: string
    ): number {
      if (voltage <= 0 || targetPercent <= 0 || current <= 0) return 0;
  
      const system = this.getSystem(systemId);
      const wire = this.getWireSize(wireSizeName);
      const spec = this.getCableSpec(wireSizeName);
      const area = wire ? wire.area : spec ? spec.area : 0;
  
      if (area <= 0 || system.k <= 0) return 0;
  
      const allowDropV = voltage * (targetPercent / 100);
      return (allowDropV * 1000 * area) / (system.k * current);
    }
  
    /**
     * 3. 周囲温度・管内電線数等の補正適用後 許容電流 (A) の算出
     */
    public static getAllowableCurrent(
      cableType: CableTypeCode,
      wireSizeName: string,
      ambientTemp: number = 30,
      wireCount: number = 1,
      parallelCount: number = 1
    ): { k1: number; k2: number; singleAllowAmp: number; totalAllowAmp: number } {
      const spec = this.getCableSpec(wireSizeName);
      let baseAllowAmp = spec?.baseAllowAmp[cableType] ?? 0;
  
      // CABLE_SPECS に定義がない場合は CABLE_TYPES の limits テーブルを参照（フォールバック）
      if (baseAllowAmp === 0) {
        const cableDef = CABLE_TYPES.find((c) => c.id === cableType);
        if (cableDef && cableDef.limits[wireSizeName] !== undefined) {
          baseAllowAmp = cableDef.limits[wireSizeName];
        }
      }
  
      const cableDef = CABLE_TYPES.find((c) => c.id === cableType);
      const maxTemp = cableDef ? cableDef.maxTemp : 60;
  
      return calculateAllowableCurrent({
        baseAllowAmp,
        maxTemp,
        ambientTemp,
        wireCount,
        parallelCount
      });
    }
  
    /**
     * 4. 全電線サイズの適合性評価
     */
    public static evaluateAllWireSizes(params: WireSelectionParams): AvailableWireResult[] {
      const {
        systemId,
        voltage,
        targetDropPercent,
        current,
        distance,
        cableType,
        ambientTemp = 30,
        wireCount = 1,
        parallelCount = 1
      } = params;
  
      const allowDropV = voltage * (targetDropPercent / 100);
  
      return CABLE_SPECS.map((spec) => {
        const allowCurrentResult = this.getAllowableCurrent(
          cableType,
          spec.size,
          ambientTemp,
          wireCount,
          parallelCount
        );
  
        const system = this.getSystem(systemId);
        const maxAmpereByDrop =
          distance > 0 && system.k > 0
            ? (allowDropV * 1000 * spec.area) / (system.k * distance)
            : Infinity;
  
        const allowAmpereByHeat = allowCurrentResult.totalAllowAmp;
        const effectiveMaxAmp = Math.min(maxAmpereByDrop, allowAmpereByHeat);
  
        const isOkForLoad =
          allowAmpereByHeat > 0 &&
          effectiveMaxAmp >= current &&
          allowAmpereByHeat >= current;
  
        return {
          wireName: spec.size,
          area: spec.area,
          maxAmpereByDrop: Number(maxAmpereByDrop.toFixed(1)),
          allowAmpereByHeat,
          effectiveMaxAmp: Number(effectiveMaxAmp.toFixed(1)),
          isOkForLoad
        };
      });
    }
  
    /**
     * 5. 条件を充足する最小（最適）電線サイズの判定
     */
    public static selectSuitableWireSize(params: WireSelectionParams): AvailableWireResult | null {
      const results = this.evaluateAllWireSizes(params);
      return results.find((r) => r.isOkForLoad) || null;
    }
  }