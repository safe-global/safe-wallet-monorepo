/// <reference types="react" />

// vite-plugin-svgr is configured (include: '**/*.svg') so a bare
// `import Icon from './x.svg'` resolves to a React component, not a URL string.
// vite/client declares `*.svg` as a string; for merged ambient wildcard
// modules the conflicting default export resolves to the first-processed file,
// so this declaration must be processed before vite/client is referenced.
// It lives in its own file named to sort before `vite-env.d.ts` (which holds
// the `/// <reference types="vite/client" />`). If this ever stops winning,
// `tsc` fails loudly with hundreds of svg errors — it cannot fail silently.
//
// This file must stay a *script* (no top-level import/export): ambient
// wildcard module declarations only win the merge from script files, hence the
// global `React` namespace (via `export as namespace React`) instead of an
// import. The index signature mirrors @svgr/webpack's permissive runtime:
// these components spread arbitrary props onto the underlying <svg>, and
// reused web code passes extras (alt, width, sx, fontSize, ...).
declare module '*.svg' {
  const ReactComponent: React.FC<
    React.SVGProps<SVGSVGElement> & { title?: string; titleId?: string; [key: string]: unknown }
  >
  export default ReactComponent
}
