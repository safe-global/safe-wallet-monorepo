import { Lock } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'

export type LockdownBannerProps = {
  isCopied: boolean
  onCopyLink: () => void
}

export const LockdownBanner = ({ isCopied, onCopyLink }: LockdownBannerProps) => (
  <div
    role="status"
    data-testid="lockdown-banner"
    className="fixed bottom-4 left-4 z-50 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-3 rounded-lg bg-foreground px-4 py-2 text-background shadow-lg"
  >
    <Lock aria-hidden="true" className="size-4" />
    <Typography variant="paragraph-small">
      Encrypted Workspace: names are encrypted in this browser and tracking is off.
    </Typography>
    <Button size="sm" variant="secondary" onClick={onCopyLink}>
      {isCopied ? 'Link copied' : 'Copy Workspace link'}
    </Button>
  </div>
)
