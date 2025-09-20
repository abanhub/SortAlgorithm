import { ArrayElement } from '@/components/sorting/types';

const DEFAULT_MIN = 10;
const DEFAULT_MAX = 300;

export interface ArrayGenerationOptions {
  size: number;
  min?: number;
  max?: number;
}

export const createRandomArray = ({ size, min = DEFAULT_MIN, max = DEFAULT_MAX }: ArrayGenerationOptions): ArrayElement[] => {
  const clampedSize = Math.max(1, Math.min(500, size));
  const clampedMin = Math.max(0, Math.min(min, max));
  const clampedMax = Math.max(clampedMin + 1, max);

  return Array.from({ length: clampedSize }, (_, index) => ({
    value: Math.floor(Math.random() * (clampedMax - clampedMin)) + clampedMin,
    id: index,
    state: 'default' as const,
  }));
};
