import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Play, Pause, Square, Shuffle } from 'lucide-react';
import { toast } from 'sonner';

interface ArrayElement {
  value: number;
  id: number;
  isComparing?: boolean;
  isSwapping?: boolean;
  isSorted?: boolean;
}

interface SortingStats {
  comparisons: number;
  swaps: number;
  timeElapsed: number;
  progress: number;
}

type SortingAlgorithm = 'bubble' | 'selection' | 'insertion' | 'quick';

const ALGORITHMS = {
  bubble: 'Bubble Sort',
  selection: 'Selection Sort', 
  insertion: 'Insertion Sort',
  quick: 'Quick Sort'
};

const COLOR_THEMES = {
  primary: 'gradient-primary',
  secondary: 'gradient-secondary',
  accent: 'gradient-accent',
  success: 'gradient-success',
  warning: 'gradient-warning'
};

export const SortingVisualizer: React.FC = () => {
  const [array, setArray] = useState<ArrayElement[]>([]);
  const [arraySize, setArraySize] = useState([50]);
  const [speed, setSpeed] = useState([50]);
  const [algorithm, setAlgorithm] = useState<SortingAlgorithm>('bubble');
  const [colorTheme, setColorTheme] = useState<keyof typeof COLOR_THEMES>('primary');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState<SortingStats>({
    comparisons: 0,
    swaps: 0,
    timeElapsed: 0,
    progress: 0
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  // Generate random array
  const generateArray = useCallback(() => {
    const newArray: ArrayElement[] = [];
    for (let i = 0; i < arraySize[0]; i++) {
      newArray.push({
        value: Math.floor(Math.random() * 300) + 10,
        id: i,
        isComparing: false,
        isSwapping: false,
        isSorted: false
      });
    }
    setArray(newArray);
    resetStats();
  }, [arraySize]);

  const resetStats = () => {
    setStats({
      comparisons: 0,
      swaps: 0,
      timeElapsed: 0,
      progress: 0
    });
  };

  // Play sound effect
  const playSound = (frequency: number = 440, duration: number = 100) => {
    if (!audioContext.current) return;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.current.currentTime + duration / 1000);
    
    oscillator.start(audioContext.current.currentTime);
    oscillator.stop(audioContext.current.currentTime + duration / 1000);
  };

  // Animation helpers
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const updateArray = (newArray: ArrayElement[]) => {
    setArray([...newArray]);
  };

  const markComparing = (indices: number[], arr: ArrayElement[]) => {
    const newArray = [...arr];
    newArray.forEach((elem, idx) => {
      elem.isComparing = indices.includes(idx);
      elem.isSwapping = false;
    });
    return newArray;
  };

  const markSwapping = (indices: number[], arr: ArrayElement[]) => {
    const newArray = [...arr];
    newArray.forEach((elem, idx) => {
      elem.isSwapping = indices.includes(idx);
      elem.isComparing = false;
    });
    return newArray;
  };

  // Bubble Sort implementation
  const bubbleSort = async (arr: ArrayElement[]) => {
    const n = arr.length;
    let sortedArray = [...arr];
    
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (!isRunning) return;
        
        // Mark comparing elements
        sortedArray = markComparing([j, j + 1], sortedArray);
        updateArray(sortedArray);
        setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
        
        await sleep(101 - speed[0]);
        
        if (sortedArray[j].value > sortedArray[j + 1].value) {
          // Mark swapping elements
          sortedArray = markSwapping([j, j + 1], sortedArray);
          updateArray(sortedArray);
          
          // Play swap sound
          playSound(400 + sortedArray[j].value, 100);
          
          // Perform swap
          [sortedArray[j], sortedArray[j + 1]] = [sortedArray[j + 1], sortedArray[j]];
          setStats(prev => ({ ...prev, swaps: prev.swaps + 1 }));
          
          await sleep(101 - speed[0]);
        }
      }
      // Mark last element as sorted
      sortedArray[n - i - 1].isSorted = true;
      setStats(prev => ({ ...prev, progress: ((i + 1) / n) * 100 }));
    }
    
    // Mark first element as sorted
    sortedArray[0].isSorted = true;
    sortedArray.forEach(elem => {
      elem.isComparing = false;
      elem.isSwapping = false;
    });
    updateArray(sortedArray);
    setStats(prev => ({ ...prev, progress: 100 }));
  };

  // Selection Sort implementation
  const selectionSort = async (arr: ArrayElement[]) => {
    const n = arr.length;
    let sortedArray = [...arr];
    
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      sortedArray = markComparing([i], sortedArray);
      
      for (let j = i + 1; j < n; j++) {
        if (!isRunning) return;
        
        sortedArray = markComparing([minIdx, j], sortedArray);
        updateArray(sortedArray);
        setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
        
        await sleep(101 - speed[0]);
        
        if (sortedArray[j].value < sortedArray[minIdx].value) {
          minIdx = j;
        }
      }
      
      if (minIdx !== i) {
        sortedArray = markSwapping([i, minIdx], sortedArray);
        updateArray(sortedArray);
        
        playSound(400 + sortedArray[i].value, 100);
        
        [sortedArray[i], sortedArray[minIdx]] = [sortedArray[minIdx], sortedArray[i]];
        setStats(prev => ({ ...prev, swaps: prev.swaps + 1 }));
        
        await sleep(101 - speed[0]);
      }
      
      sortedArray[i].isSorted = true;
      setStats(prev => ({ ...prev, progress: ((i + 1) / n) * 100 }));
    }
    
    sortedArray[n - 1].isSorted = true;
    sortedArray.forEach(elem => {
      elem.isComparing = false;
      elem.isSwapping = false;
    });
    updateArray(sortedArray);
    setStats(prev => ({ ...prev, progress: 100 }));
  };

  // Start sorting
  const startSorting = async () => {
    if (isPaused) {
      setIsPaused(false);
      setIsRunning(true);
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    
    // Reset array state
    const resetArray = array.map(elem => ({
      ...elem,
      isComparing: false,
      isSwapping: false,
      isSorted: false
    }));
    setArray(resetArray);
    resetStats();
    
    try {
      switch (algorithm) {
        case 'bubble':
          await bubbleSort(resetArray);
          break;
        case 'selection':
          await selectionSort(resetArray);
          break;
        // TODO: Implement insertion and quick sort
        default:
          await bubbleSort(resetArray);
      }
      
      if (startTimeRef.current) {
        setStats(prev => ({ 
          ...prev, 
          timeElapsed: Date.now() - startTimeRef.current! 
        }));
      }
      
      toast.success('Sorting completed!');
    } catch (error) {
      console.error('Sorting error:', error);
    } finally {
      setIsRunning(false);
      setIsPaused(false);
    }
  };

  const pauseSorting = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  const resetSorting = () => {
    setIsRunning(false);
    setIsPaused(false);
    generateArray();
  };

  // Initialize array on component mount
  useEffect(() => {
    generateArray();
  }, [generateArray]);

  // Update timer
  useEffect(() => {
    if (isRunning && startTimeRef.current) {
      const interval = setInterval(() => {
        setStats(prev => ({ 
          ...prev, 
          timeElapsed: Date.now() - startTimeRef.current! 
        }));
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isRunning]);

  const getBarHeight = (value: number) => {
    const maxHeight = 300;
    const maxValue = Math.max(...array.map(el => el.value));
    return (value / maxValue) * maxHeight;
  };

  const getBarColor = (element: ArrayElement) => {
    if (element.isSorted) return 'gradient-success glow-primary';
    if (element.isSwapping) return 'gradient-accent glow-accent';
    if (element.isComparing) return 'gradient-warning glow-secondary';
    return `${COLOR_THEMES[colorTheme]}`;
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Sorting Algorithm Visualizer
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Visualizer Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Controls */}
          <Card className="glass mb-4 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={isRunning ? pauseSorting : startSorting}
                  disabled={array.length === 0}
                  className="glow-primary"
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetSorting}
                  disabled={isRunning}
                >
                  <Square className="w-4 h-4" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={generateArray}
                  disabled={isRunning}
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Algorithm:</span>
                <Select value={algorithm} onValueChange={(value: SortingAlgorithm) => setAlgorithm(value)} disabled={isRunning}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ALGORITHMS).map(([key, name]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Theme:</span>
                <Select value={colorTheme} onValueChange={(value: keyof typeof COLOR_THEMES) => setColorTheme(value)} disabled={isRunning}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(COLOR_THEMES).map((theme) => (
                      <SelectItem key={theme} value={theme} className="capitalize">{theme}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="gradient-primary h-2 rounded-full transition-all duration-300 glow-primary"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{stats.progress.toFixed(1)}% Complete</p>
          </div>

          {/* Visualizer */}
          <div className="flex-1 glass rounded-lg p-4 flex items-end justify-center gap-1 overflow-hidden">
            {array.map((element, index) => (
              <div
                key={`${element.id}-${index}`}
                className={`bar-animation rounded-t ${getBarColor(element)} ${
                  element.isSwapping ? 'bar-swap' : element.isComparing ? 'bar-compare' : ''
                }`}
                style={{
                  height: `${getBarHeight(element.value)}px`,
                  width: `${Math.max(2, Math.floor(800 / array.length))}px`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Stats Panel */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {/* Settings */}
          <Card className="glass p-4">
            <h3 className="font-semibold mb-4 text-primary">Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Array Size: {arraySize[0]}
                </label>
                <Slider
                  value={arraySize}
                  onValueChange={setArraySize}
                  max={100}
                  min={10}
                  step={5}
                  disabled={isRunning}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Speed: {speed[0]}%
                </label>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* Statistics */}
          <Card className="glass p-4">
            <h3 className="font-semibold mb-4 text-secondary">Statistics</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Comparisons:</span>
                <span className="font-mono text-primary">{stats.comparisons}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Swaps:</span>
                <span className="font-mono text-secondary">{stats.swaps}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Time:</span>
                <span className="font-mono text-accent">{(stats.timeElapsed / 1000).toFixed(2)}s</span>
              </div>
            </div>
          </Card>

          {/* Algorithm Info */}
          <Card className="glass p-4">
            <h3 className="font-semibold mb-4 text-accent">Algorithm Info</h3>
            
            <div className="text-sm text-muted-foreground space-y-2">
              {algorithm === 'bubble' && (
                <>
                  <p><strong>Bubble Sort</strong></p>
                  <p>Time Complexity: O(n²)</p>
                  <p>Space Complexity: O(1)</p>
                  <p>Compares adjacent elements and swaps them if they're in wrong order.</p>
                </>
              )}
              {algorithm === 'selection' && (
                <>
                  <p><strong>Selection Sort</strong></p>
                  <p>Time Complexity: O(n²)</p>
                  <p>Space Complexity: O(1)</p>
                  <p>Finds minimum element and places it at the beginning.</p>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};