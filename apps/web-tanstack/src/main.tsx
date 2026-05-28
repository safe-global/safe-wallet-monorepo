// Node-global shims for libraries that assume Webpack/Next polyfills
// (most notably @web3-onboard/core and its wallet modules, which read
// Buffer and global at module load). Must run before any wallet code
// is imported — keep this at the very top of main.tsx.
import { Buffer } from 'buffer'
;(globalThis as any).Buffer = (globalThis as any).Buffer ?? Buffer
;(globalThis as any).global = (globalThis as any).global ?? globalThis

// Sync `require()` polyfill for the two reused files that need it
// (chains.json for store seeding, 'blo' for blockie avatars). Must run
// before the store is constructed.
import './compat/require-shim'

import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'

const container = document.getElementById('__next')
if (!container) throw new Error('Mount node #__next not found in index.html')

// Perf experiment: StrictMode disabled to test whether double-renders
// account for the ~4.8s long-task per navigation.
createRoot(container).render(<RouterProvider router={router} />)
