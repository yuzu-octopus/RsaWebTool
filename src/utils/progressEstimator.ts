export interface ProgressEstimate {
  remainingMs: number;
  speed: number;
  formattedEta: string;
}

export class ProgressEstimator {
  private lastProgress: number;
  private lastTime: number;
  private emaSpeed: number;
  private readonly alpha: number;

  constructor(alpha: number = 0.3) {
    this.lastProgress = 0;
    this.lastTime = Date.now();
    this.emaSpeed = 0;
    this.alpha = alpha;
  }

  update(progress: number): ProgressEstimate {
    const now = Date.now();
    const dt = (now - this.lastTime) / 1000;
    const dp = progress - this.lastProgress;

    if (dp > 0 && dt > 0) {
      const instantSpeed = dp / dt;
      this.emaSpeed = this.alpha * instantSpeed + (1 - this.alpha) * this.emaSpeed;
    }

    let remainingMs: number;
    if (progress >= 100) {
      remainingMs = 0;
    } else if (this.emaSpeed > 0) {
      remainingMs = ((100 - progress) / this.emaSpeed) * 1000;
    } else {
      remainingMs = Infinity;
    }

    this.lastProgress = progress;
    this.lastTime = now;

    return {
      remainingMs,
      speed: this.emaSpeed,
      formattedEta: formatEta(remainingMs),
    };
  }

  reset(): void {
    this.lastProgress = 0;
    this.lastTime = Date.now();
    this.emaSpeed = 0;
  }
}

function formatEta(remainingMs: number): string {
  if (!isFinite(remainingMs)) {
    return '--';
  }
  if (remainingMs < 0) {
    remainingMs = 0;
  }

  const totalSeconds = Math.round(remainingMs / 1000);

  if (totalSeconds < 1) {
    return '< 1s';
  }

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}
