import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import SafeProHero from '../SafeProHero'

/**
 * Hero, headline, one paragraph and one button: the notice a member sees when only an admin can act on the
 * Workspace. Without `onOpenChange` the notice cannot be dismissed (a locked Workspace).
 */
const SafeProNoticeModal = ({
  open,
  title,
  body,
  actionLabel = 'Back to My accounts',
  onAction,
  onOpenChange,
}: {
  open: boolean
  title: ReactNode
  body: string
  actionLabel?: string
  onAction: () => void
  onOpenChange?: (open: boolean) => void
}) => (
  <Dialog open={open} onOpenChange={onOpenChange ?? (() => undefined)}>
    <DialogContent size="sm" surface="card" padding="none" showCloseButton={Boolean(onOpenChange)}>
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

          <Button variant="secondary" size="lg" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

export default SafeProNoticeModal
