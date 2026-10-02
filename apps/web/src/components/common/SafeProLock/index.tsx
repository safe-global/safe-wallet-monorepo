import { useEffect } from 'react'
import NextLink, { type LinkProps } from 'next/link'
import { Lock } from 'lucide-react'
import { highlightSafePro } from '@/components/common/ProHighlight'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import {
  MixpanelEventParams,
  PlanSelectionEntryPoint,
  UpgradeLocation,
  type UpgradeFeature,
} from '@/services/analytics'
import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { trackPlanSelectionStarted } from '@/features/spaces'

/** Safe Pro upsell replacing an add-policy action (proposer, spending limit) when `usePlanGate` requires an upgrade. */
const SafeProLock = ({ title, href, feature }: { title: string; href: LinkProps['href']; feature: UpgradeFeature }) => {
  const prompt = {
    [MixpanelEventParams.FEATURE]: feature,
    [MixpanelEventParams.LOCATION]: UpgradeLocation.SETTINGS_SETUP,
  }
  useEffect(() => {
    trackEvent(SAFE_PRO_EVENTS.UPGRADE_PROMPT_VIEWED, prompt)
  }, [feature]) // eslint-disable-line react-hooks/exhaustive-deps -- prompt is derived from feature

  return (
    <Alert variant="subtle" data-testid="safe-pro-lock">
      <Lock />
      <AlertTitle>
        <Typography variant="paragraph-bold">{highlightSafePro(title)}</Typography>
      </AlertTitle>
      <AlertDescription>
        <Typography>Existing ones stay active.</Typography>
        <Button
          size="action"
          render={<NextLink href={href} />}
          onClick={() =>
            trackPlanSelectionStarted({
              [MixpanelEventParams.ENTRY_POINT]: PlanSelectionEntryPoint.UPGRADE_PROMPT,
              ...prompt,
            })
          }
        >
          Explore Safe Pro
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export default SafeProLock
