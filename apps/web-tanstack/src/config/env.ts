/**
 * Transitional env-var module per decisions.md (2026-05-21):
 * - Source of truth is Vite's `import.meta.env.VITE_*`.
 * - We re-export each as the legacy `NEXT_PUBLIC_*` name so the 99
 *   call-sites in apps/web/src that read `process.env.NEXT_PUBLIC_*` can
 *   migrate incrementally to `import { NEXT_PUBLIC_X } from '@/config/env'`.
 *
 * Add new vars here as the migration touches them.
 */
const env = import.meta.env

export const NEXT_PUBLIC_INFURA_TOKEN = env.VITE_INFURA_TOKEN ?? env.NEXT_PUBLIC_INFURA_TOKEN ?? ''
export const NEXT_PUBLIC_SAFE_GATEWAY_URL = env.VITE_SAFE_GATEWAY_URL ?? env.NEXT_PUBLIC_SAFE_GATEWAY_URL ?? ''
export const NEXT_PUBLIC_IS_PRODUCTION = (env.VITE_IS_PRODUCTION ?? env.NEXT_PUBLIC_IS_PRODUCTION ?? '') === 'true'
export const NEXT_PUBLIC_GTM_ID = env.VITE_GTM_ID ?? env.NEXT_PUBLIC_GTM_ID ?? ''
export const NEXT_PUBLIC_GTM_AUTH = env.VITE_GTM_AUTH ?? env.NEXT_PUBLIC_GTM_AUTH ?? ''
export const NEXT_PUBLIC_GTM_PREVIEW = env.VITE_GTM_PREVIEW ?? env.NEXT_PUBLIC_GTM_PREVIEW ?? ''

// Build-time constants injected via vite.config.ts `define:` — see plan.md
// (Env var strategy / build-time injected vars).
declare const __COMMIT_HASH__: string
declare const __APP_VERSION__: string
declare const __APP_HOMEPAGE__: string

export const NEXT_PUBLIC_COMMIT_HASH = __COMMIT_HASH__
export const NEXT_PUBLIC_APP_VERSION = __APP_VERSION__
export const NEXT_PUBLIC_APP_HOMEPAGE = __APP_HOMEPAGE__
