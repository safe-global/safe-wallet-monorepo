import type { ReactElement } from 'react'
import { DrawerList, DrawerSection, type DrawerListItem } from '@/components/common/Drawer'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'
import type { AllowlistScheduledChange } from '@safe-global/views/features/spaces/components/Policies/types'
import { formatTimeUntil, formatUtcDateTime } from '@safe-global/utils/utils/date'
import {
  APPLY_END_LABEL,
  APPLY_READY_LABEL,
  APPLY_SECTION_TITLE,
  REQUESTED_LABEL,
  SAFE_ACCOUNT_LABEL,
  applyBannerLine,
  applyBannerTitle,
  timeLeftLabel,
  type ApplyBannerDetails,
  type ApplyStage,
} from '@safe-global/views/features/spaces/components/Policies/AllowlistDrawer/messages'
import { AccountIdentity } from '../../components/AccountIdentity'

export type ApplyStatusProps = {
  stage: ApplyStage
  change: AllowlistScheduledChange
  safe: { address: string; name?: string }
  signatures?: ApplyBannerDetails['signatures']
  nowMs: number
}

/** What happens to an executed request until its second transaction applies it, and the dates that govern it. */
const ApplyStatus = ({ stage, change, safe, signatures, nowMs }: ApplyStatusProps): ReactElement => {
  const { operation, appliesAt, expiresAt, requestedAt } = change
  const readyAt = formatUtcDateTime(appliesAt)
  const endAt = expiresAt === undefined ? undefined : formatUtcDateTime(expiresAt)
  const timeLeftUntil = stage === 'waiting' ? appliesAt : stage === 'ready' ? expiresAt : undefined
  const variant = stage === 'expired' ? 'destructive' : 'warning'

  const items: DrawerListItem[] = [
    ...(requestedAt === undefined ? [] : [{ label: REQUESTED_LABEL, content: formatUtcDateTime(requestedAt) }]),
    { label: APPLY_READY_LABEL[stage], content: readyAt },
    ...(endAt === undefined ? [] : [{ label: APPLY_END_LABEL[stage], content: endAt }]),
    { label: SAFE_ACCOUNT_LABEL, content: <AccountIdentity {...safe} showCopyButton /> },
  ]

  return (
    <>
      <Alert variant={variant} outlined={false}>
        <AlertSeverityIcon variant={variant} />
        <AlertTitle>{applyBannerTitle(stage, operation, formatTimeUntil(appliesAt, nowMs))}</AlertTitle>
        <AlertDescription>{applyBannerLine(stage, operation, { readyAt, endAt, signatures })}</AlertDescription>
      </Alert>

      <DrawerSection
        title={APPLY_SECTION_TITLE[stage]}
        rightNode={timeLeftUntil === undefined ? undefined : timeLeftLabel(timeLeftUntil, nowMs)}
      >
        <DrawerList items={items} />
      </DrawerSection>
    </>
  )
}

export default ApplyStatus
