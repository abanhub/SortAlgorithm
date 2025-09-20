import { useState, useEffect, useCallback } from 'react';
import { ArrayElement } from './types';

export const useSwapAnimation = (animationSpeed: number) => {
  const [animatingElements, setAnimatingElements] = useState<Set<number>>(new Set());

  const animateSwap = useCallback((
    array: ArrayElement[],
    index1: number,
    index2: number,
    onComplete: (newArray: ArrayElement[]) => void
  ) => {
    const newArray = [...array];
    const element1 = { ...newArray[index1] };
    const element2 = { ...newArray[index2] };

    // Calculate positions for animation
    const barWidth = Math.max(3, Math.min(50, 800 / array.length));
    const gap = 1;
    const startX1 = index1 * (barWidth + gap);
    const startX2 = index2 * (barWidth + gap);
    const targetX1 = index2 * (barWidth + gap);
    const targetX2 = index1 * (barWidth + gap);

    // Set up animation data
    element1.swapAnimation = {
      isAnimating: true,
      targetIndex: index2,
      progress: 0,
      startX: startX1,
      targetX: targetX1
    };

    element2.swapAnimation = {
      isAnimating: true,
      targetIndex: index1,
      progress: 0,
      startX: startX2,
      targetX: targetX2
    };

    element1.state = 'swapping';
    element2.state = 'swapping';

    newArray[index1] = element1;
    newArray[index2] = element2;

    setAnimatingElements(prev => new Set([...prev, index1, index2]));

    // Animate the swap
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationSpeed, 1);

      // Easing function for smooth animation
      const easeInOutCubic = (t: number) => 
        t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

      const easedProgress = easeInOutCubic(progress);

      // Update progress
      if (newArray[index1]?.swapAnimation) {
        newArray[index1].swapAnimation.progress = easedProgress;
      }
      if (newArray[index2]?.swapAnimation) {
        newArray[index2].swapAnimation.progress = easedProgress;
      }

      if (progress < 1) {
        // Continue animation
        requestAnimationFrame(animate);
      } else {
        // Animation complete - perform the actual swap
        const temp = { ...newArray[index1] };
        newArray[index1] = { ...newArray[index2] };
        newArray[index2] = temp;

        // Clean up animation data
        newArray[index1].swapAnimation = undefined;
        newArray[index2].swapAnimation = undefined;
        newArray[index1].state = 'default';
        newArray[index2].state = 'default';

        setAnimatingElements(prev => {
          const updated = new Set(prev);
          updated.delete(index1);
          updated.delete(index2);
          return updated;
        });

        onComplete(newArray);
      }
    };

    requestAnimationFrame(animate);
  }, [animationSpeed]);

  return {
    animateSwap,
    isAnimating: animatingElements.size > 0,
    animatingElements
  };
};