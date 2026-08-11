// The feature's public entry point for the always-loaded override hooks.
//
// `useChains` imports from here, which puts this barrel on the static import path of ~300 files,
// including the sidebar that ships on every route. It must therefore never re-export anything from
// `components/` — that would pull the whole dev-only editor UI into the production bundle. The
// editor is reachable ONLY through the guarded dynamic import in `FeatureFlagEditorDialogLoader`.
// `__tests__/importGraph.test.ts` enforces this.
export { useChainsWithOverrides } from './hooks/useChainOverrides'
