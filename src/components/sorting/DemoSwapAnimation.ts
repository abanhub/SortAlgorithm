// Demo.me style swap animation - exact replication of Java animateSwap() method
export interface SwapState {
  isSwapping: boolean;
  idxA: number;
  idxB: number;
  t: number; // progress from 0 to 1
  duration: number; // in milliseconds
}

export class DemoSwapAnimation {
  private swapState: SwapState | null = null;
  private animationFrame: number | null = null;
  private startTime: number = 0;
  
  // Default duration (demo.me ~300ms). Can be overridden per swap.
  private readonly SWAP_DURATION = 300;
  private readonly LIFT = 22; // exact lift amount from demo.me
  
  startSwap(
    idxA: number,
    idxB: number,
    onUpdate: (state: SwapState) => void,
    onComplete: () => void,
    durationOverride?: number
  ) {
    this.swapState = {
      isSwapping: true,
      idxA,
      idxB,
      t: 0,
      duration: Math.max(50, durationOverride ?? this.SWAP_DURATION)
    };
    
    this.startTime = performance.now();
    this.animate(onUpdate, onComplete);
  }
  
  private animate(onUpdate: (state: SwapState) => void, onComplete: () => void) {
    if (!this.swapState) return;
    
    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.swapState.duration, 1.0);
    
    this.swapState.t = progress;
    onUpdate(this.swapState);
    
    if (progress >= 1.0) {
      this.swapState = null;
      onComplete();
    } else {
      this.animationFrame = requestAnimationFrame(() => this.animate(onUpdate, onComplete));
    }
  }
  
  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.swapState = null;
  }
  
  isActive(): boolean {
    return this.swapState !== null;
  }
  
  getCurrentSwap(): SwapState | null {
    return this.swapState;
  }
}
