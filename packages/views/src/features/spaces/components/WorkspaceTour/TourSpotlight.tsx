import type { CSSProperties } from 'react'
import { overlayVariants } from '@safe-global/views/components/ui/overlay'
import { spotlightClipPath } from '@safe-global/views/features/spaces/components/WorkspaceTour/spotlightClipPath'
import type { SpotlightRect } from '@safe-global/views/features/spaces/components/WorkspaceTour/types'

const toBoxStyle = ({ top, left, width, height, radius }: SpotlightRect): CSSProperties => ({
  top,
  left,
  width,
  height,
  borderRadius: radius,
})

export type TourSpotlightProps = {
  holes: SpotlightRect[]
}

const TourSpotlight = ({ holes }: TourSpotlightProps) => (
  <>
    <div
      data-testid="workspace-tour-spotlight"
      className={overlayVariants({ transition: 'mount' })}
      style={{ clipPath: spotlightClipPath(holes) }}
    />
    {holes.map((hole) => (
      <div
        key={`${hole.top}:${hole.left}`}
        data-testid="workspace-tour-highlight"
        className="pointer-events-none fixed z-[var(--z-overlay)] border-2 border-mint transition-all duration-300"
        style={toBoxStyle(hole)}
      />
    ))}
  </>
)

export default TourSpotlight
