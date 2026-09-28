import { ArrowRight, Lock } from 'lucide-react'
import ExternalLink from '@/components/common/ExternalLink'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import type { PolicyLock } from '../policyLock'

type PolicyUpsellBannerProps = Pick<PolicyLock, 'planName' | 'workspaceName' | 'onUpgrade'>

/** Shown above the catalogue when the workspace's plan does not include policies. */
const PolicyUpsellBanner = ({ planName, workspaceName, onUpgrade }: PolicyUpsellBannerProps) => (
  <Card radius="xl" data-testid="policy-upsell-banner">
    <CardContent>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Badge variant="subtle" size="status" shape="status">
            <Lock aria-hidden />
            Business
          </Badge>

          <Typography variant="h4" className="font-bold">
            Set the rules once. They run on every Safe account.
          </Typography>

          <Typography variant="paragraph-small" className="text-muted-foreground">
            {workspaceName} is on {planName}. Upgrade to Business to set up policies.{' '}
            <ExternalLink
              noIcon
              className="font-normal text-muted-foreground underline"
              href={HelpCenterArticle.POLICIES}
            >
              Read more
            </ExternalLink>
          </Typography>
        </div>

        <Button onClick={onUpgrade} className="shrink-0 font-semibold">
          Upgrade to Business
          <ArrowRight aria-hidden className="text-[var(--color-static-text-brand)]" />
        </Button>
      </div>
    </CardContent>
  </Card>
)

export default PolicyUpsellBanner
