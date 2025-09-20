import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Play, Pause, Square, Shuffle, Volume2, VolumeX, SkipForward, Edit3, StepForward } from 'lucide-react';
import { SortingConfig, SortingState, ALGORITHMS, VISUALIZATION_MODES, COLOR_THEMES, SortingAlgorithm, VisualizationMode } from './types';

interface ControlPanelProps {
  config: SortingConfig;
  state: SortingState;
  onConfigChange: (config: Partial<SortingConfig>) => void;
  onPlayPause: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onGenerateArray: () => void;
  onCustomArray: (values: string) => void;
  customArray: string;
  setCustomArray: (value: string) => void;
  showCustomInput: boolean;
  setShowCustomInput: (show: boolean) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  state,
  onConfigChange,
  onPlayPause,
  onReset,
  onStepForward,
  onStepBackward,
  onGenerateArray,
  onCustomArray,
  customArray,
  setCustomArray,
  showCustomInput,
  setShowCustomInput
}) => {
  const selectedAlgorithm = ALGORITHMS[config.algorithm];
  const variantOptions = selectedAlgorithm?.variants ?? null;
  const activeVariant = variantOptions ? (config.algorithmVariant ?? Object.keys(variantOptions)[0]) : null;
  const showVariantSelect = Boolean(variantOptions && activeVariant);

  return (
    <Card className="glass mb-6 p-4 border border-white/20">
      <div className="flex flex-wrap items-center gap-4">
        {/* Playback Controls */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onPlayPause}
            disabled={state.array.length === 0}
            className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-gray-900"
          >
            {state.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="ml-2">{state.isPlaying ? 'Pause' : state.isPaused ? 'Resume' : 'Start'}</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={onReset}
            disabled={state.isPlaying}
            className="border-gray-400 text-gray-400 hover:bg-gray-400 hover:text-gray-900"
          >
            <Square className="w-4 h-4" />
            <span className="ml-2">Reset</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onConfigChange({ showStepByStep: !config.showStepByStep })}
            className={`${config.showStepByStep ? 'border-purple-400 text-purple-400' : 'border-gray-400 text-gray-400'} hover:bg-purple-400 hover:text-gray-900`}
          >
            <StepForward className="w-4 h-4" />
            <span className="ml-2">Step</span>
          </Button>
        </div>

        {/* Step Controls (when in step mode) */}
        {config.showStepByStep && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onStepBackward}
              disabled={state.currentStepIndex === 0 || state.isPlaying}
              className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-gray-900"
            >
              ???
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onStepForward}
              disabled={state.currentStepIndex >= state.sortingSteps.length || state.isPlaying}
              className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-gray-900"
            >
              ???
            </Button>
          </div>
        )}

        {/* Array Controls */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onGenerateArray}
            disabled={state.isPlaying}
            className="border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-gray-900"
          >
            <Shuffle className="w-4 h-4" />
            <span className="ml-2">Random</span>
          </Button>
          
          <Dialog open={showCustomInput} onOpenChange={setShowCustomInput}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={state.isPlaying}
                className="border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-gray-900"
              >
                <Edit3 className="w-4 h-4" />
                <span className="ml-2">Custom</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-600 text-white">
              <DialogHeader>
                <DialogTitle>Custom Array Input</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-300">
                  Enter numbers separated by commas (e.g., 64, 34, 25, 12, 22, 11, 90)
                </p>
                <Input
                  placeholder="64, 34, 25, 12, 22, 11, 90"
                  value={customArray}
                  onChange={(e) => setCustomArray(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCustomInput(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => onCustomArray(customArray)} className="bg-pink-400 text-gray-900">
                    Generate
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onConfigChange({ soundEnabled: !config.soundEnabled })}
            className={`${config.soundEnabled ? 'border-green-400 text-green-400' : 'border-red-400 text-red-400'} hover:bg-current hover:text-gray-900`}
          >
            {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="ml-2">Audio</span>
          </Button>
        </div>

        {/* YouTube-style Horizontal Sliders */}
        <div className="flex items-center gap-6">
          {/* Array Size Control */}
          <div className="group relative flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center text-gray-400 group-hover:text-white cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
            </div>
            <div className="hidden group-hover:flex items-center gap-2 transition-all duration-200">
              <span className="text-xs text-gray-300 min-w-[30px]">{config.arraySize[0]}</span>
              <div className="w-20 h-1">
                <Slider
                  value={config.arraySize}
                  onValueChange={(value) => onConfigChange({ arraySize: value })}
                  max={100}
                  min={5}
                  step={5}
                  disabled={state.isPlaying}
                  className="w-full"
                />
              </div>
            </div>
            <span className="group-hover:hidden text-sm text-gray-300">{config.arraySize[0]}</span>
          </div>

          {/* Speed Control */}
          <div className="group relative flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center text-gray-400 group-hover:text-white cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,8A4,4 0 0,0 9,12A4,4 0 0,0 13,16A4,4 0 0,0 17,12A4,4 0 0,0 13,8M13,14A2,2 0 0,1 11,12A2,2 0 0,1 13,10A2,2 0 0,1 15,12A2,2 0 0,1 13,14M2,12C2,6.5 6.5,2 12,2C17.5,2 22,6.5 22,12C22,17.5 17.5,22 12,22C6.5,22 2,17.5 2,12M4,12C4,16.41 7.59,20 12,20C16.41,20 20,16.41 20,12C20,7.59 16.41,4 12,4C7.59,4 4,7.59 4,12Z"/>
              </svg>
            </div>
            <div className="hidden group-hover:flex items-center gap-2 transition-all duration-200">
              <span className="text-xs text-gray-300 min-w-[30px]">{config.speed[0]}%</span>
              <div className="w-20 h-1">
                <Slider
                  value={config.speed}
                  onValueChange={(value) => onConfigChange({ speed: value })}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
            <span className="group-hover:hidden text-sm text-gray-300">{config.speed[0]}%</span>
          </div>

          {/* Animation Speed Control */}
          <div className="group relative flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center text-gray-400 group-hover:text-white cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
              </svg>
            </div>
            <div className="hidden group-hover:flex items-center gap-2 transition-all duration-200">
              <span className="text-xs text-gray-300 min-w-[30px]">{config.animationSpeed[0]}ms</span>
              <div className="w-20 h-1">
                <Slider
                  value={config.animationSpeed}
                  onValueChange={(value) => onConfigChange({ animationSpeed: value })}
                  max={1000}
                  min={100}
                  step={50}
                  className="w-full"
                />
              </div>
            </div>
            <span className="group-hover:hidden text-sm text-gray-300">{config.animationSpeed[0]}ms</span>
          </div>
        </div>

        {/* Configuration Selects */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">Algorithm:</span>
            <Select 
              value={config.algorithm} 
              onValueChange={(value: SortingAlgorithm) => onConfigChange({ algorithm: value })} 
              disabled={state.isPlaying}
            >
              <SelectTrigger className="w-36 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {Object.entries(ALGORITHMS).map(([key, definition]) => (
                  <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">{definition.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          {showVariantSelect && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Variant:</span>
              <Select
                value={activeVariant!}
                onValueChange={(value) => onConfigChange({ algorithmVariant: value })}
                disabled={state.isPlaying}
              >
                <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {Object.entries(variantOptions!).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">View:</span>
            <Select 
              value={config.visualizationMode} 
              onValueChange={(value: VisualizationMode) => onConfigChange({ visualizationMode: value })} 
              disabled={state.isPlaying}
            >
              <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {Object.entries(VISUALIZATION_MODES).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">Theme:</span>
            <Select 
              value={config.colorTheme} 
              onValueChange={(value: keyof typeof COLOR_THEMES) => onConfigChange({ colorTheme: value })}
            >
              <SelectTrigger className="w-28 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {Object.keys(COLOR_THEMES).map((theme) => (
                  <SelectItem key={theme} value={theme} className="text-white hover:bg-gray-700 capitalize">{theme}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
};
