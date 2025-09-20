export interface ArrayElement {
  value: number;
  id: number;
  state: 'default' | 'comparing' | 'swapping' | 'sorted' | 'pivot' | 'current' | 'selected';
  highlighted?: boolean;
  position?: { x: number; y: number };
}

export interface SortingStep {
  array: ArrayElement[];
  message: string;
  indices: number[];
  action: 'compare' | 'swap' | 'select' | 'sort' | 'pivot';
  stats: SortingStats;
  swapPair?: { from: number; to: number };
}

export interface SortingStats {
  comparisons: number;
  swaps: number;
  timeElapsed: number;
  progress: number;
  currentStep: number;
  totalSteps: number;
}

export type SortingAlgorithm =
  | 'bubble'
  | 'selection'
  | 'insertion'
  | 'merge'
  | 'quick'
  | 'heap'
  | 'shell'
  | 'cocktail';

export interface AlgorithmDefinition {
  label: string;
  variants?: Record<string, string>;
  defaultVariant?: string;
}

export const ALGORITHMS: Record<SortingAlgorithm, AlgorithmDefinition> = {
  bubble: { label: 'Bubble Sort' },
  selection: { label: 'Selection Sort' },
  insertion: { label: 'Insertion Sort' },
  merge: {
    label: 'Merge Sort',
    variants: {
      topDown: 'Top-down (recursive)',
      bottomUp: 'Bottom-up (iterative)'
    },
    defaultVariant: 'topDown'
  },
  quick: {
    label: 'Quick Sort',
    variants: {
      lomuto: 'Lomuto partition',
      hoare: 'Hoare partition'
    },
    defaultVariant: 'lomuto'
  },
  heap: { label: 'Heap Sort' },
  shell: {
    label: 'Shell Sort',
    variants: {
      ciura: 'Ciura gap sequence',
      knuth: 'Knuth gap sequence'
    },
    defaultVariant: 'ciura'
  },
  cocktail: { label: 'Cocktail Shaker Sort' }
};

export const getAlgorithmLabel = (algorithm: SortingAlgorithm): string =>
  ALGORITHMS[algorithm]?.label ?? algorithm;

export const getAlgorithmVariantLabel = (
  algorithm: SortingAlgorithm,
  variant: string | null | undefined
): string | null => {
  if (!variant) return null;
  const definition = ALGORITHMS[algorithm];
  if (!definition?.variants) return null;
  return definition.variants[variant] ?? null;
};

export const getDefaultVariant = (algorithm: SortingAlgorithm): string | null => {
  const definition = ALGORITHMS[algorithm];
  if (!definition?.variants) return null;
  if (definition.defaultVariant && definition.variants[definition.defaultVariant]) {
    return definition.defaultVariant;
  }
  const [first] = Object.keys(definition.variants);
  return first ?? null;
};

export type VisualizationMode = 'bars' | 'circles' | 'lines' | 'matrix';

export const VISUALIZATION_MODES = {
  bars: 'Bar Chart',
  circles: 'Bubble Diagram',
  lines: 'Line Graph',
  matrix: 'Grid View'
};

export const COLOR_THEMES = {
  default: { comparing: '#3b82f6', swapping: '#ef4444', sorted: '#10b981', pivot: '#f59e0b', current: '#8b5cf6' },
  ocean: { comparing: '#0ea5e9', swapping: '#06b6d4', sorted: '#059669', pivot: '#d97706', current: '#7c3aed' },
  sunset: { comparing: '#f97316', swapping: '#dc2626', sorted: '#16a34a', pivot: '#ca8a04', current: '#9333ea' },
  neon: { comparing: '#00ffff', swapping: '#ff0080', sorted: '#00ff00', pivot: '#ffff00', current: '#ff8000' }
};

export interface SortingConfig {
  arraySize: number[];
  speed: number[];
  animationSpeed: number[];
  algorithm: SortingAlgorithm;
  algorithmVariant: string | null;
  visualizationMode: VisualizationMode;
  colorTheme: keyof typeof COLOR_THEMES;
  showStepByStep: boolean;
  soundEnabled: boolean;
}

export interface SortingState {
  array: ArrayElement[];
  sortingSteps: SortingStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  stats: SortingStats;
  currentMessage: string;
}
