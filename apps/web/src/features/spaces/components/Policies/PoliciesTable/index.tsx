import { ChevronRight } from 'lucide-react'
import EthHashInfo from '@/components/common/EthHashInfo'
import ChainIndicator from '@/components/common/ChainIndicator'
import PaginatedDataTable, { type DataTableColumn } from '../../PaginatedDataTable'
import PolicyRule from './components/PolicyRule'
import PolicyStatusChip from './components/PolicyStatusChip'
import PolicyTokens from './components/PolicyTokens'
import { getPolicyStatus, type Policy } from '../types'

export type PoliciesTableProps = {
  policies: Policy[]
  onSelect?: (policy: Policy) => void
}

/**
 * One row per Safe and policy. A spending-limit policy holds every spender for its Safe, so a Safe
 * with five spenders is a single row and the spenders are listed in the detail panel.
 *
 * Revoked policies are not in the CGW response, so nothing here has to filter them out.
 */
const PoliciesTable = ({ policies, onSelect }: PoliciesTableProps) => {
  const columns: DataTableColumn<Policy>[] = [
    {
      id: 'rule',
      header: 'RULE',
      width: '30%',
      sticky: true,
      minWidth: 240,
      cellTestId: 'policy-cell-rule',
      cell: (policy) => <PolicyRule policy={policy} />,
    },
    {
      id: 'appliesTo',
      header: 'APPLIES TO',
      width: '30%',
      minWidth: 260,
      cellTestId: 'policy-cell-applies-to',
      // A policy belongs to one Safe on one chain, so this is a single address. The design shows
      // several stacked avatars here; that is open as Q55 in the acceptance criteria.
      cell: (policy, { isCompact }) => (
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
      cell: (policy) => <ChainIndicator chainId={policy.safe.chainId} onlyLogo showUnknown imageSize={24} />,
    },
    {
      id: 'tokens',
      header: 'TOKENS',
      width: '10%',
      minWidth: 110,
      priority: 'secondary',
      cellTestId: 'policy-cell-tokens',
      cell: (policy) => <PolicyTokens policy={policy} />,
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
      cell: () => <ChevronRight className="size-4 text-muted-foreground" aria-hidden />,
    },
  ]

  return (
    <PaginatedDataTable
      columns={columns}
      rows={policies}
      getRowKey={(policy) => policy.id}
      onRowClick={onSelect}
      getRowAriaLabel={(policy) => `Open ${policy.type} policy details`}
    />
  )
}

export default PoliciesTable
