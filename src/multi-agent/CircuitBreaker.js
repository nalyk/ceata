export var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "closed";
    CircuitState["OPEN"] = "open";
    CircuitState["HALF_OPEN"] = "half_open"; // Testing recovery
})(CircuitState || (CircuitState = {}));
export class CircuitBreaker {
    constructor(config = {}) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.lastFailureTime = 0;
        this.config = {
            failureThreshold: 5,
            recoveryTimeout: 30000, // 30 seconds
            monitoringPeriod: 60000, // 1 minute
            successThreshold: 3,
            ...config
        };
    }
    async execute(operation) {
        if (this.state === CircuitState.OPEN) {
            if (this.shouldAttemptRecovery()) {
                this.state = CircuitState.HALF_OPEN;
                console.log('🔄 Circuit breaker attempting recovery');
            }
            else {
                throw new Error(`Circuit breaker OPEN - Fast fail to preserve system resources`);
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        if (this.state === CircuitState.HALF_OPEN) {
            this.successes++;
            if (this.successes >= this.config.successThreshold) {
                this.state = CircuitState.CLOSED;
                this.failures = 0;
                this.successes = 0;
                console.log('✅ Circuit breaker CLOSED - System recovered');
            }
        }
        else {
            this.failures = 0; // Reset failure count on success
        }
    }
    onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            this.successes = 0;
            console.log('🔴 Circuit breaker OPEN - Recovery failed');
        }
        else if (this.failures >= this.config.failureThreshold) {
            this.state = CircuitState.OPEN;
            console.log(`🔴 Circuit breaker OPEN - ${this.failures} failures exceeded threshold`);
        }
    }
    shouldAttemptRecovery() {
        return Date.now() - this.lastFailureTime >= this.config.recoveryTimeout;
    }
    getState() {
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
