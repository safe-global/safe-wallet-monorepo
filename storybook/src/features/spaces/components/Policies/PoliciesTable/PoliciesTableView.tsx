import type { ReactElement } from 'react'
import { ChevronRight } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import EthHashInfo from '@/components/common/EthHashInfo'
import ChainIndicator from '@/components/common/ChainIndicator'
import PaginatedDataTable, { type DataTableColumn } from '@/components/common/PaginatedDataTable'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import PolicyRule from './components/PolicyRule'
import PolicyTokens from './components/PolicyTokens'
import PolicyStatusChip from '../components/PolicyStatusChip'
import { getPolicyLabel } from '../utils/policyLabel'
import type { SafeHref } from '@/features/spaces/utils/safeHref'
import { getPolicyStatus, isProposerPolicy, type Policy } from '../types'

export type PoliciesTableViewProps = {
  policies: Policy[]
  matchedSpenderNames?: Map<string, string>
  onSelect?: (policy: Policy) => void
  getSafeName: (policy: Policy) => string | undefined
  getSafeHref: (policy: Policy) => SafeHref | undefined
}

/** Every row needs its own name: a screen reader lists them side by side. */
const getOpenPolicyLabel = (policy: Policy): string =>
  `Open ${getPolicyLabel(policy)} for ${shortenAddress(policy.safe.address)}`

export const PoliciesTableView = ({
  policies,
  matchedSpenderNames,
  onSelect,
  getSafeName,
  getSafeHref,
}: PoliciesTableViewProps): ReactElement => {
  const columns: DataTableColumn<Policy>[] = [
    {
      id: 'rule',
      header: 'RULE',
      width: 'fit',
      sticky: true,
      minWidth: 256,
      cellTestId: 'policy-cell-rule',
      cell: (policy) => <PolicyRule policy={policy} />,
    },
    {
      id: 'appliesTo',
      header: 'SAFE ACCOUNT',
      minWidth: 200,
      cellTestId: 'policy-cell-applies-to',
      cell: (policy) => (
        <EthHashInfo
          address={policy.safe.address}
          chainId={policy.safe.chainId}
          name={getSafeName(policy)}
          shortAddress
          showPrefix={false}
          highlight4bytes
          showCopyButton
          showAddressTooltip
          boldLabel
          avatarSize={24}
          href={getSafeHref(policy)}
        />
      ),
    },
    {
      id: 'proposerTokens',
      header: 'PROPOSER / TOKENS',
      minWidth: 200,
      cellTestId: 'policy-cell-proposer-tokens',
      cell: (policy) => {
        if (!isProposerPolicy(policy)) {
          const matchedSpender = matchedSpenderNames?.get(policy.id)

          return (
            <div className="flex min-w-0 flex-col gap-1">
              <PolicyTokens policy={policy} />
              {matchedSpender && (
                <Typography
                  variant="paragraph-small"
                  className="truncate text-muted-foreground"
                  data-testid="policy-matched-spender"
                >
                  Spender: {matchedSpender}
                </Typography>
              )}
            </div>
          )
        }

        const [proposer] = policy.data.proposers
        if (!proposer) return null

        return (
          <EthHashInfo
            address={proposer.proposer}
            chainId={policy.safe.chainId}
            shortAddress
            showPrefix={false}
            highlight4bytes
            showCopyButton
            showAddressTooltip
            boldLabel
            avatarSize={24}
          />
        )
      },
    },
    {
      id: 'network',
      header: 'NETWORK',
      width: 'fit',
      minWidth: 96,
      align: 'center',
      priority: 'secondary',
      cellTestId: 'policy-cell-network',
      cell: (policy) => (
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <ChainIndicator chainId={policy.safe.chainId} onlyLogo showUnknown imageSize={24} />
            </TooltipTrigger>
            <TooltipContent className="bg-popover text-popover-foreground ring-foreground/10 shadow-md ring-1 [&>[data-side]]:hidden">
              <span data-testid="policy-network-tooltip">
                <ChainIndicator chainId={policy.safe.chainId} showUnknown />
              </span>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: 'fit',
      minWidth: 140,
      cellTestId: 'policy-cell-status',
      cell: (policy) => <PolicyStatusChip status={getPolicyStatus(policy)} />,
    },
    {
      id: 'open',
      header: '',
      align: 'end',
      width: 'fit',
      minWidth: 64,
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
