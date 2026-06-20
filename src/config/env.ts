const DEFAULTS = {
  factordbProxyUrl: 'https://factordb-proxy.octopusyuzu.workers.dev',
  workerPoolSize: 3,
  sagecellSlots: 3,
  sagecellTimeout: 120,
  stallTimeout: 30,
  reportFactors: true,
} as const;

type EnvKey = keyof typeof DEFAULTS;

const DOCS: Record<EnvKey, string> = {
  factordbProxyUrl:
    'FactorDB CORS proxy URL — deploy workers/factordb-proxy.js to set your own',
  workerPoolSize:
    'Web Worker pool size for frontendCheck parallel execution',
  sagecellSlots:
    'Max concurrent SageMathCell kernel executions',
  sagecellTimeout:
    'SageMathCell execution timeout in seconds (kills kernel after this)',
  stallTimeout:
    'Seconds of stdout unchanged before kernel is presumed dead',
  reportFactors:
    'Report discovered factors to FactorDB (set false for competitive CTF)',
};

const PREFIX = 'rsa:env:';

class Env {
  private _factordbProxyUrl: string;
  private _workerPoolSize: number;
  private _sagecellSlots: number;
  private _sagecellTimeout: number;
  private _stallTimeout: number;
  private _reportFactors: boolean;

  constructor() {
    this._factordbProxyUrl = this.read('factordbProxyUrl', DEFAULTS.factordbProxyUrl);
    this._workerPoolSize = this.read('workerPoolSize', DEFAULTS.workerPoolSize);
    this._sagecellSlots = this.read('sagecellSlots', DEFAULTS.sagecellSlots);
    this._sagecellTimeout = this.read('sagecellTimeout', DEFAULTS.sagecellTimeout);
    this._stallTimeout = this.read('stallTimeout', DEFAULTS.stallTimeout);
    this._reportFactors = this.read('reportFactors', DEFAULTS.reportFactors);
  }

  private read<T>(key: EnvKey, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private write<T>(key: EnvKey, value: T): void {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  }

  get factordbProxyUrl(): string { return this._factordbProxyUrl; }
  set factordbProxyUrl(v: string) { this._factordbProxyUrl = v; this.write('factordbProxyUrl', v); }

  get workerPoolSize(): number { return this._workerPoolSize; }
  set workerPoolSize(v: number) { this._workerPoolSize = v; this.write('workerPoolSize', v); }

  get sagecellSlots(): number { return this._sagecellSlots; }
  set sagecellSlots(v: number) { this._sagecellSlots = v; this.write('sagecellSlots', v); }

  get sagecellTimeout(): number { return this._sagecellTimeout; }
  set sagecellTimeout(v: number) { this._sagecellTimeout = v; this.write('sagecellTimeout', v); }

  get stallTimeout(): number { return this._stallTimeout; }
  set stallTimeout(v: number) { this._stallTimeout = v; this.write('stallTimeout', v); }

  get reportFactors(): boolean { return this._reportFactors; }
  set reportFactors(v: boolean) { this._reportFactors = v; this.write('reportFactors', v); }

  get DOCS() { return DOCS; }

  reset(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX)) keysToRemove.push(key);
    }
    for (const key of keysToRemove) localStorage.removeItem(key);
    window.location.reload();
  }
}

declare global {
  interface Window {
    env: Env;
  }
}

const env = new Env();
if (typeof window !== 'undefined') {
  window.env = env;
}
export default env;
