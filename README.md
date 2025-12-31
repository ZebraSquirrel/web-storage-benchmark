# Web Storage Benchmark

A comprehensive benchmarking tool for comparing the performance of modern web storage technologies and libraries.

<img width="1400" height="766" alt="image" src="https://github.com/user-attachments/assets/68c1fde1-68d0-4e87-9220-4f60c0e03d00" />

## Performance Overview

The following results represent a high-level performance baseline measured on a clinical environment.

### 💻 Test System Specifications
- **Hardware**: Macbook M4 Air (2025)
- **Engine**: Chrome v143.0.7499.170 (Official Build)
- **Environment**: Isolated Incognito Mode, No Extensions

### Low Payload (1 KB)
*Persist UI state*

| Storage | Write (ms) | Read (ms) |
| :--- | :--- | :--- |
| **sessionStorage** | 0.00 | 0.00 |
| **localStorage** | 0.03 | 0.00 |
| **store.js** | 0.07 | 0.00 |
| **Cookies** | 0.00 | 0.20 |
| **localForage** | 0.27 | 0.13 |
| **Dexie.js** | 0.60 | 0.13 |
| **IndexedDB** | 0.67 | 0.17 |
| **PouchDB** | 1.53 | 0.20 |
| **OPFS** | 1.63 | 0.63 |
| **Cache Storage** | 10.05 | 0.45 |

### Medium Payload (1 MB)
*Offline dataset*

| Storage | Write (ms) | Read (ms) |
| :--- | :--- | :--- |
| **localForage** | 0.60 | 0.90 |
| **IndexedDB** | 0.73 | 1.17 |
| **Dexie.js** | 0.97 | 1.03 |
| **localStorage** | 1.90 | 0.13 |
| **store.js** | 2.33 | 0.63 |
| **sessionStorage** | 3.70 | 0.20 |
| **Cookies** | 4.43 | 0.60 |
| **OPFS** | 4.13 | 1.43 |
| **Cache Storage** | 9.40 | 2.00 |
| **PouchDB** | 11.15 | 0.85 |

### High Payload (100 MB)
*Large dataset*

| Storage | Write (ms) | Read (ms) |
| :--- | :--- | :--- |
| **IndexedDB** | 28.00 | 51.70 |
| **localForage** | 33.20 | 48.80 |
| **Dexie.js** | 41.10 | 48.80 |
| **OPFS** | 104.00 | 48.10 |
| **Cache Storage** | 260.50 | 50.60 |
| **Cookies** | 354.90 | 46.50 |
| **PouchDB** | 457.20 | 48.60 |
| **localStorage** | ❌ | ❌ |
| **sessionStorage** | ❌ | ❌ |
| **store.js** | ❌ | ❌ |

## Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Styling**: Vanilla CSS
- **Visuals**: [Recharts](https://recharts.org/) & [Lucide-React](https://lucide.dev/)
- **Build**: [Vite](https://vitejs.dev/) 

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kundanbaliga/web-storage-benchamark.git
   cd web-storage-benchamark
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start development server**:
   ```bash
   pnpm dev
   ```

4. **Build for production**:
   ```bash
   pnpm build
   ```

## License
MIT License
