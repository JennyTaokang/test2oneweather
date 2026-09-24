export interface ServiceHealth {
  status: 'operational' | 'degraded' | 'error' | 'fallback-active';
  latencyMs?: number;
  message?: string;
  statusCode?: number;
  resultsFound?: number;
  authenticated?: boolean;
  areasTracked?: number;
  validPeriod?: string;
  updateTimestamp?: string;
  provider?: string;
  resilience?: string;
  model?: string;
  geminiConfigured?: boolean;
  toolCallingEnabled?: boolean;
}

export interface HealthResponseData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  environment: string;
  summary: string;
  cached?: boolean;
  cacheAgeMs?: number;
  services: {
    onemapSearch: ServiceHealth;
    weatherApi: ServiceHealth;
    routingEngine: ServiceHealth;
    aiAssistant: ServiceHealth;
  };
  system: {
    memoryRssMb: number;
    memoryHeapUsedMb: number;
    nodeVersion: string;
  };
}

/**
 * Fetch live API health status from /api/health
 */
export async function fetchApiHealth(forceFresh = false): Promise<HealthResponseData> {
  const url = `/api/health${forceFresh ? '?fresh=true' : ''}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Health check failed with HTTP ${res.status}`);
  }

  return res.json();
}
