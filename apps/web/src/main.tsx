/**
 * Vite SPA entry point — replaces Next.js _app.tsx / _document.tsx bootstrapping.
 *
 * Note: StrictMode is intentionally omitted to match Next.js config (reactStrictMode: false).
 */
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

import '@/styles/globals.css'
import '@/styles/shadcn.css'

import { router } from './routes'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <HelmetProvider>
    <RouterProvider router={router} />
  </HelmetProvider>,
)
