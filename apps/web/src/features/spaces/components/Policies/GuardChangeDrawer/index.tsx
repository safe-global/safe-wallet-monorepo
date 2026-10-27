import { useContext, type ReactElement } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { Drawer, DrawerBody } from '@/components/common/Drawer'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Typography } from '@safe-global/views/components/ui/typography'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { formatDateTime } from '@safe-global/utils/utils/date'
import { useIntervalCounter } from '@safe-global/utils/hooks/useIntervalCounter'
import { GuardSetupProgress } from '@safe-global/views/features/spaces/components/Policies/GuardSetupProgress'
import { getGuardSetupProgress } from '../utils/guardSetup'
import { getPolicyIcon } from '@safe-global/views/features/spaces/components/Policies/utils/policyIcon'
import {
  getPolicyDisplayType,
  getPolicyLabel,
} from '@safe-global/views/features/spaces/components/Policies/utils/policyLabel'
import type { PendingGuardChange } from '@safe-global/views/features/spaces/components/Policies/types'
import { PolicyDrawerActions } from '../components/PolicyDrawerActions'
import { PolicyDrawerHeader } from '../components/PolicyDrawerHeader'
import Section from '../GuardPolicyDrawer/DrawerSection'
import { useGuardSetupAction } from './useGuardSetupAction'

const CLOCK_TICK_MS = 30_000

const describeRules = (ruleCount: number | null): string =>
  ruleCount === null
    ? "The details of this change weren't saved, so only its progress can be shown."
    : `Sets ${ruleCount} guard rule${maybePlural(ruleCount)} on this Safe account.`

export type GuardChangeDrawerProps = {
  policy: PendingGuardChange
  onClose: () => void
}

/** The detail panel for a guard change that has not taken effect yet: where it is in its setup, and what is next. */
const GuardChangeDrawer = ({ policy, onClose }: GuardChangeDrawerProps): ReactElement => {
  // Re-renders the panel so the delay counts down between polls.
  useIntervalCounter(CLOCK_TICK_MS)
  const progress = getGuardSetupProgress(policy.setup)
  const action = useGuardSetupAction(policy, progress)
  const { txFlow } = useContext(TxModalContext)
  const { setup } = policy
  const label = getPolicyLabel(policy)

  // Hidden rather than unmounted while a flow is open, so cancelling lands back on the panel.
  return (
    <Drawer open={!txFlow} onClose={onClose} ariaLabel={label}>
      <PolicyDrawerHeader icon={getPolicyIcon(getPolicyDisplayType(policy))} title={label} status={progress.status} />
      <DrawerBody>
        <div className="flex flex-col gap-6" data-testid="guard-change-drawer">
          <Section label="Setup progress">
            <GuardSetupProgress steps={progress.steps} />
          </Section>

          <Section label="Safe account">
            <EthHashInfo address={policy.safe.address} chainId={policy.safe.chainId} shortAddress={false} hasExplorer />
          </Section>

          <Section label="Change">
            <Typography variant="paragraph-small">{describeRules(policy.data.ruleCount)}</Typography>
          </Section>

          {setup.flow === 'delayed' && setup.readyAt !== null && (
            <Section label="Can be applied from">
              <Typography variant="paragraph-small">{formatDateTime(setup.readyAt * 1000)}</Typography>
            </Section>
          )}

          {setup.flow === 'delayed' && setup.expiresAt !== null && (
            <Section label={progress.status === 'expired' ? 'Expired on' : 'Must be applied by'}>
              <Typography variant="paragraph-small">{formatDateTime(setup.expiresAt * 1000)}</Typography>
            </Section>
          )}
        </div>
      </DrawerBody>

      {action && <PolicyDrawerActions {...action} />}
    </Drawer>
  )
}

export default GuardChangeDrawer
