import { ChevronRight } from 'lucide-react'
import EthHashInfo from '@/components/common/EthHashInfo'
import ChainIndicator from '@/components/common/ChainIndicator'
import PaginatedDataTable, { type DataTableColumn, type RowActivation } from '@/components/common/PaginatedDataTable'
import PolicyRule from './components/PolicyRule'
import PolicyStatusChip from './components/PolicyStatusChip'
import PolicyTokens from './components/PolicyTokens'
import { getPolicyStatus, isProposerPolicy, type Policy } from '../types'

export type PoliciesTableProps = {
  policies: Policy[]
  onSelect?: (policy: Policy) => void
}

type PolicyRow = {
  /** The detail panel opens on this one. */
  policy: Policy
  chainIds: string[]
}

/** The same policy on the same address across chains is one row. */
const toRows = (policies: Policy[]): PolicyRow[] => {
  const rows = new Map<string, PolicyRow>()

  for (const policy of policies) {
    const proposer = isProposerPolicy(policy) ? policy.data.proposer : ''
    const key = `${policy.type}:${policy.safe.address.toLowerCase()}:${proposer.toLowerCase()}`
    const row = rows.get(key)

    if (row) row.chainIds.push(policy.safe.chainId)
    else rows.set(key, { policy, chainIds: [policy.safe.chainId] })
  }

  return [...rows.values()]
}

/**
 * One row per Safe and policy. A spending-limit policy holds every spender for its Safe, so a Safe
 * with five spenders is a single row and the spenders are listed in the detail panel.
 *
 * Revoked policies are not in the CGW response, so nothing here has to filter them out.
 */
const PoliciesTable = ({ policies, onSelect }: PoliciesTableProps) => {
  const columns: DataTableColumn<PolicyRow>[] = [
    {
      id: 'rule',
      header: 'RULE',
      width: '30%',
      sticky: true,
      minWidth: 240,
      cellTestId: 'policy-cell-rule',
      cell: ({ policy }) => <PolicyRule policy={policy} />,
    },
    {
      id: 'appliesTo',
      header: 'APPLIES TO',
      width: '30%',
      minWidth: 260,
      cellTestId: 'policy-cell-applies-to',
      cell: ({ policy }, { isCompact }) => (
        <EthHashInfo
          address={policy.safe.address}
          chainId={policy.safe.chainId}
          shortAddress={isCompact}
          showPrefix={false}
          highlight4bytes
          showCopyButton
          avatarSize={24}
        />
      ),
    },
    {
      id: 'network',
      header: 'NETWORK',
      width: '10%',
      minWidth: 120,
      priority: 'secondary',
      cellTestId: 'policy-cell-network',
      cell: ({ chainIds }) => (
        <div className="flex items-center -space-x-1" data-testid="policy-networks">
          {chainIds.map((chainId) => (
            <ChainIndicator key={chainId} chainId={chainId} onlyLogo showUnknown imageSize={24} />
          ))}
        </div>
      ),
    },
    {
      id: 'tokens',
      header: 'TOKENS',
      width: '10%',
      minWidth: 110,
      priority: 'secondary',
      cellTestId: 'policy-cell-tokens',
      cell: ({ policy }) => <PolicyTokens policy={policy} />,
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '15%',
      minWidth: 140,
      cellTestId: 'policy-cell-status',
      cell: ({ policy }) => <PolicyStatusChip status={getPolicyStatus(policy)} />,
    },
    {
      id: 'open',
      header: '',
      align: 'end',
      minWidth: 48,
      cell: () => <ChevronRight className="size-4 text-muted-foreground" aria-hidden />,
    },
  ]

  const rowActivation: RowActivation<PolicyRow> = onSelect
    ? {
        onRowClick: ({ policy }) => onSelect(policy),
        getRowAriaLabel: ({ policy }) => `Open ${policy.type} policy details`,
      }
    : {}

  return (
    <PaginatedDataTable
      columns={columns}
      rows={toRows(policies)}
      getRowKey={({ policy }) => policy.id}
      {...rowActivation}
    />
  )
}

export default PoliciesTable
