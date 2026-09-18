import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import SafeProHero from '../SafeProHero'

/** Blocking wait screen in the Safe Pro look: hero, spinner and a line about what is being confirmed. */
const SafeProPendingModal = ({ title, body }: { title: string; body: string }) => (
  <Dialog open onOpenChange={() => undefined}>
    <DialogContent size="sm" surface="card" padding="none" showCloseButton={false} className="outline-none">
      <div className="p-1 pb-2">
        <SafeProHero variant="tall" />

        <div className="flex flex-col items-center gap-4 px-8 pt-6 pb-4" data-testid="safe-pro-pending">
          <Spinner className="size-6" />
          <div className="flex flex-col gap-2">
            <Typography variant="h3" align="center" as={DialogTitle}>
              {title}
            </Typography>
            <Typography color="muted" align="center">
              {body}
            </Typography>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

export default SafeProPendingModal
