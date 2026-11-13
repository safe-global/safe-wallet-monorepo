import { overlayVariants } from '@safe-global/views/components/ui/overlay'
import { toScrimPanels } from '@safe-global/views/features/spaces/components/WorkspaceTour/scrimPanels'
import type { SpotlightRect } from '@safe-global/views/features/spaces/components/WorkspaceTour/types'

export type TourSpotlightProps = {
  hole: SpotlightRect | null
  uncoveredLeft: number
  highlights: SpotlightRect[]
}

const TourSpotlight = ({ hole, uncoveredLeft, highlights }: TourSpotlightProps) => (
  <>
    {toScrimPanels(hole, uncoveredLeft).map((panel, index) => (
      <div
        key={index}
        data-testid="workspace-tour-scrim"
        className={overlayVariants({ transition: 'mount' })}
        style={panel}
      />
    ))}
    {highlights.map(({ top, left, width, height, radius }, index) => (
      <div
        key={index}
        data-testid="workspace-tour-highlight"
        className="pointer-events-none fixed z-[var(--z-overlay)] border-2 border-mint transition-all duration-300"
        style={{ top, left, width, height, borderRadius: radius }}
      />
    ))}
  </>
)

export default TourSpotlight
