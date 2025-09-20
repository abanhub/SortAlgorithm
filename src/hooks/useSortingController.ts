import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useSortingAudio } from '@/hooks/useSortingAudio';
import { createRandomArray } from '@/lib/sorting/array';
import { generateSortingSteps } from '@/lib/sorting/generateSortingSteps';
import {
  ALGORITHMS,
  ArrayElement,
  SortingAlgorithm,
  SortingConfig,
  SortingState,
  SortingStep,
  SortingStats,
  getAlgorithmLabel,
  getAlgorithmVariantLabel,
  getDefaultVariant,
} from '@/components/sorting/types';

type SwapPair = { from: number; to: number } | null;

const createInitialStats = (): SortingStats => ({
  comparisons: 0,
  swaps: 0,
  timeElapsed: 0,
  progress: 0,
  currentStep: 0,
  totalSteps: 0,
});

const getAlgorithmDisplayName = (algorithm: SortingAlgorithm, variant: string | null): string => {
  const algorithmLabel = getAlgorithmLabel(algorithm);
  const variantLabel = variant ? getAlgorithmVariantLabel(algorithm, variant) : null;
  return variantLabel ? `${algorithmLabel} (${variantLabel})` : algorithmLabel;
};

const INITIAL_CONFIG: SortingConfig = {
  arraySize: [30],
  speed: [50],
  animationSpeed: [300],
  algorithm: 'bubble',
  algorithmVariant: getDefaultVariant('bubble'),
  visualizationMode: 'bars',
  colorTheme: 'default',
  showStepByStep: false,
  soundEnabled: true,
};

const INITIAL_STATE: SortingState = {
  array: [],
  sortingSteps: [],
  currentStepIndex: 0,
  isPlaying: false,
  isPaused: false,
  stats: createInitialStats(),
  currentMessage: 'Ready to sort',
};

interface SortingController {
  config: SortingConfig;
  state: SortingState;
  customArray: string;
  showCustomInput: boolean;
  currentSwapIndices: SwapPair;
  setCustomArray: (value: string) => void;
  setShowCustomInput: (value: boolean) => void;
  handleConfigChange: (config: Partial<SortingConfig>) => void;
  handlePlayPause: () => void;
  handleReset: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  generateArray: () => void;
  handleCustomArray: (values: string) => void;
  handleSwapComplete: () => void;
}

export const useSortingController = (): SortingController => {
  const [config, setConfig] = useState<SortingConfig>(INITIAL_CONFIG);
  const [state, setState] = useState<SortingState>(INITIAL_STATE);
  const [customArray, setCustomArray] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [currentSwapIndices, setCurrentSwapIndices] = useState<SwapPair>(null);

  const animationTimeoutRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  const configRef = useRef(config);
  const swapRef = useRef<SwapPair>(currentSwapIndices);

  const { playSound } = useSortingAudio({ enabled: config.soundEnabled });

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    swapRef.current = currentSwapIndices;
  }, [currentSwapIndices]);

  const clearAnimationTimer = useCallback(() => {
    if (animationTimeoutRef.current !== null) {
      window.clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  }, []);

  const createArray = useCallback(
    (size: number, message?: string) => {
      const newArray = createRandomArray({ size });
      setState(prev => ({
        ...prev,
        array: newArray,
        sortingSteps: [],
        currentStepIndex: 0,
        isPlaying: false,
        isPaused: false,
        stats: createInitialStats(),
        currentMessage: message ?? `Array generated with ${newArray.length} elements. Ready to sort.`,
      }));
      setCurrentSwapIndices(null);
      clearAnimationTimer();
    },
    [clearAnimationTimer]
  );

  const generateArray = useCallback(() => {
    createArray(configRef.current.arraySize[0]);
  }, [createArray]);

  const prepareSteps = useCallback((): SortingStep[] => {
    const steps = generateSortingSteps(
      stateRef.current.array,
      configRef.current.algorithm,
      configRef.current.algorithmVariant
    );
    setState(prev => ({
      ...prev,
      sortingSteps: steps,
      currentStepIndex: 0,
      stats: {
        ...createInitialStats(),
        totalSteps: steps.length,
      },
      currentMessage: `Starting ${getAlgorithmDisplayName(
        configRef.current.algorithm,
        configRef.current.algorithmVariant
      )}`,
    }));
    return steps;
  }, []);

  const finishRun = useCallback(
    (stats?: SortingStats) => {
      const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : stats?.timeElapsed ?? 0;
      const finalStats: SortingStats = stats
        ? { ...stats, timeElapsed: elapsed }
        : { ...stateRef.current.stats, timeElapsed: elapsed };

      const displayName = getAlgorithmDisplayName(
        configRef.current.algorithm,
        configRef.current.algorithmVariant
      );

      setState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        stats: finalStats,
        currentMessage: `${displayName} completed! ${finalStats.comparisons} comparisons, ${finalStats.swaps} swaps, ${(elapsed / 1000).toFixed(1)}s`,
      }));

      playSound(880, 300, 'complete');
      toast.success(
        `${displayName} completed! ${finalStats.comparisons} comparisons, ${finalStats.swaps} swaps, ${(elapsed / 1000).toFixed(1)}s`,
        { duration: 5000 }
      );
      startTimeRef.current = null;
    },
    [playSound]
  );

  const playAnimation = useCallback(() => {
    const currentState = stateRef.current;
    const currentConfig = configRef.current;

    if (!currentState.isPlaying || currentState.currentStepIndex >= currentState.sortingSteps.length) {
      if (currentState.currentStepIndex >= currentState.sortingSteps.length && currentState.sortingSteps.length > 0) {
        const lastStep = currentState.sortingSteps[currentState.sortingSteps.length - 1];
        finishRun(lastStep?.stats);
      }
      return;
    }

    const currentStep = currentState.sortingSteps[currentState.currentStepIndex];
    if (!currentStep) return;

    setState(prev => ({
      ...prev,
      array: currentStep.array,
      currentMessage: currentStep.message,
      stats: {
        ...currentStep.stats,
        timeElapsed: startTimeRef.current ? Date.now() - startTimeRef.current : 0,
      },
      currentStepIndex: prev.currentStepIndex + 1,
    }));

    if (currentStep.action === 'swap' && currentStep.swapPair) {
      setCurrentSwapIndices(currentStep.swapPair);
      const baseValue = currentStep.array[currentStep.indices[0]]?.value ?? 0;
      playSound(600 + baseValue, currentConfig.animationSpeed[0], 'swap');
      return;
    }

    if (currentStep.action === 'compare') {
      const baseValue = currentStep.array[currentStep.indices[0]]?.value ?? 0;
      playSound(400 + baseValue, 120, 'compare');
    }

    if (currentState.isPlaying && !currentConfig.showStepByStep) {
      const delay = Math.max(50, 1100 - currentConfig.speed[0] * 10);
      animationTimeoutRef.current = window.setTimeout(playAnimation, delay);
    }
  }, [finishRun, playSound]);

  const resumeVisualization = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
    animationTimeoutRef.current = window.setTimeout(playAnimation, 10);
  }, [playAnimation]);

  const startVisualization = useCallback(() => {
    const currentState = stateRef.current;

    if (currentState.currentStepIndex >= currentState.sortingSteps.length && currentState.sortingSteps.length > 0) {
      toast.info('Algorithm already completed! Click Reset to start over.');
      return;
    }

    let steps = currentState.sortingSteps;
    if (steps.length === 0) {
      steps = prepareSteps();
    }

    if (steps.length === 0) {
      toast.error('Unable to generate steps for the selected algorithm.');
      return;
    }

    setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
    startTimeRef.current = Date.now();
    toast.success(
      `${getAlgorithmDisplayName(configRef.current.algorithm, configRef.current.algorithmVariant)} started!`
    );

    animationTimeoutRef.current = window.setTimeout(playAnimation, 10);
  }, [playAnimation, prepareSteps]);

  const pauseVisualization = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: true,
      currentMessage: `Paused at step ${prev.currentStepIndex}/${prev.stats.totalSteps}`,
    }));
    clearAnimationTimer();
    toast.info('Paused');
  }, [clearAnimationTimer]);

  const handlePlayPause = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.isPlaying) {
      pauseVisualization();
      return;
    }

    if (currentState.isPaused && currentState.sortingSteps.length > 0 && currentState.currentStepIndex < currentState.sortingSteps.length) {
      resumeVisualization();
      return;
    }

    startVisualization();
  }, [pauseVisualization, resumeVisualization, startVisualization]);

  const handleReset = useCallback(() => {
    clearAnimationTimer();
    const size = configRef.current.arraySize[0];
    const displayName = getAlgorithmDisplayName(
      configRef.current.algorithm,
      configRef.current.algorithmVariant
    );
    createArray(size, `Reset complete. Array size: ${size}, Algorithm: ${displayName}`);
    toast.success('Reset complete');
  }, [clearAnimationTimer, createArray]);

  const stepForward = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.currentStepIndex >= currentState.sortingSteps.length) return;
    const nextStep = currentState.sortingSteps[currentState.currentStepIndex];
    if (!nextStep) return;

    setState(prev => ({
      ...prev,
      array: nextStep.array,
      currentMessage: nextStep.message,
      stats: { ...prev.stats, ...nextStep.stats },
      currentStepIndex: prev.currentStepIndex + 1,
    }));

    if (nextStep.action === 'compare') {
      const base = nextStep.array[nextStep.indices[0]]?.value ?? 0;
      playSound(400 + base, 120, 'compare');
    } else if (nextStep.action === 'swap') {
      const base = nextStep.array[nextStep.indices[0]]?.value ?? 0;
      playSound(600 + base, configRef.current.animationSpeed[0], 'swap');
    }
  }, [playSound]);

  const stepBackward = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.currentStepIndex <= 0) return;

    const newIndex = currentState.currentStepIndex - 1;
    const previousStep = currentState.sortingSteps[newIndex - 1];

    setState(prev => ({
      ...prev,
      currentStepIndex: newIndex,
      array: previousStep?.array ?? prev.array,
      currentMessage: previousStep?.message ?? 'Ready to sort',
      stats: previousStep?.stats ?? createInitialStats(),
    }));
  }, []);

  const handleConfigChange = useCallback(
    (partial: Partial<SortingConfig>) => {
      setConfig(prev => {
        const updated: SortingConfig = { ...prev, ...partial };

        const sizeChanged = partial.arraySize && partial.arraySize[0] !== prev.arraySize[0];
        const algorithmChanged = partial.algorithm && partial.algorithm !== prev.algorithm;
        const variantChanged =
          partial.algorithmVariant !== undefined && partial.algorithmVariant !== prev.algorithmVariant;

        if (algorithmChanged && partial.algorithm) {
          updated.algorithmVariant = partial.algorithmVariant ?? getDefaultVariant(partial.algorithm);
        }

        if (sizeChanged && partial.arraySize) {
          const nextSize = partial.arraySize[0];
          createArray(nextSize, `Array size updated to ${nextSize}. Ready to sort.`);
        }

        if (algorithmChanged || variantChanged) {
          const algorithmKey = partial.algorithm ?? prev.algorithm;
          const variantKey =
            updated.algorithmVariant ?? (algorithmChanged ? getDefaultVariant(algorithmKey) : prev.algorithmVariant);
          const displayName = getAlgorithmDisplayName(algorithmKey, variantKey ?? null);

          setState(prevState => ({
            ...prevState,
            sortingSteps: [],
            currentStepIndex: 0,
            isPlaying: false,
            isPaused: false,
            stats: createInitialStats(),
            currentMessage: `${algorithmChanged ? 'Algorithm' : 'Variant'} changed to ${displayName}. Ready to sort.`,
          }));
          clearAnimationTimer();
        }

        return updated;
      });
    },
    [clearAnimationTimer, createArray]
  );

  const handleCustomArray = useCallback((values: string) => {
    const parsed = values
      .split(',')
      .map(value => Number.parseInt(value.trim(), 10))
      .filter(value => Number.isFinite(value) && value > 0 && value <= 500)
      .slice(0, 100);

    if (parsed.length === 0) {
      toast.error('Please enter valid numbers between 1 and 500.');
      return;
    }

    const newArray: ArrayElement[] = parsed.map((value, index) => ({ value, id: index, state: 'default' }));
    setState(prev => ({
      ...prev,
      array: newArray,
      sortingSteps: [],
      currentStepIndex: 0,
      stats: createInitialStats(),
      currentMessage: `Custom array loaded with ${newArray.length} elements. Ready to sort.`,
    }));
    setConfig(prev => ({ ...prev, arraySize: [newArray.length] }));
    setShowCustomInput(false);
    clearAnimationTimer();
    toast.success(`Generated array with ${newArray.length} elements`);
  }, [clearAnimationTimer]);

  const handleSwapComplete = useCallback(() => {
    const currentSwap = swapRef.current;
    if (!currentSwap) return;

    setState(prev => {
      const newArray = [...prev.array];
      const { from, to } = currentSwap;
      [newArray[from], newArray[to]] = [newArray[to], newArray[from]];
      return { ...prev, array: newArray };
    });

    setCurrentSwapIndices(null);

    const currentState = stateRef.current;
    const currentConfig = configRef.current;
    if (currentState.isPlaying && !currentConfig.showStepByStep) {
      const delay = Math.max(50, 1100 - currentConfig.speed[0] * 10);
      animationTimeoutRef.current = window.setTimeout(playAnimation, delay);
    }
  }, [playAnimation]);

  useEffect(() => {
    generateArray();
  }, [generateArray]);

  useEffect(() => () => {
    clearAnimationTimer();
  }, [clearAnimationTimer]);

  return {
    config,
    state,
    customArray,
    showCustomInput,
    currentSwapIndices,
    setCustomArray,
    setShowCustomInput,
    handleConfigChange,
    handlePlayPause,
    handleReset,
    stepForward,
    stepBackward,
    generateArray,
    handleCustomArray,
    handleSwapComplete,
  };
};
