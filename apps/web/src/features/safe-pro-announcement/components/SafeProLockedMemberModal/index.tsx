import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import SafeProHero from '../SafeProHero'

/** A non-admin cannot unlock the Workspace; the modal only explains the lock and leads back to My accounts. */
const SafeProLockedMemberModal = ({
  open,
  title,
  body,
  onBack,
}: {
  open: boolean
  title: ReactNode
  body: string
  onBack: () => void
}) => (
  <Dialog open={open} onOpenChange={() => undefined}>
    <DialogContent size="sm" surface="card" padding="none" showCloseButton={false}>
      <div className="p-1 pb-2">
        <SafeProHero variant="tall" />

        <div className="flex flex-col items-center gap-6 px-8 pt-6 pb-4">
          <div className="flex flex-col gap-2">
            <Typography variant="h3" align="center" as={DialogTitle}>
              {title}
            </Typography>
            <Typography color="muted" align="center">
              {body}
            </Typography>
          </div>

          <Button variant="secondary" size="lg" onClick={onBack}>
            Back to My accounts
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

export default SafeProLockedMemberModal
