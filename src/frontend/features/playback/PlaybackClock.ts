/**
 * PlaybackClock - Self-contained class that manages simulation time via RAF.
 *
 * This class handles all time-related logic without React state, avoiding
 * unnecessary re-renders. Components can poll getTime() at their own frequency.
 */
export class PlaybackClock {
  private _time = 0;
  private _isPlaying = false;
  private _speed = 1;
  private _duration = 0;
  private _rafId: number | null = null;
  private _lastTimestamp: number | null = null;
  private _seekTarget: number | null = null;

  // Getters
  getTime(): number {
    // Return seekTarget if pending, otherwise return current time
    return this._seekTarget !== null ? this._seekTarget : this._time;
  }

  isPlaying(): boolean {
    return this._isPlaying;
  }

  getSpeed(): number {
    return this._speed;
  }

  getDuration(): number {
    return this._duration;
  }

  // Setters
  setDuration(duration: number): void {
    this._duration = duration;
  }

  setSpeed(speed: number): void {
    this._speed = speed;
  }

  // Controls
  play(): void {
    if (this._isPlaying) {
      return;
    }
    this._isPlaying = true;
    this._lastTimestamp = null;
    this._tick();
  }

  pause(): void {
    this._isPlaying = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    // Apply pending seek immediately since no more ticks will run
    if (this._seekTarget !== null) {
      this._time = this._seekTarget;
      this._seekTarget = null;
    }
  }

  togglePlay(): void {
    if (this._isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(time: number): void {
    this._seekTarget = Math.max(0, Math.min(time, this._duration));
    this._lastTimestamp = null; // Reset to avoid jump
  }

  reset(): void {
    this.pause();
    this._time = 0;
    this._seekTarget = null;
  }

  private _tick = (): void => {
    if (!this._isPlaying) {
      return;
    }

    // Apply pending seek at the start of the frame
    if (this._seekTarget !== null) {
      this._time = this._seekTarget;
      this._seekTarget = null;
    }

    const now = performance.now();
    if (this._lastTimestamp !== null) {
      const deltaMs = now - this._lastTimestamp;
      this._time += (deltaMs / 1000) * this._speed;
      if (this._time > this._duration) {
        this._time = this._duration;
      }
    }
    this._lastTimestamp = now;
    this._rafId = requestAnimationFrame(this._tick);
  };

  dispose(): void {
    this.pause();
  }
}
