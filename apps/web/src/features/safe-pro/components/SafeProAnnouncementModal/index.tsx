import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import css from './styles.module.css'

const SafeProAnnouncementModal = ({
  open,
  onOpenChange,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="md" surface="card" padding="none">
      {/* 4px inset lives here rather than on DialogContent, which owns padding/radius via its props.
          The hero's top corners are the dialog's own radius less that inset. */}
      <div className="p-1">
        <div className="relative aspect-[1058/369] w-full overflow-hidden rounded-t-[calc(var(--radius-xl)-4px)]">
          <Image
            src="/images/safe-pro/pro-announcement-hero.jpg"
            alt="A Workspace on the Pro plan, with its accounts, members and transactions"
            fill
            className="object-cover"
          />
        </div>

        <div className="flex flex-col items-center gap-8 px-8 pt-9 pb-4">
          <div className="flex flex-col items-center gap-3">
            <DialogTitle render={<div />}>
              <Typography variant="h3" align="center">
                Your Workspace moves to <span className={css.highlight}>Pro</span> on Oct 1, 2026
              </Typography>
            </DialogTitle>

            <DialogDescription render={<div />}>
              <Typography variant="paragraph-large" color="muted" align="center" className="max-w-[590px]">
                Pro adds policies, advanced security checks and sponsored transactions. Your Safe accounts stay
                available outside the Workspace.
              </Typography>
            </DialogDescription>
          </div>

          <Button
            size="lg"
            render={<a href={SAFE_PRO_ANNOUNCEMENT_URL} target="_blank" rel="noopener noreferrer" />}
            className="shrink-0"
          >
            Learn more
            <ArrowUpRight data-icon="inline-end" className={css.ctaArrow} />
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

export default SafeProAnnouncementModal
