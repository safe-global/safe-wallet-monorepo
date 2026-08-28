import EthHashInfo from '@/components/common/EthHashInfo'
import { Typography } from '@/components/ui/typography'
import PolicyMetadataRow from './PolicyMetadataRow'
import { formatPolicyDateTime } from '../../utils/policyTime'
import { hasRecoveryData, isProposerPolicy, type Policy } from '../../types'

const SECONDS_PER_DAY = 86_400

const formatDays = (seconds: number) => {
  const days = Math.round(seconds / SECONDS_PER_DAY)
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

/**
 * What a recovery or proposer policy holds. Everything a policy contains is readable here, so that
 * checking what governs a Safe never requires opening the form that can change it.
 */
const PolicyTypeDetails = ({ policy }: { policy: Policy }) => {
  if (hasRecoveryData(policy)) {
    return (
      <section
        className="flex flex-col rounded-lg bg-card"
        aria-label="Recovery settings"
        data-testid="policy-recovery"
      >
        {policy.data.recoverers.map((recoverer, index) => (
          <PolicyMetadataRow
            key={recoverer}
            label={policy.data.recoverers.length > 1 ? `Recoverer ${index + 1}` : 'Recoverer'}
          >
            <EthHashInfo
              address={recoverer}
              chainId={policy.safe.chainId}
              shortAddress
              showPrefix={false}
              showCopyButton
              avatarSize={20}
            />
          </PolicyMetadataRow>
        ))}

        <PolicyMetadataRow label="Review window">
          <Typography variant="paragraph-small">{formatDays(policy.data.reviewWindowSeconds)}</Typography>
        </PolicyMetadataRow>

        <PolicyMetadataRow label="Proposal expiry">
          <Typography variant="paragraph-small">
            {policy.data.proposalExpirySeconds === 0 ? 'Never' : formatDays(policy.data.proposalExpirySeconds)}
          </Typography>
        </PolicyMetadataRow>

        {policy.data.pendingRecovery && (
          <PolicyMetadataRow label="Recovery in progress">
            <Typography variant="paragraph-small">
              {policy.data.pendingRecovery.isExecutable
                ? 'Executable now'
                : `Executable ${formatPolicyDateTime(policy.data.pendingRecovery.executableAt)}`}
            </Typography>
          </PolicyMetadataRow>
        )}
      </section>
    )
  }

  if (isProposerPolicy(policy)) {
    return (
      <section className="flex flex-col rounded-lg bg-card" aria-label="Proposer" data-testid="policy-proposer">
        <PolicyMetadataRow label="Proposer">
          <EthHashInfo
            address={policy.data.proposer}
            chainId={policy.safe.chainId}
            shortAddress
            showPrefix={false}
            showCopyButton
            avatarSize={20}
          />
        </PolicyMetadataRow>

        {/* The granting signer may since have been removed as an owner; the grant persists. */}
        <PolicyMetadataRow label="Granted by">
          <EthHashInfo
            address={policy.data.grantedBy}
            chainId={policy.safe.chainId}
            shortAddress
            showPrefix={false}
            showCopyButton
            avatarSize={20}
          />
        </PolicyMetadataRow>
      </section>
    )
  }

  return null
}

export default PolicyTypeDetails
