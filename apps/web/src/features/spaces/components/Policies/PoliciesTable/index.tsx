import { ChevronRight } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useChains from '@/hooks/useChains'
import ChainIndicator from '@/components/common/ChainIndicator'
import PaginatedDataTable, { type DataTableColumn } from '@/components/common/PaginatedDataTable'
import PolicyRule from './components/PolicyRule'
import PolicyTokens from './components/PolicyTokens'
import PolicyStatusChip from '../components/PolicyStatusChip'
import { getPolicyLabel } from '../utils/policyLabel'
import { AppRoutes } from '@/config/routes'
import { buildSafeHref } from '@/features/spaces/utils/safeHref'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { getPolicyStatus, isProposerPolicy, type Policy } from '../types'

export type PoliciesTableProps = {
  policies: Policy[]
  /** Shown in the row because spenders are otherwise only in the detail panel. */
  matchedSpenderNames?: Map<string, string>
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
const PoliciesTable = ({ policies, matchedSpenderNames, onSelect }: PoliciesTableProps) => {
  const resolveSafeName = useSafeNameResolver()
  const { configs } = useChains()
  const spaceId = useUrlSpaceId()
  const getShortName = (chainId: string) => configs.find((chain) => chain.chainId === chainId)?.shortName

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
          name={resolveSafeName(policy.safe.address, policy.safe.chainId) || undefined}
          shortAddress
          showPrefix={false}
          highlight4bytes
          showCopyButton
          showAddressTooltip
          boldLabel
          avatarSize={24}
          href={buildSafeHref(
            AppRoutes.settings.setup,
            getShortName(policy.safe.chainId),
            policy.safe.address,
            spaceId,
          )}
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
          <ChainIndicator chainId={policy.safe.chainId} onlyLogo showUnknown imageSize={24} />
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

export default PoliciesTable
