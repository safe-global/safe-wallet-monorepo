import { useEffect, useState, type ReactElement } from 'react'
import { ShieldCheck } from 'lucide-react'
import ChainIndicator from '@/components/common/ChainIndicator'
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerList,
  DrawerSection,
  DrawerTitle,
} from '@/components/common/Drawer'
import Identicon from '@/components/common/Identicon'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge, BadgeDot } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { PolicyDrawerActions } from '../components/PolicyDrawerActions'
import { asActivePolicy, MOCK_VIEWERS, mockSpendingLimitPolicy } from '../mocks/policies'
import { SpendingLimitDrawer } from '../SpendingLimitDrawer'
import AllowanceRow from '../SpendingLimitDrawer/components/SpendingLimits/AllowanceRow'
import { formatSignedCount } from '../SpendingLimitDrawer/format'
import type { PolicyAllowance, PolicySpender, PolicyTokenInfo } from '../types'
import { Card } from '@/components/ui/card'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { M2Alert } from './m2Alert'
import {
  PAYMENTS,
  SafeAddress,
  ShowDetails,
  SIGNING_TIME_LEFT,
  TRADING_DESK,
  WaitingForSigners,
  type M2Account,
} from './m2Prototype'

/** M1's PendingSignatures, with the address as SafeAddress so it gets the prototype's address tooltip. */
const PendingSignatures = ({
  safe,
  signed,
  required,
}: {
  safe: { address: string; name?: string; chainId: string; owners: number }
  signed: number
  required: number
}): ReactElement => (
  <DrawerSection title="Pending signatures" rightNode={formatSignedCount(signed, required)}>
    <DrawerList
      items={[
        { label: 'Time to sign', content: SIGNING_TIME_LEFT },
        {
          label: 'Safe account',
          content: <SafeAddress name={safe.name} address={safe.address} chainId={safe.chainId} />,
        },
        {
          label: 'Waiting for',
          content: <WaitingForSigners signed={signed} required={required} owners={safe.owners} />,
        },
      ]}
    />
  </DrawerSection>
)

/** M1's SpenderCard, with the spender as SafeAddress so it gets the prototype's address tooltip. */
const SpenderCard = ({
  spender,
  label,
  name,
  showUsage,
}: {
  spender: PolicySpender
  label: string
  name?: string
  showUsage: boolean
}): ReactElement => (
  <Card
    variant="muted"
    size="none"
    radius="lg"
    data-testid="spending-limit-spender"
    data-m2-new="M1 copy · Spender card"
    data-m2-new-corner="end"
  >
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between gap-2">
        <Typography variant="paragraph-small-medium">{label}</Typography>
        <SafeAddress name={name} address={spender.spender} chainId={PAYMENTS.chainId} />
      </div>

      <div className="flex flex-col gap-3">
        {spender.allowances.map((allowance) => (
          <AllowanceRow key={allowance.token.address} allowance={allowance} showUsage={showUsage} />
        ))}
      </div>
    </div>
  </Card>
)

const SETUP_COVERAGE = [
  'We check the account is ready',
  'Your usual recipients are added for you',
  'Everything else is blocked',
]

const CHANGE_DELAY_SECONDS = 23 * 60 * 60

export type AccountState = 'not-set-up' | 'waiting' | 'ready' | 'executing' | 'execution-failed' | 'enforcing'
export type AccountDialog = 'reject'

export type StatusPill = { label: string; variant: 'success' | 'warning' | 'subtle' | 'destructive' }

/** M2 enforcement only: an account without the M2 guard is "Not protected", whether or not it has M1 policies. */
export const getStatusPill = (state: AccountState, pendingChange: boolean): StatusPill => {
  switch (state) {
    case 'not-set-up':
      return { label: 'Not protected', variant: 'subtle' }
    // A setup that is signed but not yet executed is a pending change, whether it still needs signatures or not.
    case 'waiting':
    case 'ready':
      return { label: 'Change pending', variant: 'warning' }
    case 'execution-failed':
      return { label: 'Ready to execute', variant: 'warning' }
    case 'executing':
      return { label: 'Executing', variant: 'warning' }
    case 'enforcing':
      return pendingChange ? { label: 'Change pending', variant: 'warning' } : { label: 'Active', variant: 'success' }
  }
}

// The neutral chip is `subtle`: `secondary` matched the row hover fill and vanished on hover.
export const StatusChip = ({ pill }: { pill: StatusPill }): ReactElement => (
  <Badge variant={pill.variant} size="status" shape="status">
    <BadgeDot />
    {pill.label}
  </Badge>
)

const OPS_BOT = '0x0b7a9c4e1d2f3a5b6c7d8e9f0a1b2c3d4e5f6a7b'
const DAY_MINUTES = 1_440

const usdcAllowance = mockSpendingLimitPolicy().data.spenders[0].allowances[0]

/** The Ops bot's M1 spending limit on Payments, built from M1's own mocks so M1's drawer can show it. */
export const PAYMENTS_SPENDING_LIMIT = asActivePolicy(
  mockSpendingLimitPolicy({
    id: '0xspending-limit-payments',
    safe: { address: PAYMENTS.address, chainId: PAYMENTS.chainId },
    data: {
      spenders: [
        {
          spender: OPS_BOT,
          allowances: [
            {
              ...usdcAllowance,
              amount: '500000000',
              spent: '120000000',
              remaining: '380000000',
              resetPeriodMinutes: DAY_MINUTES,
            },
          ],
        },
      ],
    },
  }),
)

export const SPENDING_LIMIT_NAMES = { [OPS_BOT]: 'Ops bot' }
export const SPENDING_LIMIT_OVERVIEW = { lastUpdated: 'Jun 4, 2026 · 09:12 UTC', enforcedBy: 'Safe allowance module' }

/** One spender's M1 spending limit on an account, with what M1's drawer needs to show it. */
export type SpendingLimitMock = {
  id: string
  account: M2Account
  spenderName: string
  /** The token the limit sends, by symbol. */
  token: string
  /** The table's summary line, e.g. "Ops bot · 500 USDC per day". */
  label: string
  policy: typeof PAYMENTS_SPENDING_LIMIT
  names: Record<string, string>
  overview: typeof SPENDING_LIMIT_OVERVIEW
}

export const PAYMENTS_LIMIT: SpendingLimitMock = {
  id: 'payments-spending-limit',
  account: PAYMENTS,
  spenderName: 'Ops bot',
  token: 'USDC',
  label: 'Ops bot · 500 USDC per day',
  policy: PAYMENTS_SPENDING_LIMIT,
  names: SPENDING_LIMIT_NAMES,
  overview: SPENDING_LIMIT_OVERVIEW,
}

const MARKET_MAKER_BOT = '0x6e1a9c3b5d7f2a4c6e8b0d2f4a6c8e0b2d4f6a31'
const REBALANCER = '0x2b8d4f6a0c2e4b6d8f0a2c4e6b8d0f2a4c6e7c59'

// M1's mocks hold no native token, so ETH is built here, with the zero address the allowance module uses for it.
const ETH_TOKEN: PolicyTokenInfo = {
  address: ZERO_ADDRESS,
  symbol: 'ETH',
  decimals: 18,
  logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
}

const tradingDeskLimit = ({
  id,
  spender,
  spenderName,
  allowance,
  label,
  lastUpdated,
}: Pick<SpendingLimitMock, 'id' | 'spenderName' | 'label'> & {
  spender: string
  allowance: PolicyAllowance
  lastUpdated: string
}): SpendingLimitMock => ({
  id,
  account: TRADING_DESK,
  spenderName,
  token: allowance.token.symbol,
  label,
  policy: asActivePolicy(
    mockSpendingLimitPolicy({
      id: `0x${id}`,
      safe: { address: TRADING_DESK.address, chainId: TRADING_DESK.chainId },
      data: { spenders: [{ spender, allowances: [allowance] }] },
    }),
  ),
  names: { [spender]: spenderName },
  overview: { ...SPENDING_LIMIT_OVERVIEW, lastUpdated },
})

/** Trading desk's two M1 limits, next to its live allowlist: one sends USDC, which the allowlist leaves out. */
export const TRADING_DESK_SPENDING_LIMITS: SpendingLimitMock[] = [
  tradingDeskLimit({
    id: 'trading-spending-limit-market-maker',
    spender: MARKET_MAKER_BOT,
    spenderName: 'Market maker bot',
    label: 'Market maker bot · 250 USDC per day',
    lastUpdated: 'Aug 12, 2026 · 15:40 UTC',
    allowance: {
      ...usdcAllowance,
      amount: '250000000',
      spent: '90000000',
      remaining: '160000000',
      resetPeriodMinutes: DAY_MINUTES,
    },
  }),
  tradingDeskLimit({
    id: 'trading-spending-limit-rebalancer',
    spender: REBALANCER,
    spenderName: 'Rebalancer',
    label: 'Rebalancer · 2 ETH per week',
    lastUpdated: 'Aug 19, 2026 · 10:05 UTC',
    allowance: {
      ...usdcAllowance,
      token: ETH_TOKEN,
      amount: '2000000000000000000',
      spent: '500000000000000000',
      remaining: '1500000000000000000',
      resetPeriodMinutes: DAY_MINUTES * 7,
    },
  }),
]

const ActiveM1Policies = ({ onOpen }: { onOpen: () => void }): ReactElement => (
  <DrawerSection
    title="Active policies"
    rightNode={
      <Button variant="ghost-muted" size="xs" onClick={onOpen}>
        View details
      </Button>
    }
  >
    <div className="flex flex-col gap-3">
      {PAYMENTS_SPENDING_LIMIT.data.spenders.map((spender) => (
        <SpenderCard
          key={spender.spender}
          spender={spender}
          label="Spending limit"
          name={SPENDING_LIMIT_NAMES[OPS_BOT]}
          showUsage={false}
        />
      ))}
      <DrawerList
        items={[
          { label: 'Last updated', content: SPENDING_LIMIT_OVERVIEW.lastUpdated },
          {
            label: 'Enforced by',
            content: (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="size-3.5" />
                {SPENDING_LIMIT_OVERVIEW.enforcedBy}
              </span>
            ),
          },
        ]}
      />
    </div>
  </DrawerSection>
)

const formatCountdown = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return `Applies in ${hours}h ${String(minutes).padStart(2, '0')}m ${String(rest).padStart(2, '0')}s`
}

const ChangeCountdown = (): ReactElement => {
  const [secondsLeft, setSecondsLeft] = useState(CHANGE_DELAY_SECONDS)

  useEffect(() => {
    const interval = setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => clearInterval(interval)
  }, [])

  return <>{formatCountdown(secondsLeft)}</>
}

const MutedLine = ({ children }: { children: string }): ReactElement => (
  <Typography variant="paragraph-small" color="muted">
    {children}
  </Typography>
)

export type ActiveDetails = {
  recipientCount: number
}

const DEFAULT_ACTIVE_DETAILS: ActiveDetails = { recipientCount: 4 }

export type AccountPanelProps = {
  open: boolean
  account?: M2Account
  state: AccountState
  signedCount?: number
  pendingChange?: boolean
  /** The account already has M1's Ops bot spending limit, shown above the M2 setup. */
  hasSpendingLimit?: boolean
  /** What the executed setup turned on; the Active panel lists it. */
  activeDetails?: ActiveDetails
  dialog?: AccountDialog
  onClose?: () => void
  onSetUp?: () => void
  onReview?: () => void
  onReject?: () => void
  onOpenExecute?: () => void
  onRetryExecute?: () => void
  onCreateRejection?: () => void
  onCloseDialog?: () => void
  onCancelChange?: () => void
}

const PANEL_MARK = 'New · Account side panel'

const SetupCoverageList = (): ReactElement => (
  <ol className="flex flex-col gap-3 rounded-lg bg-muted p-3">
    {SETUP_COVERAGE.map((item, index) => (
      <li key={item} className="flex items-center gap-3">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-card">
          <Typography variant="paragraph-mini-medium">{index + 1}</Typography>
        </div>
        <Typography variant="paragraph-small-medium">{item}</Typography>
      </li>
    ))}
  </ol>
)

const SETUP_DESCRIPTION =
  'Policies check every transaction before it goes through and block anything you haven’t allowed.'

const PanelBody = ({
  account,
  state,
  signedCount,
  pendingChange,
  hasSpendingLimit,
  activeDetails,
  onCancelChange,
  onOpenSpendingLimit,
}: Required<
  Pick<AccountPanelProps, 'account' | 'state' | 'signedCount' | 'pendingChange' | 'hasSpendingLimit' | 'activeDetails'>
> &
  Pick<AccountPanelProps, 'onCancelChange'> & { onOpenSpendingLimit: () => void }): ReactElement => {
  switch (state) {
    case 'not-set-up':
      return hasSpendingLimit ? (
        <div className="flex flex-col gap-4" data-m2-new={PANEL_MARK}>
          <ActiveM1Policies onOpen={onOpenSpendingLimit} />

          <DrawerSection title="Add protection">
            <div className="flex flex-col gap-3">
              <MutedLine>{SETUP_DESCRIPTION}</MutedLine>
              <SetupCoverageList />
            </div>
          </DrawerSection>
        </div>
      ) : (
        <div className="flex flex-col gap-4" data-m2-new={PANEL_MARK}>
          <MutedLine>{SETUP_DESCRIPTION}</MutedLine>

          <DrawerSection title="What setup covers">
            <SetupCoverageList />
          </DrawerSection>
        </div>
      )

    case 'waiting':
      return (
        <div className="flex flex-col gap-4" data-m2-new={PANEL_MARK}>
          <PendingSignatures
            safe={{ address: account.address, name: account.name, chainId: account.chainId, owners: account.owners }}
            signed={signedCount}
            required={account.threshold}
          />
          <MutedLine>Nothing changes on this account until it’s executed.</MutedLine>
        </div>
      )

    case 'ready':
    case 'executing':
      return (
        <div className="flex flex-col gap-4" data-m2-new={PANEL_MARK}>
          <PendingSignatures
            safe={{ address: account.address, name: account.name, chainId: account.chainId, owners: account.owners }}
            signed={signedCount}
            required={account.threshold}
          />
          <M2Alert tone="success" title="All signatures are in. Anyone on the team can execute it." />

          {state === 'executing' && (
            <div className="flex items-center gap-2">
              <Spinner />
              <Typography variant="paragraph-small-medium">Executing…</Typography>
            </div>
          )}
        </div>
      )

    case 'execution-failed':
      return <M2Alert tone="error" title="Execution failed. Nothing changed on this account." />

    case 'enforcing':
      return (
        <div className="flex flex-col gap-4" data-m2-new={PANEL_MARK}>
          {pendingChange && (
            <DrawerSection title="Pending change" rightNode={<ChangeCountdown />}>
              <DrawerList
                items={[
                  {
                    label: '1 change',
                    content: (
                      <Button variant="outline" size="sm" onClick={onCancelChange}>
                        Cancel change
                      </Button>
                    ),
                  },
                ]}
              />
            </DrawerSection>
          )}

          {hasSpendingLimit && <ActiveM1Policies onOpen={onOpenSpendingLimit} />}

          <DrawerSection title="Policy overview">
            <DrawerList
              items={[
                { label: 'Allowed recipients', content: String(activeDetails.recipientCount) },
                { label: 'When nothing matches', content: 'Blocked' },
                {
                  label: 'Enforced by',
                  content: (
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="size-3.5" />
                      Safe guard
                    </span>
                  ),
                },
              ]}
            />
            <ShowDetails>
              <DrawerList items={[{ label: 'Module transactions', content: 'Checked' }]} />
            </ShowDetails>
          </DrawerSection>

          <M2Alert tone="info" title="Changes take 24 hours to apply. Any signer can cancel them." />
        </div>
      )
  }
}

const PanelActions = ({
  account,
  state,
  onSetUp,
  onReview,
  onReject,
  onOpenExecute,
  onRetryExecute,
}: { account: M2Account } & Pick<
  AccountPanelProps,
  'state' | 'onSetUp' | 'onReview' | 'onReject' | 'onOpenExecute' | 'onRetryExecute'
>): ReactElement => {
  switch (state) {
    case 'not-set-up':
      return (
        <PolicyDrawerActions
          actionLabel="Set up policies"
          onClick={onSetUp}
          hint={`One transaction, signed by ${account.threshold} of ${account.owners}.`}
        />
      )
    case 'waiting':
      return (
        <DrawerFooter>
          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={onReview}>
              Review transaction
            </Button>
            <Button variant="ghost-destructive" className="w-full" onClick={onReject}>
              Reject
            </Button>
          </div>
        </DrawerFooter>
      )
    case 'ready':
      return <PolicyDrawerActions actionLabel="Execute" onClick={onOpenExecute} />
    case 'executing':
      return <PolicyDrawerActions actionLabel="Execute" disabled />
    case 'execution-failed':
      return <PolicyDrawerActions actionLabel="Try again" onClick={onRetryExecute} />
    case 'enforcing':
      return <PolicyDrawerActions actionLabel="Add policy" />
  }
}

const RejectDialog = ({
  account,
  onCreateRejection,
  onCloseDialog,
}: { account: M2Account } & Pick<AccountPanelProps, 'onCreateRejection' | 'onCloseDialog'>): ReactElement => (
  <AlertDialog open onOpenChange={(open) => !open && onCloseDialog?.()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Reject this transaction?</AlertDialogTitle>
        <AlertDialogDescription>
          Rejecting cancels this setup. It needs {account.threshold} of {account.owners} signatures.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel>Keep it queued</AlertDialogCancel>
        <AlertDialogAction variant="destructive" onClick={onCreateRejection}>
          Create rejection
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

/** An account's policy state, in M1's policy drawer: header, sectioned body and the action at the bottom. */
export const AccountPanel = ({
  open,
  account = PAYMENTS,
  state,
  signedCount = 1,
  pendingChange = false,
  hasSpendingLimit = false,
  activeDetails = DEFAULT_ACTIVE_DETAILS,
  dialog,
  onClose = () => {},
  onSetUp,
  onReview,
  onReject,
  onOpenExecute,
  onRetryExecute,
  onCreateRejection,
  onCloseDialog,
  onCancelChange,
}: AccountPanelProps): ReactElement => {
  const [isSpendingLimitOpen, setIsSpendingLimitOpen] = useState(false)
  const pill = getStatusPill(state, pendingChange)

  return (
    <>
      <Drawer open={open && !isSpendingLimitOpen} onClose={onClose} ariaLabel={`${account.name} policies`}>
        <DrawerHeader>
          <Identicon address={account.address} size={40} />
          <DrawerTitle size="lg">{account.name}</DrawerTitle>
          <ChainIndicator chainId={account.chainId} onlyLogo />
          <div className="ml-auto">
            <StatusChip pill={pill} />
          </div>
        </DrawerHeader>

        <DrawerBody>
          <PanelBody
            account={account}
            state={state}
            signedCount={signedCount}
            pendingChange={pendingChange}
            hasSpendingLimit={hasSpendingLimit}
            activeDetails={activeDetails}
            onCancelChange={onCancelChange}
            onOpenSpendingLimit={() => setIsSpendingLimitOpen(true)}
          />
        </DrawerBody>

        <PanelActions
          account={account}
          state={state}
          onSetUp={onSetUp}
          onReview={onReview}
          onReject={onReject}
          onOpenExecute={onOpenExecute}
          onRetryExecute={onRetryExecute}
        />
      </Drawer>

      {hasSpendingLimit && (
        <SpendingLimitDrawer
          open={open && isSpendingLimitOpen}
          onClose={() => setIsSpendingLimitOpen(false)}
          policy={PAYMENTS_SPENDING_LIMIT}
          viewer={MOCK_VIEWERS.signer}
          safe={{ address: account.address, name: account.name }}
          overview={SPENDING_LIMIT_OVERVIEW}
          names={SPENDING_LIMIT_NAMES}
          onConnectWallet={() => {}}
        />
      )}

      {open && dialog === 'reject' && (
        <RejectDialog account={account} onCreateRejection={onCreateRejection} onCloseDialog={onCloseDialog} />
      )}
    </>
  )
}
