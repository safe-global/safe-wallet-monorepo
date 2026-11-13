import type { SpotlightRect } from '@safe-global/views/features/spaces/components/WorkspaceTour/types'

const VIEWPORT_PATH = 'M0,0 H100000 V100000 H0 Z'

const roundedRectPath = ({ top, left, width, height, radius }: SpotlightRect): string => {
  const r = Math.min(radius, width / 2, height / 2)
  const right = left + width
  const bottom = top + height
  return [
    `M${left + r},${top}`,
    `H${right - r} A${r},${r} 0 0 1 ${right},${top + r}`,
    `V${bottom - r} A${r},${r} 0 0 1 ${right - r},${bottom}`,
    `H${left + r} A${r},${r} 0 0 1 ${left},${bottom - r}`,
    `V${top + r} A${r},${r} 0 0 1 ${left + r},${top} Z`,
  ].join(' ')
}

export const spotlightClipPath = (holes: SpotlightRect[]): string =>
  `path(evenodd, "${[VIEWPORT_PATH, ...holes.map(roundedRectPath)].join(' ')}")`
