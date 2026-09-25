import { ChevronRight } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Button } from '@/components/ui/button'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import ChainIndicator from '@/components/common/ChainIndicator'
import PaginatedDataTable, { type DataTableColumn } from '@/components/common/PaginatedDataTable'
import PolicyRule from './components/PolicyRule'
import PolicyStatusChip from '../components/PolicyStatusChip'
import PolicyTokens from './components/PolicyTokens'
import { getPolicyLabel } from '../utils/policyLabel'
import { getPolicyStatus, isProposerPolicy, type Policy } from '../types'

export type PoliciesTableProps = {
  policies: Policy[]
  onSelect?: (policy: Policy) => void
}

/** Every row needs its own name: a screen reader lists them side by side. */
const getOpenPolicyLabel = (policy: Policy): string =>
  `Open ${getPolicyLabel(policy)} for ${shortenAddress(policy.safe.address)}`

/**
 * One row per Safe, chain and policy. A spending-limit policy holds every spender for its Safe, so
 * a Safe with five spenders is a single row and the spenders are listed in the detail panel.
 *
 * Revoked policies are not in the CGW response, so nothing here has to filter them out.
 */
const PoliciesTable = ({ policies, onSelect }: PoliciesTableProps) => {
  const resolveSafeName = useSafeNameResolver()

  const columns: DataTableColumn<Policy>[] = [
    {
      id: 'rule',
      header: 'RULE',
      width: '20%',
      sticky: true,
      minWidth: 240,
      cellTestId: 'policy-cell-rule',
      cell: (policy) => <PolicyRule policy={policy} />,
    },
    {
      id: 'appliesTo',
      header: 'APPLIES TO',
      width: '20%',
      minWidth: 200,
      cellTestId: 'policy-cell-applies-to',
      cell: (policy) => (
        <EthHashInfo
          address={policy.safe.address}
          chainId={policy.safe.chainId}
          name={resolveSafeName(policy.safe.address, policy.safe.chainId) || undefined}
          shortAddress
          showPrefix={false}
          highlight4bytes
          showCopyButton
          avatarSize={24}
        />
      ),
    },
    {
      id: 'proposerTokens',
      header: 'PROPOSER / TOKENS',
      width: '30%',
      minWidth: 200,
      cellTestId: 'policy-cell-proposer-tokens',
      cell: (policy) => {
        if (!isProposerPolicy(policy)) return <PolicyTokens policy={policy} />

        const [proposer] = policy.data.proposers
        if (!proposer) return null

        return (
          <EthHashInfo
            address={proposer.proposer}
            chainId={policy.safe.chainId}
            name={proposer.delegatedBy.find((grant) => grant.label)?.label}
            shortAddress
            showPrefix={false}
            highlight4bytes
            showCopyButton
            avatarSize={24}
          />
        )
      },
    },
    {
      id: 'network',
      header: 'NETWORK',
      width: '10%',
      minWidth: 120,
      align: 'center',
      priority: 'secondary',
      cellTestId: 'policy-cell-network',
      cell: (policy) => (
        <div className="flex justify-center">
          <ChainIndicator chainId={policy.safe.chainId} onlyLogo showUnknown imageSize={24} />
        </div>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '15%',
      minWidth: 140,
      cellTestId: 'policy-cell-status',
      cell: (policy) => <PolicyStatusChip status={getPolicyStatus(policy)} />,
    },
    {
      id: 'open',
      header: '',
      align: 'end',
      minWidth: 48,
      cell: (policy) =>
        onSelect ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={getOpenPolicyLabel(policy)}
            onClick={() => onSelect(policy)}
            data-testid="policy-open-button"
          >
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
          </Button>
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        ),
    },
  ]

  return (
    <PaginatedDataTable columns={columns} rows={policies} getRowKey={(policy) => policy.id} onRowClick={onSelect} />
  )
}

export default PoliciesTable
