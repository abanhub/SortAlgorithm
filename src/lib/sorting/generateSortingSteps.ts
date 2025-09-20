import {
  ArrayElement,
  SortingAlgorithm,
  SortingStep,
  ALGORITHMS,
  getAlgorithmLabel,
  getAlgorithmVariantLabel,
} from '@/components/sorting/types';

interface GenerationContext {
  workingArray: ArrayElement[];
  steps: SortingStep[];
  comparisons: number;
  swaps: number;
  addStep: (
    message: string,
    indices: number[],
    action: SortingStep['action'],
    swapPair?: { from: number; to: number }
  ) => void;
}

type AlgorithmExecutor = (context: GenerationContext) => void;

const cloneArray = (array: ArrayElement[]): ArrayElement[] =>
  array.map(element => ({
    ...element,
    position: element.position ? { ...element.position } : undefined,
  }));

const finalizeStats = (steps: SortingStep[]) => {
  const total = steps.length;
  steps.forEach((step, index) => {
    step.stats = {
      ...step.stats,
      currentStep: index + 1,
      totalSteps: total,
      progress: total > 0 ? ((index + 1) / total) * 100 : 0,
    };
  });
};

const bubbleSort: AlgorithmExecutor = (context) => {
  const { workingArray } = context;
  for (let i = 0; i < workingArray.length - 1; i++) {
    context.addStep(`Pass ${i + 1}/${Math.max(1, workingArray.length - 1)}: scanning for next largest value`, [], 'select');

    for (let j = 0; j < workingArray.length - i - 1; j++) {
      workingArray[j].state = 'comparing';
      workingArray[j + 1].state = 'comparing';
      context.addStep(
        `Compare indices ${j} and ${j + 1}: ${workingArray[j].value} vs ${workingArray[j + 1].value}`,
        [j, j + 1],
        'compare'
      );
      context.comparisons += 1;

      if (workingArray[j].value > workingArray[j + 1].value) {
        workingArray[j].state = 'swapping';
        workingArray[j + 1].state = 'swapping';
        context.addStep(
          `Swap values ${workingArray[j].value} and ${workingArray[j + 1].value}`,
          [j, j + 1],
          'swap',
          { from: j, to: j + 1 }
        );
        [workingArray[j], workingArray[j + 1]] = [workingArray[j + 1], workingArray[j]];
        context.swaps += 1;
      }

      workingArray[j].state = 'default';
      workingArray[j + 1].state = 'default';
    }

    const sortedIndex = workingArray.length - i - 1;
    if (sortedIndex >= 0) {
      workingArray[sortedIndex].state = 'sorted';
      context.addStep(`Position ${sortedIndex} locked in place`, [sortedIndex], 'sort');
    }
  }

  if (workingArray.length > 0) {
    workingArray[0].state = 'sorted';
  }
};

const selectionSort: AlgorithmExecutor = (context) => {
  const { workingArray } = context;
  for (let i = 0; i < workingArray.length; i++) {
    let minIndex = i;
    workingArray[i].state = 'current';
    context.addStep(`Assume index ${i} as current minimum`, [i], 'select');

    for (let j = i + 1; j < workingArray.length; j++) {
      workingArray[j].state = 'comparing';
      context.addStep(
        `Compare index ${j} (${workingArray[j].value}) with current minimum index ${minIndex} (${workingArray[minIndex].value})`,
        [minIndex, j],
        'compare'
      );
      context.comparisons += 1;

      if (workingArray[j].value < workingArray[minIndex].value) {
        workingArray[minIndex].state = 'default';
        minIndex = j;
        workingArray[minIndex].state = 'current';
        context.addStep(`Update current minimum to index ${minIndex}`, [minIndex], 'select');
      }

      workingArray[j].state = 'default';
    }

    if (minIndex !== i) {
      workingArray[i].state = 'swapping';
      workingArray[minIndex].state = 'swapping';
      context.addStep(
        `Swap index ${i} with new minimum at index ${minIndex}`,
        [i, minIndex],
        'swap',
        { from: minIndex, to: i }
      );
      [workingArray[i], workingArray[minIndex]] = [workingArray[minIndex], workingArray[i]];
      context.swaps += 1;
    }

    workingArray[i].state = 'sorted';
    context.addStep(`Position ${i} confirmed`, [i], 'sort');
  }
};

const insertionSort: AlgorithmExecutor = (context) => {
  const { workingArray } = context;
  for (let i = 1; i < workingArray.length; i++) {
    let j = i;
    workingArray[i].state = 'current';
    context.addStep(`Insert value ${workingArray[i].value} into sorted prefix`, [i], 'select');

    while (j > 0 && workingArray[j - 1].value > workingArray[j].value) {
      workingArray[j - 1].state = 'swapping';
      workingArray[j].state = 'swapping';
      context.addStep(
        `Shift ${workingArray[j - 1].value} right to make room`,
        [j - 1, j],
        'swap',
        { from: j - 1, to: j }
      );
      [workingArray[j - 1], workingArray[j]] = [workingArray[j], workingArray[j - 1]];
      context.swaps += 1;
      context.comparisons += 1;

      workingArray[j].state = 'default';
      j -= 1;
      workingArray[j].state = 'swapping';
    }

    if (j > 0) {
      context.comparisons += 1;
    }

    workingArray[j].state = 'sorted';
    context.addStep(`Placed value at index ${j}`, [j], 'sort');

    for (let k = 0; k <= i; k++) {
      if (workingArray[k].state === 'default') {
        workingArray[k].state = 'sorted';
      }
    }
  }

  if (workingArray.length > 0) {
    workingArray[0].state = 'sorted';
  }
};

const quickSortLomuto: AlgorithmExecutor = (context) => {
  const { workingArray } = context;
  const stack: Array<[number, number]> = [];
  if (workingArray.length > 0) {
    stack.push([0, workingArray.length - 1]);
  }

  while (stack.length > 0) {
    const range = stack.pop();
    if (!range) continue;
    const [lo, hi] = range;
    if (lo >= hi || lo < 0 || hi >= workingArray.length) continue;

    const pivotVal = workingArray[hi].value;
    workingArray[hi].state = 'pivot';
    context.addStep(`Partition indices ${lo}-${hi} with pivot ${pivotVal} at index ${hi}`, [hi], 'pivot');

    let i = lo;
    for (let j = lo; j < hi; j++) {
      workingArray[j].state = 'comparing';
      context.addStep(
        `Compare index ${j} (${workingArray[j].value}) with pivot ${pivotVal}`,
        [j, hi],
        'compare'
      );
      context.comparisons += 1;

      if (workingArray[j].value <= pivotVal) {
        if (i !== j) {
          workingArray[i].state = 'swapping';
          workingArray[j].state = 'swapping';
          context.addStep(
            `Swap index ${i} and ${j}`,
            [i, j],
            'swap',
            { from: j, to: i }
          );
          [workingArray[i], workingArray[j]] = [workingArray[j], workingArray[i]];
          context.swaps += 1;
        }
        workingArray[i].state = 'default';
        i += 1;
      }

      workingArray[j].state = 'default';
    }

    if (i !== hi) {
      workingArray[i].state = 'swapping';
      workingArray[hi].state = 'swapping';
      context.addStep(`Move pivot to index ${i}`, [i, hi], 'swap', { from: hi, to: i });
      [workingArray[i], workingArray[hi]] = [workingArray[hi], workingArray[i]];
      context.swaps += 1;
    }

    workingArray[i].state = 'sorted';
    workingArray[hi].state = 'default';
    context.addStep(`Pivot settled at index ${i}`, [i], 'sort');

    const leftRange: [number, number] = [lo, i - 1];
    const rightRange: [number, number] = [i + 1, hi];
    if (rightRange[0] < rightRange[1]) stack.push(rightRange);
    if (leftRange[0] < leftRange[1]) stack.push(leftRange);
  }

  workingArray.forEach((element, index) => {
    element.state = 'sorted';
    context.addStep(`Index ${index} confirmed`, [index], 'sort');
  });
};

const quickSortHoare: AlgorithmExecutor = (context) => {
  const { workingArray } = context;
  const stack: Array<[number, number]> = [];
  if (workingArray.length > 0) {
    stack.push([0, workingArray.length - 1]);
  }

  while (stack.length > 0) {
    const range = stack.pop();
    if (!range) continue;
    const [lo, hi] = range;
    if (lo >= hi) continue;

    const pivotIndex = Math.floor((lo + hi) / 2);
    const pivotValue = workingArray[pivotIndex].value;
    workingArray[pivotIndex].state = 'pivot';
    context.addStep(`Partition ${lo}-${hi} using pivot ${pivotValue} at index ${pivotIndex}`, [pivotIndex], 'pivot');

    let left = lo - 1;
    let right = hi + 1;

    while (true) {
      do {
        left += 1;
        if (left >= workingArray.length) break;
        workingArray[left].state = 'comparing';
        context.addStep(`Compare index ${left} (${workingArray[left].value}) with pivot ${pivotValue}`, [left, pivotIndex], 'compare');
        context.comparisons += 1;
        workingArray[left].state = 'default';
      } while (workingArray[left].value < pivotValue);

      do {
        right -= 1;
        if (right < 0) break;
        workingArray[right].state = 'comparing';
        context.addStep(`Compare index ${right} (${workingArray[right].value}) with pivot ${pivotValue}`, [right, pivotIndex], 'compare');
        context.comparisons += 1;
        workingArray[right].state = 'default';
      } while (workingArray[right].value > pivotValue);

      if (left >= right) {
        workingArray[pivotIndex].state = 'default';
        if (lo < right) stack.push([lo, right]);
        if (right + 1 < hi) stack.push([right + 1, hi]);
        break;
      }

      workingArray[left].state = 'swapping';
      workingArray[right].state = 'swapping';
      context.addStep(`Swap index ${left} and ${right}`, [left, right], 'swap', { from: right, to: left });
      [workingArray[left], workingArray[right]] = [workingArray[right], workingArray[left]];
      context.swaps += 1;
      workingArray[left].state = 'default';
      workingArray[right].state = 'default';
    }
  }

  workingArray.forEach((element, index) => {
    element.state = 'sorted';
    context.addStep(`Index ${index} confirmed`, [index], 'sort');
  });
};

const mergeSortBottomUp: AlgorithmExecutor = (context) => {
  const { workingArray } = context;
  const aux = workingArray.map(item => ({ ...item }));

  for (let size = 1; size < workingArray.length; size *= 2) {
    for (let left = 0; left < workingArray.length - size; left += size * 2) {
      const mid = left + size - 1;
      const right = Math.min(left + (size * 2) - 1, workingArray.length - 1);

      context.addStep(`Merge ranges [${left}, ${mid}] and [${mid + 1}, ${right}]`, [left, right], 'select');

      let i = left;
      let j = mid + 1;
      let k = left;

      while (i <= mid && j <= right) {
        workingArray[i].state = 'comparing';
        workingArray[j].state = 'comparing';
        context.addStep(
          `Compare ${workingArray[i].value} (index ${i}) with ${workingArray[j].value} (index ${j})`,
          [i, j],
          'compare'
        );
        context.comparisons += 1;

        if (workingArray[i].value <= workingArray[j].value) {
          aux[k++] = { ...workingArray[i], state: 'default' };
          workingArray[i].state = 'default';
          i += 1;
        } else {
          aux[k++] = { ...workingArray[j], state: 'default' };
          workingArray[j].state = 'default';
          j += 1;
        }
      }

      while (i <= mid) {
        aux[k++] = { ...workingArray[i], state: 'default' };
        i += 1;
      }

      while (j <= right) {
        aux[k++] = { ...workingArray[j], state: 'default' };
        j += 1;
      }

      for (let idx = left; idx <= right; idx++) {
        workingArray[idx] = { ...aux[idx], state: 'swapping' };
      }
      context.addStep(`Merged section [${left}, ${right}]`, [left, right], 'swap');

      for (let idx = left; idx <= right; idx++) {
        workingArray[idx].state = 'default';
      }
    }
  }

  workingArray.forEach((element, index) => {
    element.state = 'sorted';
    context.addStep(`Index ${index} in order`, [index], 'sort');
  });
};

const mergeSortTopDown: AlgorithmExecutor = (context) => {
  const { workingArray } = context;
  const aux = workingArray.map(item => ({ ...item }));

  const merge = (left: number, mid: number, right: number) => {
    context.addStep(`Merge ranges [${left}, ${mid}] and [${mid + 1}, ${right}]`, [left, right], 'select');

    let i = left;
    let j = mid + 1;
    let k = left;

    while (i <= mid && j <= right) {
      workingArray[i].state = 'comparing';
      workingArray[j].state = 'comparing';
      context.addStep(
        `Compare ${workingArray[i].value} (index ${i}) with ${workingArray[j].value} (index ${j})`,
        [i, j],
        'compare'
      );
      context.comparisons += 1;

      if (workingArray[i].value <= workingArray[j].value) {
        aux[k++] = { ...workingArray[i], state: 'default' };
        workingArray[i].state = 'default';
        i += 1;
      } else {
        aux[k++] = { ...workingArray[j], state: 'default' };
        workingArray[j].state = 'default';
        j += 1;
      }
    }

    while (i <= mid) {
      aux[k++] = { ...workingArray[i], state: 'default' };
      i += 1;
    }

    while (j <= right) {
      aux[k++] = { ...workingArray[j], state: 'default' };
      j += 1;
    }

    for (let idx = left; idx <= right; idx++) {
      workingArray[idx] = { ...aux[idx], state: 'swapping' };
    }
    context.addStep(`Merged section [${left}, ${right}]`, [left, right], 'swap');

    for (let idx = left; idx <= right; idx++) {
      workingArray[idx].state = 'default';
    }
  };

  const sort = (left: number, right: number) => {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    sort(left, mid);
    sort(mid + 1, right);
    merge(left, mid, right);
  };

  sort(0, workingArray.length - 1);

  workingArray.forEach((element, index) => {
    element.state = 'sorted';
    context.addStep(`Index ${index} in order`, [index], 'sort');
  });
};

const heapSort: AlgorithmExecutor = (context) => {
  const { workingArray } = context;
  const length = workingArray.length;

  const swapNodes = (i: number, j: number, message: string) => {
    workingArray[i].state = 'swapping';
    workingArray[j].state = 'swapping';
    context.addStep(message, [i, j], 'swap', { from: i, to: j });
    [workingArray[i], workingArray[j]] = [workingArray[j], workingArray[i]];
    context.swaps += 1;
    workingArray[i].state = 'default';
    workingArray[j].state = 'default';
  };

  const siftDown = (start: number, end: number) => {
    let root = start;
    while (root * 2 + 1 <= end) {
      const child = root * 2 + 1;
      let swapIndex = root;

      workingArray[root].state = 'comparing';
      workingArray[child].state = 'comparing';
      context.addStep(`Compare parent ${root} with left child ${child}`, [root, child], 'compare');
      context.comparisons += 1;

      if (workingArray[swapIndex].value < workingArray[child].value) {
        swapIndex = child;
      }

      if (child + 1 <= end) {
        workingArray[child + 1].state = 'comparing';
        context.addStep(`Compare parent ${root} with right child ${child + 1}`, [root, child + 1], 'compare');
        context.comparisons += 1;
        if (workingArray[swapIndex].value < workingArray[child + 1].value) {
          swapIndex = child + 1;
        }
        workingArray[child + 1].state = 'default';
      }

      workingArray[root].state = 'default';
      workingArray[child].state = 'default';

      if (swapIndex === root) {
        return;
      }

      swapNodes(root, swapIndex, `Swap node ${root} with child ${swapIndex}`);
      root = swapIndex;
    }
  };

  context.addStep('Build max heap', [], 'select');
  for (let i = Math.floor(length / 2) - 1; i >= 0; i--) {
    siftDown(i, length - 1);
  }

  for (let end = length - 1; end > 0; end--) {
    swapNodes(0, end, `Move max value to position ${end}`);
    workingArray[end].state = 'sorted';
    context.addStep(`Position ${end} sorted`, [end], 'sort');
    siftDown(0, end - 1);
  }

  if (length > 0) {
    workingArray[0].state = 'sorted';
    context.addStep('Final element sorted', [0], 'sort');
  }
};

const shellSortWithGaps = (gaps: number[]): AlgorithmExecutor => (context) => {
  const { workingArray } = context;
  const length = workingArray.length;
  const filteredGaps = gaps.filter(gap => gap < length && gap > 0);

  filteredGaps.forEach((gap) => {
    context.addStep(`Gap ${gap}: gapped insertion sort`, [], 'select');
    for (let i = gap; i < length; i++) {
      let j = i;
      workingArray[i].state = 'current';
      context.addStep(`Insert index ${i} (value ${workingArray[i].value})`, [i], 'select');

      while (j >= gap && workingArray[j - gap].value > workingArray[j].value) {
        workingArray[j - gap].state = 'swapping';
        workingArray[j].state = 'swapping';
        context.addStep(`Swap index ${j} and ${j - gap}`, [j - gap, j], 'swap', { from: j - gap, to: j });
        [workingArray[j - gap], workingArray[j]] = [workingArray[j], workingArray[j - gap]];
        context.swaps += 1;
        context.comparisons += 1;
        workingArray[j].state = 'default';
        j -= gap;
      }

      if (j >= gap) {
        context.comparisons += 1;
      }

      workingArray[j].state = 'default';
      workingArray[i].state = 'default';
    }
  });

  workingArray.forEach((element, index) => {
    element.state = 'sorted';
    context.addStep(`Index ${index} sorted`, [index], 'sort');
  });
};

const cocktailSort: AlgorithmExecutor = (context) => {
  const { workingArray } = context;
  let start = 0;
  let end = workingArray.length - 1;
  let pass = 1;
  let swapped = true;

  while (swapped) {
    swapped = false;
    context.addStep(`Forward pass ${pass}`, [], 'select');

    for (let i = start; i < end; i++) {
      workingArray[i].state = 'comparing';
      workingArray[i + 1].state = 'comparing';
      context.addStep(`Compare index ${i} and ${i + 1}`, [i, i + 1], 'compare');
      context.comparisons += 1;

      if (workingArray[i].value > workingArray[i + 1].value) {
        workingArray[i].state = 'swapping';
        workingArray[i + 1].state = 'swapping';
        context.addStep(`Swap index ${i} and ${i + 1}`, [i, i + 1], 'swap', { from: i, to: i + 1 });
        [workingArray[i], workingArray[i + 1]] = [workingArray[i + 1], workingArray[i]];
        context.swaps += 1;
        swapped = true;
      }

      workingArray[i].state = 'default';
      workingArray[i + 1].state = 'default';
    }

    workingArray[end].state = 'sorted';
    context.addStep(`Position ${end} sorted`, [end], 'sort');
    end -= 1;

    if (!swapped) break;
    swapped = false;
    context.addStep(`Backward pass ${pass}`, [], 'select');

    for (let i = end; i > start; i--) {
      workingArray[i].state = 'comparing';
      workingArray[i - 1].state = 'comparing';
      context.addStep(`Compare index ${i - 1} and ${i}`, [i - 1, i], 'compare');
      context.comparisons += 1;

      if (workingArray[i - 1].value > workingArray[i].value) {
        workingArray[i - 1].state = 'swapping';
        workingArray[i].state = 'swapping';
        context.addStep(`Swap index ${i - 1} and ${i}`, [i - 1, i], 'swap', { from: i - 1, to: i });
        [workingArray[i - 1], workingArray[i]] = [workingArray[i], workingArray[i - 1]];
        context.swaps += 1;
        swapped = true;
      }

      workingArray[i].state = 'default';
      workingArray[i - 1].state = 'default';
    }

    workingArray[start].state = 'sorted';
    context.addStep(`Position ${start} sorted`, [start], 'sort');
    start += 1;
    pass += 1;
  }

  for (let i = start; i <= end; i++) {
    if (workingArray[i]) {
      workingArray[i].state = 'sorted';
      context.addStep(`Index ${i} sorted`, [i], 'sort');
    }
  }
};

const EXECUTORS: Record<SortingAlgorithm, Record<string, AlgorithmExecutor>> = {
  bubble: { default: bubbleSort },
  selection: { default: selectionSort },
  insertion: { default: insertionSort },
  merge: { topDown: mergeSortTopDown, bottomUp: mergeSortBottomUp },
  quick: { lomuto: quickSortLomuto, hoare: quickSortHoare },
  heap: { default: heapSort },
  shell: {
    ciura: shellSortWithGaps([701, 301, 132, 57, 23, 10, 4, 1]),
    knuth: shellSortWithGaps(
      Array.from({ length: 10 }, (_, index) => {
        const k = index + 1;
        return (Math.pow(3, k) - 1) / 2;
      })
        .reverse()
        .concat([1])
    ),
  },
  cocktail: { default: cocktailSort },
};

const resolveVariantKey = (algorithm: SortingAlgorithm, variant?: string | null): string | null => {
  const executors = EXECUTORS[algorithm];
  if (!executors) {
    return null;
  }

  if (variant && executors[variant]) {
    return variant;
  }

  const definition = ALGORITHMS[algorithm];
  if (definition?.variants) {
    if (definition.defaultVariant && executors[definition.defaultVariant]) {
      return definition.defaultVariant;
    }
    const availableVariant = Object.keys(definition.variants).find(key => executors[key]);
    if (availableVariant) {
      return availableVariant;
    }
  }

  if (executors.default) {
    return 'default';
  }

  const [firstKey] = Object.keys(executors);
  return firstKey ?? null;
};

export const generateSortingSteps = (
  array: ArrayElement[],
  algorithm: SortingAlgorithm,
  variant?: string | null
): SortingStep[] => {
  const workingArray = array.map((item, index) => ({
    ...item,
    id: item.id ?? index,
    state: 'default',
  }));

  const steps: SortingStep[] = [];
  const context: GenerationContext = {
    workingArray,
    steps,
    comparisons: 0,
    swaps: 0,
    addStep: (message, indices, action, swapPair) => {
      const snapshot = cloneArray(workingArray);
      steps.push({
        array: snapshot,
        message,
        indices,
        action,
        swapPair,
        stats: {
          comparisons: context.comparisons,
          swaps: context.swaps,
          timeElapsed: 0,
          progress: 0,
          currentStep: steps.length + 1,
          totalSteps: 0,
        },
      });
    },
  };

  const variantKey = resolveVariantKey(algorithm, variant);
  const executor = (variantKey && EXECUTORS[algorithm]?.[variantKey]) || EXECUTORS[algorithm]?.default;
  if (!executor) {
    throw new Error(`Sorting algorithm "${algorithm}" (variant: ${variant ?? 'default'}) not implemented.`);
  }

  const algorithmLabel = getAlgorithmLabel(algorithm);
  const variantLabel = variantKey && variantKey !== 'default'
    ? getAlgorithmVariantLabel(algorithm, variantKey)
    : null;
  const displayName = variantLabel ? `${algorithmLabel} (${variantLabel})` : algorithmLabel;

  context.addStep(`Starting ${displayName}`, [], 'select');
  executor(context);
  context.addStep(
    `${displayName} completed! ${context.swaps} swap${context.swaps === 1 ? '' : 's'}, ${context.comparisons} comparison${context.comparisons === 1 ? '' : 's'}`,
    [],
    'sort'
  );

  finalizeStats(steps);
  return steps;
};
