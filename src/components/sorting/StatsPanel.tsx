import React from 'react';
import { Card } from '@/components/ui/card';
import { SortingStats, SortingAlgorithm, getAlgorithmLabel, getAlgorithmVariantLabel } from './types';

interface StatsPanelProps {
  stats: SortingStats;
  algorithm: SortingAlgorithm;
  algorithmVariant: string | null;
  arrayLength: number;
  currentStepIndex: number;
  currentMessage: string;
}

interface AlgorithmInfo {
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
  bestCase: string;
  stable: boolean;
}

const DEFAULT_INFO: AlgorithmInfo = {
  timeComplexity: 'Varies',
  spaceComplexity: 'Varies',
  description: 'Algorithm documentation not available.',
  bestCase: 'Varies',
  stable: false,
};

const ALGORITHM_INFO: Record<SortingAlgorithm, AlgorithmInfo> = {
  bubble: {
    timeComplexity: 'O(n^2)',
    spaceComplexity: 'O(1)',
    description:
      'Compares adjacent elements and swaps them when out of order. Easy to understand but inefficient for large inputs.',
    bestCase: 'O(n) when the array is already sorted',
    stable: true,
  },
  selection: {
    timeComplexity: 'O(n^2)',
    spaceComplexity: 'O(1)',
    description:
      'Repeatedly selects the minimum remaining element and places it at the front. Minimizes swaps but always quadratic.',
    bestCase: 'O(n^2) in every case',
    stable: false,
  },
  insertion: {
    timeComplexity: 'O(n^2)',
    spaceComplexity: 'O(1)',
    description:
      'Builds a sorted prefix one element at a time. Excellent for nearly sorted data sets and small inputs.',
    bestCase: 'O(n) when the data is nearly sorted',
    stable: true,
  },
  merge: {
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    description:
      'Divide-and-conquer approach that splits the array, sorts each half, and merges them back together.',
    bestCase: 'O(n log n) regardless of input',
    stable: true,
  },
  quick: {
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(log n)',
    description:
      'Partitions the array around a pivot so smaller values move left and larger ones move right. Very fast on average.',
    bestCase: 'O(n log n) with balanced partitions',
    stable: false,
  },
  heap: {
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(1)',
    description:
      'Transforms the data into a binary heap to repeatedly extract the maximum element. Predictable performance.',
    bestCase: 'O(n log n) in every case',
    stable: false,
  },
  shell: {
    timeComplexity: 'O(n^(3/2)) average',
    spaceComplexity: 'O(1)',
    description:
      'Generalises insertion sort by comparing elements separated by a gap sequence, shrinking the gap over time.',
    bestCase: 'O(n log n) with good gap sequences',
    stable: false,
  },
  cocktail: {
    timeComplexity: 'O(n^2)',
    spaceComplexity: 'O(1)',
    description:
      'Bidirectional bubble sort variant that bubbles large elements right and small elements left each pass.',
    bestCase: 'O(n) when already sorted',
    stable: true,
  },
};

export const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  algorithm,
  algorithmVariant,
  arrayLength,
  currentStepIndex,
  currentMessage,
}) => {
  const algorithmInfo = ALGORITHM_INFO[algorithm] ?? DEFAULT_INFO;
  const algorithmLabel = getAlgorithmLabel(algorithm);
  const variantLabel = algorithmVariant ? getAlgorithmVariantLabel(algorithm, algorithmVariant) : null;

  return (
    <div className="w-full lg:w-96 flex-shrink-0 space-y-6">
      {/* Real-time Statistics */}
      <Card className="glass border border-white/20 p-6">
        <h3 className="font-semibold mb-4 text-cyan-400 text-lg">Live Statistics</h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Comparisons:</span>
            <span className="font-mono text-xl text-cyan-400">{stats.comparisons.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-300">Swaps:</span>
            <span className="font-mono text-xl text-purple-400">{stats.swaps.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-300">Time Elapsed:</span>
            <span className="font-mono text-xl text-pink-400">{(stats.timeElapsed / 1000).toFixed(2)}s</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-300">Array Size:</span>
            <span className="font-mono text-xl text-green-400">{arrayLength}</span>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">Current Step:</span>
              <span className="font-mono text-orange-400">{currentStepIndex} / {stats.totalSteps}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full transition-all duration-300"
                style={{ width: `${stats.totalSteps > 0 ? (currentStepIndex / stats.totalSteps) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Algorithm Information */}
      <Card className="glass border border-white/20 p-6">
        <h3 className="font-semibold mb-4 text-purple-400 text-lg">Algorithm Info</h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-1">{algorithmLabel}</h4>
            {variantLabel && (
              <div className="text-sm text-gray-300 mb-2">Variant: {variantLabel}</div>
            )}
            <p className="text-sm text-gray-300 leading-relaxed">{algorithmInfo.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Time Complexity</span>
              <div className="font-mono text-cyan-400">{algorithmInfo.timeComplexity}</div>
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Space Complexity</span>
              <div className="font-mono text-purple-400">{algorithmInfo.spaceComplexity}</div>
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Best Case</span>
            <div className="text-sm text-green-400">{algorithmInfo.bestCase}</div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Stable</span>
              <div className={`text-sm ${algorithmInfo.stable ? 'text-green-400' : 'text-red-400'}`}>
                {algorithmInfo.stable ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Current Action */}
      <Card className="glass border border-white/20 p-6">
        <h3 className="font-semibold mb-4 text-orange-400 text-lg">Current Action</h3>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
          <p className="text-sm text-gray-200 leading-relaxed">
            {currentMessage}
          </p>
        </div>
      </Card>

      {/* Performance Metrics */}
      <Card className="glass border border-white/20 p-6">
        <h3 className="font-semibold mb-4 text-green-400 text-lg">Performance</h3>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-300">Efficiency</span>
              <span className="text-sm text-gray-400">
                {stats.totalSteps > 0 ? `${((currentStepIndex / stats.totalSteps) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-300"
                style={{ width: `${stats.totalSteps > 0 ? (currentStepIndex / stats.totalSteps) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-300">Comparison Rate</span>
              <span className="text-sm text-gray-400">
                {stats.timeElapsed > 0 ? `${(stats.comparisons / (stats.timeElapsed / 1000)).toFixed(0)}/s` : '0/s'}
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-300">Swap Ratio</span>
              <span className="text-sm text-gray-400">
                {stats.comparisons > 0 ? `${((stats.swaps / stats.comparisons) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
