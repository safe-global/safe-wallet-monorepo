/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="react" />

// This file must stay a *script* (no top-level import/export) so the ambient
// module declarations below stay global; `React` comes from the global
// namespace (`export as namespace React`) rather than an import.

declare module 'remark-heading-id'

// @mdx-js/rollup compiles `*.md`/`*.mdx` imports to a React component (default
// export). Used by the terms/cookie/privacy pages.
declare module '*.md' {
  const MDXComponent: React.FC<Record<string, unknown>>
  export default MDXComponent
}
declare module '*.mdx' {
  const MDXComponent: React.FC<Record<string, unknown>>
  export default MDXComponent
}
