import NextLink from 'next/link'
import type { LinkProps } from 'next/link'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { formatDate } from '@safe-global/utils/utils/date'
import { TRIAL_DISCLAIMER } from '../../constants'
import SafeProHero from '../SafeProHero'
import css from '../SafeProAnnouncement/styles.module.css'

const SafeProTrialActivatedModal = ({
  open,
  onOpenChange,
  trialEndsAt,
  ctaHref,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trialEndsAt: number
  /** Where "Go to Workspace" leads; without it the CTA just closes. */
  ctaHref?: LinkProps['href']
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="sm" surface="card" padding="none">
      <div className="p-1 pb-2">
        <SafeProHero variant="tall" />

        <div className="flex flex-col items-center gap-8 px-8 pt-6 pb-4">
          <div className="flex flex-col gap-2">
            <Typography variant="h3" align="center" as={DialogTitle}>
              Your <span className={css.highlight}>Safe Pro</span> trial is active until {formatDate(trialEndsAt)}
            </Typography>
            <Typography color="muted" align="center">
              {TRIAL_DISCLAIMER}
            </Typography>
          </div>

          <Button
            size="lg"
            className="w-full"
            render={ctaHref ? <NextLink href={ctaHref} /> : undefined}
            onClick={() => onOpenChange(false)}
          >
            Go to Workspace
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

export default SafeProTrialActivatedModal
