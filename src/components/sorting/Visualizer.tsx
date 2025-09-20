import React, { useMemo, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ArrayElement, VisualizationMode, COLOR_THEMES } from './types';
import { DemoSwapAnimation, SwapState } from './DemoSwapAnimation';

interface VisualizerProps {
  array: ArrayElement[];
  visualizationMode: VisualizationMode;
  colorTheme: keyof typeof COLOR_THEMES;
  containerHeight?: number;
  animationSpeed?: number;
  swapIndices?: { from: number; to: number } | null;
  onSwapComplete?: () => void;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  array,
  visualizationMode,
  colorTheme,
  containerHeight = 400,
  animationSpeed = 300,
  swapIndices = null,
  onSwapComplete
}) => {
  const [swapAnimation] = useState(() => new DemoSwapAnimation());
  const [swapPositions, setSwapPositions] = useState<any>(null);
  
  // Start swap animation when swapIndices changes
  useEffect(() => {
    if (swapIndices && !swapAnimation.isActive()) {
      swapAnimation.startSwap(
        swapIndices.from,
        swapIndices.to,
        (state: SwapState) => {
          // Update positions on each animation frame
          setSwapPositions({
            ...state,
            containerWidth: 800,
            containerHeight,
            marginLeft: 40,
            marginBottom: 60,
            barWidth: Math.max(3, Math.min(50, 800 / array.length)),
            gapBetween: 4,
            arrayLength: array.length
          });
        },
        () => {
          setSwapPositions(null);
          if (onSwapComplete) onSwapComplete();
        },
        animationSpeed
      );
    }
  }, [swapIndices, swapAnimation, containerHeight, array.length, onSwapComplete, animationSpeed]);
  
  // Clean up animation on unmount
  useEffect(() => {
    return () => swapAnimation.stop();
  }, [swapAnimation]);
  const getElementColor = (element: ArrayElement) => {
    const colors = COLOR_THEMES[colorTheme];
    switch (element.state) {
      case 'comparing': return colors.comparing;
      case 'swapping': return colors.swapping;
      case 'sorted': return colors.sorted;
      case 'pivot': return colors.pivot;
      case 'current': return colors.current;
      case 'selected': return colors.current;
      default: return '#6b7280'; // default gray
    }
  };

  const maxValue = useMemo(() => Math.max(...array.map(el => el.value)), [array]);

  const renderBars = () => {
    const currentSwap = swapAnimation.getCurrentSwap();
    
    return (
      <div className="flex items-end justify-center gap-1 h-full">
        {array.map((element, index) => {
          const height = (element.value / maxValue) * containerHeight;
          const width = Math.max(3, Math.min(50, 800 / array.length));
          
          // Demo.me style positioning
          let translateX = 0;
          let translateY = 0;
          let transform = 'scale(1)';
          let zIndex = 1;
          
          // Apply demo.me animation if this element is being swapped
          if (swapPositions && (index === swapPositions.idxA || index === swapPositions.idxB)) {
            // Compute delta based on index distance so transform is relative to the element's own position.
            const stepWidth = swapPositions.barWidth + swapPositions.gapBetween;
            const deltaX = (swapPositions.idxB - swapPositions.idxA) * stepWidth;
            const t = swapPositions.t as number;
            const u = 1 - t;
            // Quadratic Bezier from 0 -> delta (or 0 -> -delta) with control at mid.
            const bezier = (end: number) => u*u*0 + 2*u*t*(end/2) + t*t*end;
            const lift = 22; // demo.me lift
            const liftOffset = lift * Math.sin(Math.PI * t);

            if (index === swapPositions.idxA) {
              translateX = bezier(deltaX);
              translateY = -liftOffset; // lift up
              transform = 'scale(1.1)';
              zIndex = 10;
            } else if (index === swapPositions.idxB) {
              translateX = bezier(-deltaX);
              translateY = liftOffset; // slight downward arc for B
              transform = 'scale(1.1)';
              zIndex = 10;
            }
          }
          
          return (
            <div
              key={`bar-${element.id}-${index}`}
              className="relative rounded-t flex items-end justify-center bar-element"
              style={{
                height: `${height}px`,
                width: `${width}px`,
                backgroundColor: getElementColor(element),
                boxShadow: element.state !== 'default' ? `0 0 15px ${getElementColor(element)}40` : 'none',
                transform: `${transform} translateX(${translateX}px) translateY(${translateY}px)`,
                transition: currentSwap ? 'none' : `all ${animationSpeed}ms ease-in-out`,
                zIndex
              }}
              title={`Value: ${element.value}, Index: ${index}`}
            >
              {width > 15 && (
                <span className="text-white text-xs font-bold mb-1 select-none">
                  {element.value}
                </span>
              )}
              
              {/* Simple glow effect for swapping elements */}
              {currentSwap && (index === currentSwap.idxA || index === currentSwap.idxB) && (
                <div 
                  className="absolute inset-0 rounded-t opacity-30 pointer-events-none"
                  style={{
                    backgroundColor: getElementColor(element),
                    filter: 'blur(2px)',
                    animation: 'pulse 0.5s ease-in-out infinite'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderCircles = () => {
    const minSize = 20;
    const maxSize = 80;
    
    return (
      <div className="flex flex-wrap items-center justify-center gap-4 p-4">
        {array.map((element, index) => {
          const size = minSize + ((element.value / maxValue) * (maxSize - minSize));
          
          let transform = 'scale(1)';
          if (element.state === 'swapping') {
            transform = 'scale(1.2) rotate(180deg)';
          } else if (element.state === 'comparing') {
            transform = 'scale(1.1)';
          }
          
          return (
            <div
              key={`circle-${element.id}-${index}`}
              className="relative transition-all duration-300 ease-in-out rounded-full flex items-center justify-center font-bold text-white circle-element"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: getElementColor(element),
                boxShadow: element.state !== 'default' ? `0 0 20px ${getElementColor(element)}60` : 'none',
                transform,
                animation: element.state === 'swapping' ? 'swapBounce 0.5s ease-in-out' : 'none'
              }}
              title={`Value: ${element.value}, Index: ${index}`}
            >
              <span className={size > 30 ? 'text-sm' : 'text-xs'}>
                {element.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLines = () => {
    return (
      <div className="relative h-full p-4">
        <svg width="100%" height={containerHeight} className="border border-gray-600 rounded">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(percent => (
            <line
              key={percent}
              x1="0"
              y1={containerHeight - (containerHeight * percent / 100)}
              x2="100%"
              y2={containerHeight - (containerHeight * percent / 100)}
              stroke="#374151"
              strokeDasharray="2,2"
            />
          ))}
          
          {/* Data line with swap animation */}
          <polyline
            fill="none"
            stroke={getElementColor(array[0]) || '#6b7280'}
            strokeWidth="3"
            points={array.map((element, index) => {
              const x = (index / (array.length - 1)) * 100;
              const y = containerHeight - ((element.value / maxValue) * containerHeight);
              return `${x}%,${y}`;
            }).join(' ')}
            className="transition-all duration-300"
          />
          
          {/* Data points with enhanced swap effects */}
          {array.map((element, index) => {
            const x = (index / (array.length - 1)) * 100;
            const y = containerHeight - ((element.value / maxValue) * containerHeight);
            
            return (
              <g key={`point-${element.id}-${index}`}>
                <circle
                  cx={`${x}%`}
                  cy={y}
                  r={element.state !== 'default' ? '8' : '5'}
                  fill={getElementColor(element)}
                  className="transition-all duration-300"
                  style={{
                    filter: element.state !== 'default' ? `drop-shadow(0 0 10px ${getElementColor(element)})` : 'none',
                    animation: element.state === 'swapping' ? 'swapPulse 0.3s ease-in-out infinite' : 'none'
                  }}
                >
                  <title>{`Value: ${element.value}, Index: ${index}`}</title>
                </circle>
                {/* Swap ripple effect */}
                {element.state === 'swapping' && (
                  <circle
                    cx={`${x}%`}
                    cy={y}
                    r="12"
                    fill="none"
                    stroke={getElementColor(element)}
                    strokeWidth="2"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderMatrix = () => {
    const cols = Math.ceil(Math.sqrt(array.length));
    const rows = Math.ceil(array.length / cols);
    
    return (
      <div 
        className="grid gap-2 p-4 place-items-center"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }}
      >
        {array.map((element, index) => {
          let transform = 'scale(1)';
          if (element.state === 'swapping') {
            transform = 'scale(1.2) rotate(90deg)';
          } else if (element.state === 'comparing') {
            transform = 'scale(1.1)';
          }
          
          return (
            <div
              key={`matrix-${element.id}-${index}`}
              className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white text-sm transition-all duration-300 cursor-pointer matrix-element"
              style={{
                backgroundColor: getElementColor(element),
                boxShadow: element.state !== 'default' ? `0 0 15px ${getElementColor(element)}50` : 'none',
                transform,
                animation: element.state === 'swapping' ? 'swapFlip 0.4s ease-in-out' : 'none'
              }}
              title={`Value: ${element.value}, Index: ${index}`}
            >
              {element.value}
            </div>
          );
        })}
      </div>
    );
  };

  const renderVisualization = () => {
    switch (visualizationMode) {
      case 'bars': return renderBars();
      case 'circles': return renderCircles();
      case 'lines': return renderLines();
      case 'matrix': return renderMatrix();
      default: return renderBars();
    }
  };

  return (
    <Card className="flex-1 glass border border-white/20 p-6 overflow-hidden">
      <div className="h-full">
        {renderVisualization()}
      </div>
    </Card>
  );
};
