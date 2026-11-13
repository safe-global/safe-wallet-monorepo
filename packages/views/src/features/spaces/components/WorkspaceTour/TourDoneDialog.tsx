import { ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { Typography } from '@safe-global/views/components/ui/typography'
import TourIconTile from '@safe-global/views/features/spaces/components/WorkspaceTour/TourIconTile'
import type { TourNextAction } from '@safe-global/views/features/spaces/components/WorkspaceTour/types'

export type TourDoneDialogProps = {
  actions: TourNextAction[]
  onBack: () => void
  onFinish: () => void
}

const TourDoneDialog = ({ actions, onBack, onFinish }: TourDoneDialogProps) => (
  <Dialog open onOpenChange={onFinish}>
    <DialogContent size="xs" showCloseButton={false} data-testid="workspace-tour-done">
      <DialogHeader>
        <TourIconTile icon={Sparkles} />
        <DialogTitle>You are ready to go</DialogTitle>
        <DialogDescription>Good first steps for a new workspace:</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2 px-4">
        {actions.map(({ icon, label, description, onSelect }) => (
          <Button key={label} variant="outline" size="xl" className="w-full justify-start" onClick={onSelect}>
            <TourIconTile icon={icon} />
            <span className="flex flex-1 flex-col items-start">
              <Typography variant="paragraph-small-medium">{label}</Typography>
              <Typography variant="paragraph-mini" color="muted">
                {description}
              </Typography>
            </span>
            <ChevronRight aria-hidden />
          </Button>
        ))}
      </div>
      <DialogFooter className="flex-row justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <Button size="sm" onClick={onFinish}>
          Done
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export default TourDoneDialog
