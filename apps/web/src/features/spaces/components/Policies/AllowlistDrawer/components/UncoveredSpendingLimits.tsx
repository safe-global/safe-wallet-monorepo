import type { ReactElement } from 'react'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { DrawerSection } from '@/components/common/Drawer'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Card } from '@safe-global/views/components/ui/card'
import { Typography } from '@safe-global/views/components/ui/typography'
import { getPolicyIcon } from '@safe-global/views/features/spaces/components/Policies/utils/policyIcon'
import {
  NOT_COVERED_BADGE,
  NOT_COVERED_LINE,
} from '@safe-global/views/features/spaces/components/Policies/AllowlistDrawer/messages'

export type UncoveredSpendingLimitsProps = {
  count: number
}

const UncoveredSpendingLimits = ({ count }: UncoveredSpendingLimitsProps): ReactElement => {
  const Icon = getPolicyIcon('spending-limit')

  return (
    <DrawerSection title="Existing policies">
      <Card variant="muted" size="none" radius="lg" data-testid="allowlist-uncovered-spending-limits">
        <div className="flex flex-col gap-1 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
              <Icon className="size-4 text-muted-foreground" aria-hidden />
            </div>
            <Typography variant="paragraph-small-medium" className="min-w-0 flex-1 truncate">
              {count} spending limit{maybePlural(count)}
            </Typography>
            <Badge variant="warning" size="status" shape="status">
              {NOT_COVERED_BADGE}
            </Badge>
          </div>
          <Typography variant="paragraph-small" color="muted" className="pl-11">
            {NOT_COVERED_LINE}
          </Typography>
        </div>
      </Card>
    </DrawerSection>
  )
}

export default UncoveredSpendingLimits
