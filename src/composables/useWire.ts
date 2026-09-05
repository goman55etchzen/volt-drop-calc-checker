import { ref } from 'vue';

export interface CableType {
  id: string;
  name: string;
  desc: string;
  limits: Record<string, number>;
}

export const CABLE_TYPES: CableType[] = [
  {
    id: 'iv',
    name: 'IV (ビニル絶縁電線)',
    desc: '屋内配線用 絶縁電線 (耐熱 60℃)',
    limits: {
      '1.6mm': 27,
      '2.0mm': 35,
      '2.6mm': 48,
      '2.0 sq': 27,
      '3.5 sq': 37,
      '5.5 sq': 49,
      '8.0 sq': 61,
      '14.0 sq': 88,
    },
  },
  {
    id: 'vvf',
    name: 'VVF / VVR (VV)',
    desc: 'ビニル外装平形/丸形ケーブル (耐熱 60℃)',
    limits: {
      '1.6mm': 18,
      '2.0mm': 24,
      '2.6mm': 35,
      '2.0 sq': 19,
      '3.5 sq': 27,
      '5.5 sq': 37,
      '8.0 sq': 49,
      '14.0 sq': 69,
    },
  },
  {
    id: 'cv',
    name: 'CV / CVT / CVR',
    desc: '架橋ポリエチレン (耐熱 90℃)',
    limits: {
      '1.6mm': 24,
      '2.0mm': 33,
      '2.6mm': 47,
      '2.0 sq': 24,
      '3.5 sq': 33,
      '5.5 sq': 46,
      '8.0 sq': 61,
      '14.0 sq': 88,
    },
  },
];

export function useWire() {
  const selectedCableId = ref<string>('iv');
  return { selectedCableId, CABLE_TYPES };
}
