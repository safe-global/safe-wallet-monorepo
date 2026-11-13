import type { ComponentProps } from 'react'
import { X } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Popover, PopoverContent } from '@safe-global/views/components/ui/popover'
import { Typography } from '@safe-global/views/components/ui/typography'
import TourIconTile from '@safe-global/views/features/spaces/components/WorkspaceTour/TourIconTile'
import type {
  TourInsideItem,
  TourPlacement,
  TourProgress,
  TourStepContent,
} from '@safe-global/views/features/spaces/components/WorkspaceTour/types'

const TourInsideList = ({ items }: { items: TourInsideItem[] }) => (
  <ul className="flex flex-col gap-2">
    {items.map(({ icon, label, description }) => (
      <li key={label} className="flex items-center gap-3">
        <TourIconTile icon={icon} />
        <div className="flex flex-col">
          <Typography variant="paragraph-small-medium">{label}</Typography>
          <Typography variant="paragraph-mini" color="muted">
            {description}
          </Typography>
        </div>
      </li>
    ))}
  </ul>
)

export type TourStepPopoverProps = {
  anchor: ComponentProps<typeof PopoverContent>['anchor']
  placement: TourPlacement
  content: TourStepContent
  progress: TourProgress
  onBack: () => void
  onNext: () => void
  onClose: () => void
}

const TourStepPopover = ({ anchor, placement, content, progress, onBack, onNext, onClose }: TourStepPopoverProps) => (
  <Popover open onOpenChange={onClose}>
    <PopoverContent
      anchor={anchor}
      side={placement.side}
      align={placement.align}
      sideOffset={12}
      className="w-80"
      data-testid="workspace-tour-step"
      aria-label={content.title}
    >
      <div className="flex items-start justify-between gap-2">
        <Typography variant="paragraph-bold">{content.title}</Typography>
        <Button variant="ghost" size="icon-xs" aria-label="Close tour" onClick={onClose}>
          <X />
        </Button>
      </div>
      <Typography variant="paragraph-small" color="muted">
        {content.body}
      </Typography>
      {content.inside && <TourInsideList items={content.inside} />}
      {content.tip && (
        <Typography variant="paragraph-mini" color="muted">
          {content.tip}
        </Typography>
      )}
      <div className="flex items-center justify-between gap-2">
        <Typography variant="paragraph-mini" color="muted">
          {progress.current} of {progress.total}
        </Typography>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            Back
          </Button>
          <Button size="sm" onClick={onNext}>
            Next
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
)

export default TourStepPopover
