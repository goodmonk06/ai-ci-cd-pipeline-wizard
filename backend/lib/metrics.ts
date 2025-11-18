interface MetricLabels {
  [key: string]: string | number;
}

interface MetricEntry {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels?: MetricLabels;
  timestamp: string;
}

class Metrics {
  private metrics: MetricEntry[] = [];

  // Counter: increments only
  recordCounter(name: string, value: number = 1, labels?: MetricLabels) {
    this.record('counter', name, value, labels);
  }

  // Gauge: can go up or down
  recordGauge(name: string, value: number, labels?: MetricLabels) {
    this.record('gauge', name, value, labels);
  }

  // Histogram: for timing/duration measurements
  recordHistogram(name: string, value: number, labels?: MetricLabels) {
    this.record('histogram', name, value, labels);
  }

  private record(type: MetricEntry['type'], name: string, value: number, labels?: MetricLabels) {
    const entry: MetricEntry = {
      type,
      name,
      value,
      labels,
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(entry);

    // In production, this would send to a metrics service
    // For now, we'll just log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('[METRIC]', JSON.stringify(entry));
    }
  }

  // Timing helper
  startTimer(name: string, labels?: MetricLabels) {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.recordHistogram(name, duration, labels);
    };
  }

  // Get all metrics (for debugging or export)
  getMetrics(): MetricEntry[] {
    return [...this.metrics];
  }

  // Clear metrics (useful for testing)
  clear() {
    this.metrics = [];
  }
}

export const metrics = new Metrics();

// Common metric names
export const MetricNames = {
  API_REQUEST: 'api.request',
  API_ERROR: 'api.error',
  GENERATION_REQUEST: 'generation.request',
  GENERATION_SUCCESS: 'generation.success',
  GENERATION_FAILURE: 'generation.failure',
  GENERATION_DURATION: 'generation.duration',
  OPENAI_REQUEST: 'openai.request',
  OPENAI_TOKENS: 'openai.tokens',
  DB_QUERY: 'db.query',
  DB_ERROR: 'db.error',
} as const;
