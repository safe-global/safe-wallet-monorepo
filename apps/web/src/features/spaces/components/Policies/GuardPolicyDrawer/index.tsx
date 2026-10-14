import type { ReactElement, ReactNode } from 'react'
import { Drawer, DrawerBody } from '@/components/common/Drawer'
import EthHashInfo from '@/components/common/EthHashInfo'
import TokenIcon from '@/components/common/TokenIcon'
import { Typography } from '@safe-global/views/components/ui/typography'
import { getPolicyIcon } from '@safe-global/views/features/spaces/components/Policies/utils/policyIcon'
import { getPolicyLabel } from '@safe-global/views/features/spaces/components/Policies/utils/policyLabel'
import { getPolicyStatus } from '@safe-global/views/features/spaces/components/Policies/types'
import type { GuardPolicy } from '@safe-global/views/features/spaces/components/Policies/types'
import { PolicyDrawerHeader } from '../components/PolicyDrawerHeader'

const Section = ({ label, children }: { label: string; children: ReactNode }): ReactElement => (
  <div className="flex flex-col gap-2">
    <Typography variant="paragraph-mini" color="muted">
      {label}
    </Typography>
    {children}
  </div>
)

const AllowlistBody = ({ policy }: { policy: Extract<GuardPolicy, { type: 'token-allowlist' }> }): ReactElement => (
  <>
    <Section label="Token">
      <span className="flex items-center gap-2" data-testid="allowlist-token">
        <TokenIcon logoUri={policy.data.token.logoUri ?? undefined} tokenSymbol={policy.data.token.symbol} size={24} />
        <EthHashInfo
          address={policy.data.token.address}
          chainId={policy.safe.chainId}
          shortAddress={false}
          hasExplorer
        />
      </span>
    </Section>

    <Section label={`Allowed recipients (${policy.data.recipients.length})`}>
      <div className="flex flex-col gap-3" data-testid="allowlist-recipients">
        {policy.data.recipients.length === 0 ? (
          <Typography variant="paragraph-small" color="muted">
            No recipients allowed — transfers of this token are blocked.
          </Typography>
        ) : (
          policy.data.recipients.map((recipient) => (
            <div key={recipient.address} className="flex items-center justify-between gap-3">
              <EthHashInfo address={recipient.address} chainId={policy.safe.chainId} shortAddress={false} hasExplorer />
              {recipient.permission === 'ONCE' && (
                <Typography variant="paragraph-mini" color="muted">
                  Once
                </Typography>
              )}
            </div>
          ))
        )}
      </div>
    </Section>
  </>
)

const SafeManagementBody = ({
  policy,
}: {
  policy: Extract<GuardPolicy, { type: 'safe-management' }>
}): ReactElement => {
  const { changes, total } = policy.data

  return (
    <Section label={`Allowed changes (${changes.length} of ${total})`}>
      <div className="flex flex-col gap-2" data-testid="safe-management-changes">
        {changes.map((change) => (
          <Typography key={change.selector} variant="paragraph-small">
            {change.label ?? change.selector}
          </Typography>
        ))}

        {changes.length < total && (
          <Typography variant="paragraph-mini" color="muted" className="mt-2">
            Any change not listed follows this Safe&apos;s fallback policy.
          </Typography>
        )}
      </div>
    </Section>
  )
}

const MultiSendBody = (): ReactElement => (
  <Section label="What it does">
    <Typography variant="paragraph-small">
      Every call inside a batch faces the same policies it would have faced on its own.
    </Typography>
  </Section>
)

/** The detail panel for a guard-enforced policy: the Safe it applies to, then what it permits. */
const GuardPolicyDrawer = ({ policy, onClose }: { policy: GuardPolicy; onClose: () => void }): ReactElement => (
  <Drawer open onClose={onClose} ariaLabel={getPolicyLabel(policy)}>
    <PolicyDrawerHeader
      icon={getPolicyIcon(policy.type)}
      title={getPolicyLabel(policy)}
      status={getPolicyStatus(policy)}
    />
    <DrawerBody>
      <div className="flex flex-col gap-6">
        <Section label="Safe account">
          <EthHashInfo address={policy.safe.address} chainId={policy.safe.chainId} shortAddress={false} hasExplorer />
        </Section>

        {policy.type === 'token-allowlist' && <AllowlistBody policy={policy} />}
        {policy.type === 'safe-management' && <SafeManagementBody policy={policy} />}
        {policy.type === 'multisend' && <MultiSendBody />}
      </div>
    </DrawerBody>
  </Drawer>
)

export default GuardPolicyDrawer
