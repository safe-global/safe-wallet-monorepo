import { ShieldCheck, Sparkles, UsersRound, WalletCards, type LucideIcon } from 'lucide-react'
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

const HIGHLIGHTS: { icon: LucideIcon; text: string }[] = [
  { icon: WalletCards, text: 'Every Safe and balance in one place' },
  { icon: UsersRound, text: 'Approve transactions as a team' },
  { icon: ShieldCheck, text: 'Set rules and check security' },
]

export type TourWelcomeDialogProps = {
  onStart: () => void
  onSkip: () => void
}

const TourWelcomeDialog = ({ onStart, onSkip }: TourWelcomeDialogProps) => (
  <Dialog open onOpenChange={onSkip}>
    <DialogContent size="xs" showCloseButton={false} data-testid="workspace-tour-welcome">
      <DialogHeader>
        <TourIconTile icon={Sparkles} />
        <DialogTitle>Welcome to your workspace</DialogTitle>
        <DialogDescription>
          Where your team runs its Safe accounts together. Here is a quick look around.
        </DialogDescription>
      </DialogHeader>
      <ul className="flex flex-col gap-3 px-4">
        {HIGHLIGHTS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <Typography variant="paragraph-small">{text}</Typography>
          </li>
        ))}
      </ul>
      <DialogFooter className="flex-row items-center justify-between">
        <Typography variant="paragraph-mini" color="muted">
          About 1 minute
        </Typography>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip for now
          </Button>
          <Button size="sm" onClick={onStart}>
            Show me around
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export default TourWelcomeDialog
