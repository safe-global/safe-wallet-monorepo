import type { ComponentType, SVGProps } from 'react'

/**
 * A React component produced by SVGR from an `import Icon from './x.svg'`.
 *
 * Use this instead of `ComponentType<SVGProps<SVGSVGElement>>` for props that receive an imported
 * SVG. It matches SVGR's real signature: extra `title`/`titleId` plus an index signature for the
 * arbitrary props these components spread onto the underlying `<svg>`.
 */
export type SvgrComponent = ComponentType<
  SVGProps<SVGSVGElement> & { title?: string; titleId?: string; [key: string]: unknown }
>
