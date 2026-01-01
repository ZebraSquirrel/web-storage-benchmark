import { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, X, Sun, Moon } from 'lucide-react';
import {
  LocalStorageAdapter,
  SessionStorageAdapter,
  IndexedDBAdapter,
  CacheStorageAdapter,
  CookieAdapter,
  DexieAdapter,
  StoreJsAdapter,
  PouchDBAdapter,
  LocalForageAdapter,
  OPFSAdapter,
  type StorageAdapter
} from './lib/storage';
import { runBenchmark, suites, purgeAll } from './lib/benchmark';
import type { BenchmarkResult } from './lib/benchmark';
import './App.css';

const adapters: StorageAdapter[] = [
  new LocalStorageAdapter(),
  new SessionStorageAdapter(),
  new IndexedDBAdapter(),
  new CacheStorageAdapter(),
  new CookieAdapter(),
  new DexieAdapter(),
  new StoreJsAdapter(),
  new PouchDBAdapter(),
  new LocalForageAdapter(),
  new OPFSAdapter(),
];

const STORAGE_COLORS: Record<string, string> = {
  'localStorage': '#4ade80',
  'sessionStorage': '#60a5fa',
  'IndexedDB': '#fbbf24',
  'Cache Storage': '#f97316',
  'Cookies': '#f87171',
  'Dexie.js': '#22d3ee',
  'store.js': '#e879f9',
  'PouchDB': '#a3e635',
  'localForage': '#818cf8',
  'OPFS': '#2dd4bf',
};

const getStorageClassName = (name: string) => {
  return `storage-${name.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '-')}`;
};

function App() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [visibleAdapters, setVisibleAdapters] = useState<string[]>(adapters.map(a => a.name));
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleAdapter = (name: string) => {
    setVisibleAdapters(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const sortedLegendItems = useMemo(() => {
    return [...adapters].sort((a, b) => {
      const aVisible = visibleAdapters.includes(a.name);
      const bVisible = visibleAdapters.includes(b.name);
      if (aVisible && !bVisible) return -1;
      if (!aVisible && bVisible) return 1;
      return 0;
    });
  }, [visibleAdapters]);

  const chartData = useMemo(() => {
    const failedAdapters = new Set<string>();

    return suites.map(suite => {
      const payloadLabel = suite.payloads[0].label;
      const dataPoint: any = { name: payloadLabel };

      adapters.forEach(adapter => {
        const res = results.find(r => r.suiteName === suite.name && r.adapterName === adapter.name);

        if (res?.error) {
          failedAdapters.add(adapter.name);
        }

        if (failedAdapters.has(adapter.name)) {
          dataPoint[adapter.name] = null;
        } else if (res) {
          const total = parseFloat((res.writeTime + res.readTime).toFixed(2));
          dataPoint[adapter.name] = Math.max(total, 0.01);
        } else {
          dataPoint[adapter.name] = null;
        }
      });
      return dataPoint;
    });
  }, [results]);

  const runAllBenchmarks = async () => {
    setIsRunning(true);
    setResults([]);
    const allResults: BenchmarkResult[] = [];

    for (const suite of suites) {
      for (const adapter of adapters) {
        try {
          const suiteResults = await runBenchmark(adapter, suite);
          allResults.push(...suiteResults);
          setResults([...allResults]);
        } catch (e) {
          console.error(`Failed suite ${suite.name} for ${adapter.name}`, e);
        }
      }
    }

    await purgeAll(adapters);
    setIsRunning(false);
  };

  const getSuiteResults = (suiteName: string) => {
    return results
      .filter(r => r.suiteName === suiteName)
      .sort((a, b) => {
        if (a.error && !b.error) return 1;
        if (!a.error && b.error) return -1;
        return a.writeTime + a.readTime - (b.writeTime + b.readTime);
      });
  };

  return (
    <div className="container">
      <div className="theme-toggle-container">
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      <header>
        <div className="title-row">
          <img src="database-stats.svg" alt="Logo" className="header-logo" />
          <h1>Web Storage Benchmark</h1>
        </div>
        <p className="subtitle">Comparing performance across various web storage technologies</p>
        <button
          className="run-all-btn"
          onClick={runAllBenchmarks}
          disabled={isRunning}
        >
          {theme === 'dark' && isRunning ? 'Benchmarking...' : isRunning ? 'Running...' : 'Run All Benchmarks'}
        </button>
      </header>

      <section className="chart-section">
        <div className="chart-header">
          <div className="chart-title">
            <Activity size={20} />
            <h2>Performance Efficiency (Total Time)</h2>
          </div>
        </div>

        <div className="custom-legend">
          {sortedLegendItems.map(adapter => {
            const isActive = visibleAdapters.includes(adapter.name);
            return (
              <button
                key={adapter.name}
                className={`legend-badge ${isActive ? '' : 'inactive'}`}
                onClick={() => toggleAdapter(adapter.name)}
                style={{
                  '--badge-color': STORAGE_COLORS[adapter.name],
                } as any}
              >
                <span className="badge-dot"></span>
                <span className="badge-label">{adapter.name}</span>
                {isActive && <X size={12} className="badge-remove" />}
              </button>
            );
          })}
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                scale="log"
                domain={['auto', 'auto']}
                label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: '#64748b', offset: 0 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--text-primary)'
                }}
                itemStyle={{ padding: '2px 0' }}
                itemSorter={(item: any) => -item.value}
              />
              {adapters.map(adapter => (
                <Line
                  key={adapter.name}
                  type="monotone"
                  dataKey={adapter.name}
                  stroke={STORAGE_COLORS[adapter.name]}
                  strokeWidth={3}
                  hide={!visibleAdapters.includes(adapter.name)}
                  dot={{ r: 4, fill: STORAGE_COLORS[adapter.name], strokeWidth: 0, fillOpacity: 1 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="benchmarks-grid">
        {suites.map(suite => {
          const suiteResults = getSuiteResults(suite.name);
          return (
            <div key={suite.name} className="suite-card">
              <div className="suite-card-header">
                <h2>{suite.name}</h2>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Storage</th>
                      <th>Write (ms)</th>
                      <th>Read (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suiteResults.map((result, index) => (
                      <tr key={`${result.adapterName}-${result.payloadSize}`}>
                        <td className={`${(index === 0 && !result.error) ? 'rank-1' : ''} ${getStorageClassName(result.adapterName)}`}>
                          {result.adapterName}
                        </td>
                        <td className={result.error ? 'error-cell' : ''}>{result.error ? '❌' : result.writeTime.toFixed(2)}</td>
                        <td className={result.error ? 'error-cell' : ''}>{result.error ? '❌' : result.readTime.toFixed(2)}</td>
                      </tr>
                    ))}
                    {suiteResults.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', opacity: 0.5 }}>
                          No results yet. Run benchmarks to see data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
