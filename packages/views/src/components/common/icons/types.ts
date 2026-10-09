import type { ComponentType, SVGProps } from 'react'

/**
 * A React component produced by SVGR from an `import Icon from './x.svg'`.
 *
 * Use this instead of `ComponentType<SVGProps<SVGSVGElement>>` for props that receive an imported
 * SVG. This source tree is compiled by two projects with different `*.svg` declarations:
 * `apps/web/src/definitions.d.ts` types the default export as `any`, while
 * `apps/web-tanstack/src/svg.d.ts` uses SVGR's real signature — extra `title`/`titleId` plus an
 * index signature for the arbitrary props these components spread onto the underlying `<svg>`.
 * A component with that index signature is not assignable to `ComponentType<SVGProps<…>>`, so the
 * narrower annotation type-checks in `apps/web` and fails in `apps/web-tanstack`. Matching SVGR's
 * shape here satisfies both.
 */
export type SvgrComponent = ComponentType<
  SVGProps<SVGSVGElement> & { title?: string; titleId?: string; [key: string]: unknown }
>
