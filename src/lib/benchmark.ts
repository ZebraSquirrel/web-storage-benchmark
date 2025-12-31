import type { StorageAdapter } from './storage';

export interface BenchmarkResult {
    adapterName: string;
    suiteName: string;
    payloadSize: string;
    writeTime: number; // ms
    readTime: number; // ms
    blockingTime: number; // ms (estimated)
    error?: string;
}

export interface BenchmarkSuite {
    name: string;
    payloads: { label: string; size: number }[];
}

export const suites: BenchmarkSuite[] = [
    {
        name: "Save a preference (128 B)",
        payloads: [{ label: "128 B", size: 128 }]
    },
    {
        name: "Persist UI state (1 KB)",
        payloads: [{ label: "1 KB", size: 1024 }]
    },
    {
        name: "Persist UI state (10 KB)",
        payloads: [{ label: "10 KB", size: 10 * 1024 }]
    },
    {
        name: "Offline dataset (100 KB)",
        payloads: [{ label: "100 KB", size: 100 * 1024 }]
    },
    {
        name: "Offline dataset (1 MB)",
        payloads: [{ label: "1 MB", size: 1024 * 1024 }]
    },
    {
        name: "Offline dataset (2 MB)",
        payloads: [{ label: "2 MB", size: 2 * 1024 * 1024 }]
    },
    {
        name: "Offline dataset (4 MB)",
        payloads: [{ label: "4 MB", size: 4 * 1024 * 1024 }]
    },
    {
        name: "Offline dataset (8 MB)",
        payloads: [{ label: "8 MB", size: 8 * 1024 * 1024 }]
    },
    {
        name: "Offline dataset (16 MB)",
        payloads: [{ label: "16 MB", size: 16 * 1024 * 1024 }]
    },
    {
        name: "Large dataset (32 MB)",
        payloads: [{ label: "32 MB", size: 32 * 1024 * 1024 }]
    },
    {
        name: "Large dataset (64 MB)",
        payloads: [{ label: "64 MB", size: 64 * 1024 * 1024 }]
    },
    {
        name: "Large dataset (100 MB)",
        payloads: [{ label: "100 MB", size: 100 * 1024 * 1024 }]
    }
];

function generatePayload(size: number): string {
    return "a".repeat(size);
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runOnce(adapter: StorageAdapter, key: string, data: string) {
    await adapter.clear();
    const writeStart = performance.now();
    await adapter.write(key, data);
    const writeEnd = performance.now();
    const writeTime = writeEnd - writeStart;

    const readStart = performance.now();
    await adapter.read(key);
    const readEnd = performance.now();
    const readTime = readEnd - readStart;

    return { writeTime, readTime };
}

export async function runBenchmark(
    adapter: StorageAdapter,
    suite: BenchmarkSuite
): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const payload of suite.payloads) {
        const data = generatePayload(payload.size);
        const key = `bench_${payload.label}`;

        try {
            let { writeTime, readTime } = await runOnce(adapter, key, data);
            const totalTime = writeTime + readTime;

            let runs = 1;
            let targetRuns = 1;

            if (totalTime < 10) {
                targetRuns = 3;
            } else if (totalTime < 50) {
                targetRuns = 2;
            }

            while (runs < targetRuns) {
                await wait(50);
                const nextRun = await runOnce(adapter, key, data);
                writeTime += nextRun.writeTime;
                readTime += nextRun.readTime;
                runs++;
            }

            writeTime /= runs;
            readTime /= runs;

            const isSync = adapter.name === 'localStorage' || adapter.name === 'sessionStorage' || adapter.name === 'Cookies';
            const blockingTime = isSync ? (writeTime + readTime) : 0.5;

            results.push({
                adapterName: adapter.name,
                suiteName: suite.name,
                payloadSize: payload.label,
                writeTime,
                readTime,
                blockingTime
            });
        } catch (e: any) {
            results.push({
                adapterName: adapter.name,
                suiteName: suite.name,
                payloadSize: payload.label,
                writeTime: 0,
                readTime: 0,
                blockingTime: 0,
                error: e.message || "Quota exceeded or unknown error"
            });
        }
    }

    return results;
}

export async function purgeAll(adapters: StorageAdapter[]) {
    for (const adapter of adapters) {
        try {
            await adapter.clear();
        } catch (e) {
            console.error(`Failed to clear ${adapter.name}`, e);
        }
    }
}
