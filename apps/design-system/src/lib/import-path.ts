import type { Layer } from './types.ts'

/** The canonical package subpath of a component: `@safe-global/ui/primitives/<name>` or `@safe-global/ui/components/<name>` */
export const importPath = (component: string, layer: Layer): string =>
  `@safe-global/ui/${layer === 'primitive' ? 'primitives' : 'components'}/${component}`
