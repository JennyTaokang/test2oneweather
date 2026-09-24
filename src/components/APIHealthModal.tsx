import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  CloudSun,
  MapPin,
  Route,
  Sparkles,
  ExternalLink,
  X,
  Cpu,
  Clock,
} from 'lucide-react';

interface ServiceHealth {
  status: 'operational' | 'degraded' | 'error' | 'fallback-active';
  latencyMs?: number;
  message?: string;
  statusCode?: number;
  resultsFound?: number;
  areasTracked?: number;
  validPeriod?: string;
  provider?: string;
  resilience?: string;
  model?: string;
  geminiConfigured?: boolean;
}

interface HealthData {
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

interface APIHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const APIHealthModal: React.FC<APIHealthModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  const fetchHealth = async (forceFresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/health${forceFresh ? '?fresh=true' : ''}`);
      if (!res.ok) {
        throw new Error(`Health check returned status ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to query /api/health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusBadge = (status?: string) => {
    if (status === 'operational' || status === 'healthy') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          Operational
        </span>
      );
    }
    if (status === 'fallback-active' || status === 'degraded') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3" />
          {status === 'fallback-active' ? 'Fallback Active' : 'Degraded'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        <XCircle className="w-3 h-3" />
        Unreachable
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-neutral-100">API Health & System Status</h2>
                {data && getStatusBadge(data.status)}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">Live diagnostic check for Singapore travel services</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchHealth(true)}
              disabled={loading}
              title="Run fresh probe now"
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Metrics Bar */}
          {data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">Status</span>
                <span
                  className={`text-sm font-semibold capitalize ${
                    data.status === 'healthy' ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {data.status}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">Uptime</span>
                <span className="text-sm font-semibold text-neutral-200">{data.uptimeFormatted}</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">Memory RSS</span>
                <span className="text-sm font-semibold text-neutral-200">{data.system.memoryRssMb} MB</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">Endpoint</span>
                <span className="text-sm font-semibold text-neutral-200">/api/health</span>
              </div>
            </div>
          )}

          {/* Services List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Integrated Services</h3>

            {/* 1. OneMap Search API */}
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-200">OneMap Singapore Search API</h4>
                    <p className="text-xs text-neutral-400">Singapore Land Authority (SLA) Geocoding</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {data?.services?.onemapSearch?.latencyMs !== undefined && (
                    <span className="text-xs text-neutral-400 font-mono">
                      {data.services.onemapSearch.latencyMs} ms
                    </span>
                  )}
                  {getStatusBadge(data?.services?.onemapSearch?.status)}
                </div>
              </div>
              <p className="text-xs text-neutral-300 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/50">
                {data?.services?.onemapSearch?.message || 'Probing OneMap Search...'}
              </p>
            </div>

            {/* 2. Weather 2-Hour Forecast API */}
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <CloudSun className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-200">data.gov.sg Weather Forecast API</h4>
                    <p className="text-xs text-neutral-400">National Environment Agency (NEA) 2-Hr Forecast</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {data?.services?.weatherApi?.latencyMs !== undefined && (
                    <span className="text-xs text-neutral-400 font-mono">
                      {data.services.weatherApi.latencyMs} ms
                    </span>
                  )}
                  {getStatusBadge(data?.services?.weatherApi?.status)}
                </div>
              </div>
              <p className="text-xs text-neutral-300 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/50">
                {data?.services?.weatherApi?.message || 'Probing Weather Forecast...'}
              </p>
            </div>

            {/* 3. Routing Engine */}
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Route className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-200">Multi-Tier Routing Engine</h4>
                    <p className="text-xs text-neutral-400">OneMap + OSRM + Zero-Failure Synthesizer</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {data?.services?.routingEngine?.latencyMs !== undefined && (
                    <span className="text-xs text-neutral-400 font-mono">
                      {data.services.routingEngine.latencyMs} ms
                    </span>
                  )}
                  {getStatusBadge(data?.services?.routingEngine?.status)}
                </div>
              </div>
              <p className="text-xs text-neutral-300 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/50">
                {data?.services?.routingEngine?.message || 'Verifying routing synthesizer...'}
              </p>
            </div>

            {/* 4. AI Assistant */}
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-200">AI Travel Agent & Tool Calling</h4>
                    <p className="text-xs text-neutral-400">Gemini 2.5 Flash with Autonomous Tool Execution</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(data?.services?.aiAssistant?.status)}
                </div>
              </div>
              <p className="text-xs text-neutral-300 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/50">
                {data?.services?.aiAssistant?.message || 'Checking AI assistant status...'}
              </p>
            </div>
          </div>

          {/* Toggle Raw JSON */}
          <div className="pt-2">
            <button
              onClick={() => setShowJson(!showJson)}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>{showJson ? 'Hide Raw JSON Response' : 'Inspect Raw /api/health JSON'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            {showJson && data && (
              <pre className="mt-2 p-3 rounded-xl bg-black text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-56 border border-neutral-800">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            <span>Checked: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Pending'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchHealth(true)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 transition-colors text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Testing...' : 'Run Test Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
