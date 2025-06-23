export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failure mode - reject fast
  HALF_OPEN = 'half_open' // Testing recovery
}

export interface CircuitBreakerConfig {
  readonly failureThreshold: number;    // Number of failures before opening
  readonly recoveryTimeout: number;     // Time before attempting recovery (ms)
  readonly monitoringPeriod: number;    // Time window for failure counting (ms)
  readonly successThreshold: number;    // Successes needed to close from half-open
}

export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private readonly config: CircuitBreakerConfig;
  
  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000, // 1 minute
      successThreshold: 3,
      ...config
    };
  }
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptRecovery()) {
        this.state = CircuitState.HALF_OPEN;
        console.log('🔄 Circuit breaker attempting recovery');
      } else {
        throw new Error(`Circuit breaker OPEN - Fast fail to preserve system resources`);
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        console.log('✅ Circuit breaker CLOSED - System recovered');
      }
    } else {
      this.failures = 0; // Reset failure count on success
    }
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.successes = 0;
      console.log('🔴 Circuit breaker OPEN - Recovery failed');
    } else if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.log(`🔴 Circuit breaker OPEN - ${this.failures} failures exceeded threshold`);
    }
  }
  
  private shouldAttemptRecovery(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.recoveryTimeout;
  }
  
  getState(): CircuitState {
    return this.state;
  }
  
  getMetrics() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime
    };
  }
}