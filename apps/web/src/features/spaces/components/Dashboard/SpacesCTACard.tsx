import css from './styles.module.css'
import LightbulbIcon from '@/public/images/common/lightbulb.svg'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import SpaceInfoModal from '../SpaceInfoModal'
import { useState } from 'react'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'

const SpacesCTACard = () => {
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false)

  const handleLearnMore = () => {
    trackEvent({ ...SPACE_EVENTS.INFO_MODAL, label: SPACE_LABELS.space_dashboard_card })
    setIsInfoOpen(true)
  }

  return (
    <>
      <div className="h-full rounded-3xl bg-card p-6">
        <div className="relative w-full">
          <div className={css.iconBG}>
            <LightbulbIcon />
          </div>

          <Button
            onClick={handleLearnMore}
            variant="outline"
            size="lg"
            className="absolute right-0 top-0"
            aria-label="Invite team members"
          >
            Learn more
          </Button>
        </div>
        <div>
          <Typography variant="paragraph-bold" className="mb-2 text-foreground">
            Explore spaces
          </Typography>
          <Typography variant="paragraph-small" color="muted">
            Seamlessly use your Safe Accounts from one place and collaborate with your team members.
          </Typography>
        </div>
      </div>
      {isInfoOpen && <SpaceInfoModal onClose={() => setIsInfoOpen(false)} />}
    </>
  )
}

export default SpacesCTACard
