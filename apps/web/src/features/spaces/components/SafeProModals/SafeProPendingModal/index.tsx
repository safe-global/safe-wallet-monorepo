import { DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import SafeProModalFrame from '../SafeProModalFrame'

/** Blocking wait screen in the Safe Pro look: hero, spinner and a line about what is being confirmed. */
const SafeProPendingModal = ({ title, body }: { title: string; body: string }) => (
  <SafeProModalFrame open className="outline-none">
    <div className="flex flex-col items-center gap-4" data-testid="safe-pro-pending">
      <Spinner className="size-6" />
      <div className="flex flex-col gap-3">
        <Typography variant="h4" as={DialogTitle}>
          {title}
        </Typography>
        <Typography variant="paragraph-small" color="muted">
          {body}
        </Typography>
      </div>
    </div>
  </SafeProModalFrame>
)

export default SafeProPendingModal
