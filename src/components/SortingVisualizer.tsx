import React from 'react';

import { ControlPanel } from './sorting/ControlPanel';
import { StatsPanel } from './sorting/StatsPanel';
import { Visualizer } from './sorting/Visualizer';
import { useSortingController } from '@/hooks/useSortingController';

export const SortingVisualizer: React.FC = () => {
  const {
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
  } = useSortingController();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <ControlPanel
            config={config}
            state={state}
            onConfigChange={handleConfigChange}
            onPlayPause={handlePlayPause}
            onReset={handleReset}
            onStepForward={stepForward}
            onStepBackward={stepBackward}
            onGenerateArray={generateArray}
            onCustomArray={handleCustomArray}
            customArray={customArray}
            setCustomArray={setCustomArray}
            showCustomInput={showCustomInput}
            setShowCustomInput={setShowCustomInput}
          />
          <Visualizer
            array={state.array}
            visualizationMode={config.visualizationMode}
            colorTheme={config.colorTheme}
            animationSpeed={config.animationSpeed[0]}
            swapIndices={currentSwapIndices}
            onSwapComplete={handleSwapComplete}
          />
        </div>
        <StatsPanel
          stats={state.stats}
          algorithm={config.algorithm}
          arrayLength={state.array.length}
          currentStepIndex={state.currentStepIndex}
          currentMessage={state.currentMessage}
          algorithmVariant={config.algorithmVariant}
        />
      </div>
    </div>
  );
};
