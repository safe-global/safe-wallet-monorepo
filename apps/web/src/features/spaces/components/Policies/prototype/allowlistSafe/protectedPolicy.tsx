import type { ReactElement } from 'react'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { ThresholdBadge } from '@safe-global/views/components/common/AccountBadges'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import PaginatedDataTable, { type DataTableColumn } from '@safe-global/views/components/common/PaginatedDataTable'
import PolicyRule from '@safe-global/views/features/spaces/components/Policies/PoliciesTable/components/PolicyRule'
import PolicyStatusChip from '@safe-global/views/features/spaces/components/Policies/components/PolicyStatusChip'
import { getPolicyLabel } from '@safe-global/views/features/spaces/components/Policies/utils/policyLabel'
import {
  getPolicyStatus,
  isProposerPolicy,
  type Policy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import ChainIndicator from '@/components/common/ChainIndicator'
import { Drawer, DrawerBody, DrawerList, DrawerSection } from '@/components/common/Drawer'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import PolicyTokens from '../../PoliciesTable/components/PolicyTokens'
import { PolicyDrawerHeader } from '../../components/PolicyDrawerHeader'
import { MOCK_SAFES } from '../../mocks/policies'
import { TOM_ADDRESS } from '../m2OverviewPage'
import { OPERATIONS, PAYMENTS, SafeAddress, TRADING_DESK, TREASURY, VAULT_3, TOOLTIP_OFFSET } from '../m2Prototype'
import { CONTACT_GROUPS, POPULAR_TOKENS } from '../m2SetupFlow'
import { KindValue, NetworkBadges, RecipientBadges, SignerBadges, TokenBadges, type Signer } from './allowlistSafeFlow'

/** A Protected Safe account set up earlier, as its Review step would have shown it. */
export const PROTECTED_SAFE = {
  id: 'protected-payments',
  account: PAYMENTS,
  signers: [
    { id: 0, name: 'Nadia Kaur', address: '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F' },
    { id: 1, name: 'Tom Reyes', address: TOM_ADDRESS },
  ] satisfies Signer[],
  threshold: 1,
  tokens: POPULAR_TOKENS.slice(0, 3),
  recipients: CONTACT_GROUPS[0]?.contacts.slice(0, 2) ?? [],
}

export type ProtectedSafe = typeof PROTECTED_SAFE
export type PolicyTableRow = Policy | ProtectedSafe

export const isProtectedSafe = (row: PolicyTableRow): row is ProtectedSafe => 'tokens' in row && 'recipients' in row

/** PolicyRule's markup with the Protected Safe account's icon and label. */
const ProtectedRule = ({ row }: { row: ProtectedSafe }): ReactElement => (
  <div className="flex items-center gap-3">
    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent">
      <ShieldCheck className="size-4 text-accent-success" aria-hidden />
    </div>
    <div className="flex min-w-0 flex-col">
      <Typography variant="paragraph-bold" className="whitespace-nowrap">
        Protected Safe account
      </Typography>
      <Typography variant="paragraph-small" className="truncate text-muted-foreground">
        {row.tokens.length} tokens · {row.recipients.length} recipients
      </Typography>
    </div>
  </div>
)

/** The prototype's named Safe accounts, for addresses the address book doesn't know. */
export const ACCOUNT_NAMES = new Map<string, string>([
  ...[PAYMENTS, TREASURY, TRADING_DESK, VAULT_3, OPERATIONS].map(({ address, name }): [string, string] => [
    address.toLowerCase(),
    name,
  ]),
  // The M1 mocks' treasury Safe, which backs the spending limit and proposer rows.
  [MOCK_SAFES.treasury.address.toLowerCase(), TREASURY.name],
])

const getRowSafe = (row: PolicyTableRow) => (isProtectedSafe(row) ? row.account : row.safe)

/** A copy of M1's PoliciesTable whose rows can also be a Protected Safe account. */
export const ProtectedPoliciesTable = ({
  rows,
  matchedSpenderNames,
  onSelect,
}: {
  rows: PolicyTableRow[]
  matchedSpenderNames?: Map<string, string>
  onSelect: (row: PolicyTableRow) => void
}): ReactElement => {
  const resolveSafeName = useSafeNameResolver()
  const nameFor = (address: string, chainId: string) =>
    resolveSafeName(address, chainId) || ACCOUNT_NAMES.get(address.toLowerCase())

  const columns: DataTableColumn<PolicyTableRow>[] = [
    {
      id: 'rule',
      header: 'RULE',
      width: 'fit',
      sticky: true,
      minWidth: 256,
      cell: (row) => (isProtectedSafe(row) ? <ProtectedRule row={row} /> : <PolicyRule policy={row} />),
    },
    {
      id: 'appliesTo',
      header: 'SAFE ACCOUNT',
      minWidth: 200,
      cell: (row) => {
        const safe = getRowSafe(row)
        return <SafeAddress name={nameFor(safe.address, safe.chainId)} address={safe.address} chainId={safe.chainId} />
      },
    },
    {
      id: 'proposerTokens',
      header: 'PROPOSER / TOKENS',
      minWidth: 200,
      cell: (row) => {
        if (isProtectedSafe(row)) return <TokenBadges tokens={row.tokens} />
        if (!isProposerPolicy(row)) {
          const matchedSpender = matchedSpenderNames?.get(row.id)
          return (
            <div className="flex min-w-0 flex-col gap-1">
              <PolicyTokens policy={row} />
              {matchedSpender && (
                <Typography variant="paragraph-small" className="truncate text-muted-foreground">
                  Spender: {matchedSpender}
                </Typography>
              )}
            </div>
          )
        }
        const [proposer] = row.data.proposers
        if (!proposer) return null
        return (
          <SafeAddress
            name={proposer.delegatedBy[0]?.label || nameFor(proposer.proposer, row.safe.chainId)}
            address={proposer.proposer}
            chainId={row.safe.chainId}
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
      cell: (row) => (
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <ChainIndicator chainId={getRowSafe(row).chainId} onlyLogo showUnknown imageSize={24} />
            </TooltipTrigger>
            <TooltipContent
              sideOffset={TOOLTIP_OFFSET}
              className="bg-popover text-popover-foreground ring-foreground/10 shadow-md ring-1 [&>[data-side]]:hidden"
            >
              <ChainIndicator chainId={getRowSafe(row).chainId} showUnknown />
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
      cell: (row) => <PolicyStatusChip status={isProtectedSafe(row) ? 'active' : getPolicyStatus(row)} />,
    },
    {
      id: 'open',
      header: '',
      align: 'end',
      width: 'fit',
      minWidth: 64,
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Open ${isProtectedSafe(row) ? 'Protected Safe account' : getPolicyLabel(row)} for ${shortenAddress(getRowSafe(row).address)}`}
          onClick={() => onSelect(row)}
        >
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </Button>
      ),
    },
  ]

  return (
    <PaginatedDataTable
      columns={columns}
      rows={rows}
      getRowKey={(row) => (isProtectedSafe(row) ? row.id : row.id)}
      onRowClick={onSelect}
    />
  )
}

/** The Proposer role panel's shell, with the Protected Safe account's Review content and its allowlist in one list. */
export const ProtectedSafeDrawer = ({ row, onClose }: { row: ProtectedSafe; onClose: () => void }): ReactElement => {
  const { account } = row

  return (
    <Drawer open onClose={onClose} ariaLabel="Protected Safe account">
      <PolicyDrawerHeader icon={ShieldCheck} title="Protected Safe account" status="active" />
      <DrawerBody>
        <DrawerSection title="Protected Safe account">
          <DrawerList
            items={[
              { label: 'Name', content: account.name },
              { label: 'Network', content: <NetworkBadges chainIds={[account.chainId]} /> },
              { label: 'Signers', content: <SignerBadges signers={row.signers} chainId={account.chainId} /> },
              {
                label: 'Threshold',
                content: <ThresholdBadge threshold={row.threshold} owners={row.signers.length} />,
              },
              { label: 'Type', content: <KindValue kind="restricted" /> },
              { label: 'Tokens', content: <TokenBadges tokens={row.tokens} /> },
              {
                label: 'Recipients',
                content: <RecipientBadges recipients={row.recipients} chainId={account.chainId} />,
              },
            ]}
          />
        </DrawerSection>
      </DrawerBody>
    </Drawer>
  )
}
