import type { ReactElement, ReactNode } from 'react'
import {
  ArrowRightLeft,
  ArrowUpRight,
  CircleX,
  FileCode2,
  Layers,
  Network,
  Repeat2,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { DrawerSection } from '@/components/common/Drawer'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Typography } from '@safe-global/views/components/ui/typography'
import { ADDRESS_BOOK, OPERATIONS, SafeAddress, TREASURY, type M2Account } from '../../m2Prototype'
import { PanelExpandableCard, PanelExpandableSection, PanelRow, PanelSection } from '../PanelBody'
import type { SignatureRow } from '../SignaturesFooter'
import type { PanelType, PanelVariant } from '../VariantPanel'
import { Muted, NADIA, PRIYA, TOM, created, needed, signed } from './shared'

const PROPOSED = 'Oct 18, 2026 · 16:40'
const RECIPIENT = ADDRESS_BOOK[1]

/** The queue panel's transaction summary; `to` is the counterparty row, which depends on the type. */
const Summary = ({ account, to, nonce = 42 }: { account: M2Account; to?: [string, ReactNode]; nonce?: number }) => (
  <PanelSection title="Transaction summary">
    <PanelRow label="Safe account" account>
      <SafeAddress name={account.name} address={account.address} chainId={account.chainId} />
    </PanelRow>
    {to && (
      <PanelRow label={to[0]} account>
        {to[1]}
      </PanelRow>
    )}
    <PanelRow label="Nonce">#{nonce}</PanelRow>
    <PanelRow label="Proposed">{PROPOSED}</PanelRow>
  </PanelSection>
)

const Details = ({ rows }: { rows: [string, ReactNode][] }): ReactElement => (
  <PanelSection title="Details">
    {rows.map(([label, value]) => (
      <PanelRow key={label} label={label}>
        {value}
      </PanelRow>
    ))}
  </PanelSection>
)

const ADVANCED = [
  {
    label: 'Transaction data',
    value:
      '0xa9059cbb0000000000000000000000009cd45e6f708192a3b4c5d6e7f8091a2b3c4d9013000000000000000000000000000000000000000000000000000000004a817c80',
  },
  // Built from a repeated chunk so it can't be mistaken for a real hash or a private key.
  { label: 'Safe transaction hash', value: `0x${'3f7c2a91'.repeat(8)}` },
]

const Advanced = (): ReactElement => (
  <DrawerSection title="Advanced">
    <div className="flex flex-col gap-2">
      {ADVANCED.map(({ label, value }) => (
        <PanelExpandableCard
          key={label}
          detailsLabel={label.toLowerCase()}
          summary={
            <Typography variant="paragraph-small-medium" className="min-w-0 flex-1">
              {label}
            </Typography>
          }
          items={[
            <p key="value" className="break-all font-mono text-xs text-muted-foreground">
              {value}
            </p>,
          ]}
        />
      ))}
    </div>
  </DrawerSection>
)

const NoteSection = ({ text, author }: { text: string; author: string }): ReactElement => (
  <PanelSection title="Note">
    <span className="flex flex-col gap-1">
      <Typography variant="paragraph-small">{text}</Typography>
      <Typography variant="paragraph-mini" color="muted">
        {author} · {PROPOSED} · Off-chain, not verified
      </Typography>
    </span>
  </PanelSection>
)

const SEND_DETAILS: [string, ReactNode][] = [
  ['Recipient', RECIPIENT.name],
  ['Token', 'USDC'],
]

const SendBody = ({ extra, note }: { extra?: ReactNode; note?: boolean }): ReactElement => (
  <>
    <Summary
      account={OPERATIONS}
      to={[
        'To',
        <SafeAddress key="to" name={RECIPIENT.name} address={RECIPIENT.address} chainId={OPERATIONS.chainId} />,
      ]}
    />
    {note && <NoteSection text="Monthly payout to the exchange desk." author={NADIA.firstName} />}
    <Details rows={SEND_DETAILS} />
    {extra}
    <Advanced />
  </>
)

/** Rows for the queue's signer states; Tom is "you" and the threshold is 2 unless stated. */
const ROWS = {
  yourTurn: [created(NADIA, PROPOSED), signed(NADIA, PROPOSED), needed(TOM)],
  othersTurn: [created(TOM, PROPOSED), signed(TOM, PROPOSED), needed(PRIYA)],
  ready: [created(NADIA, PROPOSED), signed(NADIA, PROPOSED), signed(TOM, 'Oct 19, 2026 · 09:05')],
  proposer: [created(PRIYA, PROPOSED), needed(TOM)],
} satisfies Record<string, SignatureRow[]>

const REPLACE = { label: 'Replace or cancel', variant: 'outline' } as const

const yourTurn = {
  signed: 1,
  required: 2,
  rows: ROWS.yourTurn,
  actions: { primary: { label: 'Review and sign' }, secondary: REPLACE },
}

type TypeMedia = { icon: LucideIcon; title: string; subtitle: string }

const queue = (media: TypeMedia, rest: Omit<PanelVariant, 'media' | 'longTitle'>): PanelVariant => ({
  media: { kind: 'icon', ...media },
  longTitle: 'Contract interaction with Uniswap Universal Router',
  ...rest,
})

const SEND = { icon: ArrowUpRight, title: 'Send', subtitle: '1,250 USDC' }

const earlier = (
  <PanelExpandableSection
    title="Earlier transactions"
    detailsLabel="earlier transactions"
    summary={
      <Typography variant="paragraph-small-medium" className="min-w-0 flex-1">
        1 transaction must execute first
      </Typography>
    }
    items={[
      <span key="nonce-41" className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="flex flex-col">
          <Typography variant="paragraph-small-medium">Nonce #41 · Send 500 USDC</Typography>
          <Typography variant="paragraph-mini" color="muted">
            To Payroll provider
          </Typography>
        </span>
        <Badge variant="secondary" size="status" shape="status">
          1/2
        </Badge>
      </span>,
    ]}
  />
)

const competing = (
  <PanelSection title="Competing proposals" rightNode="2">
    <Muted>These proposals use the same nonce. Executing one makes the others invalid.</Muted>
    <PanelRow label="Swap 1,000 USDC → ETH">
      <Badge variant="secondary" size="status" shape="status">
        0.31 ETH
      </Badge>
    </PanelRow>
    <PanelRow label="On-chain rejection">
      <Badge variant="secondary" size="status" shape="status">
        Gas only
      </Badge>
    </PanelRow>
  </PanelSection>
)

const STATES: PanelVariant[] = [
  queue(SEND, {
    id: 'queue-ready-to-sign',
    group: 'States',
    label: 'Ready to sign',
    note: 'Needs 2 more signatures, including yours. It can execute once the threshold is reached.',
    body: <SendBody note />,
    signatures: {
      signed: 1,
      required: 3,
      rows: [created(NADIA, PROPOSED), signed(NADIA, PROPOSED), needed(TOM), needed(PRIYA)],
      actions: { primary: { label: 'Review and sign' }, secondary: REPLACE },
    },
  }),
  queue(SEND, {
    id: 'queue-final-signature',
    group: 'States',
    label: 'Final signature',
    note: 'Yours is the last signature needed. You can sign and execute in one step.',
    body: <SendBody />,
    signatures: {
      signed: 1,
      required: 2,
      rows: ROWS.yourTurn,
      actions: { primary: { label: 'Review, sign and execute' }, secondary: REPLACE },
    },
  }),
  queue(SEND, {
    id: 'queue-ready-to-execute',
    group: 'States',
    label: 'Ready to execute',
    note: 'All signatures are in and #42 is next, so it can execute now.',
    body: <SendBody />,
    signatures: {
      signed: 2,
      required: 2,
      rows: ROWS.ready,
      actions: { primary: { label: 'Review and execute' }, secondary: REPLACE },
    },
  }),
  queue(SEND, {
    id: 'queue-blocked-can-sign',
    group: 'States',
    label: 'Blocked · you can still sign',
    note: 'Blocked by #41. Earlier transactions must execute first. You can still sign now.',
    body: <SendBody extra={earlier} />,
    signatures: yourTurn,
  }),
  queue(SEND, {
    id: 'queue-blocked',
    group: 'States',
    label: 'Blocked · nothing to do',
    note: 'Blocked by #41. Earlier transactions must execute first.',
    body: <SendBody extra={earlier} />,
    signatures: {
      signed: 2,
      required: 2,
      rows: ROWS.ready,
      actions: { primary: { label: 'Blocked by #41', disabled: true }, secondary: REPLACE },
    },
  }),
  queue(SEND, {
    id: 'queue-waiting',
    group: 'States',
    label: 'Waiting on others',
    note: 'Needs 1 more signature from other signers before it can execute.',
    body: <SendBody />,
    signatures: {
      signed: 1,
      required: 2,
      rows: ROWS.othersTurn,
      actions: { primary: { label: 'Waiting on others', disabled: true }, secondary: REPLACE },
    },
  }),
  queue(SEND, {
    id: 'queue-competing',
    group: 'States',
    label: 'Competing proposals',
    note: '3 proposals use nonce #42. Executing this one cancels the 2 others.',
    body: <SendBody extra={competing} />,
    signatures: {
      signed: 2,
      required: 2,
      rows: ROWS.ready,
      actions: { primary: { label: 'Review and execute' }, secondary: REPLACE },
    },
  }),
  queue(SEND, {
    id: 'queue-proposer',
    group: 'States',
    label: 'Created by a proposer',
    note: 'This transaction was created by a proposer. Review it, then confirm or reject it.',
    body: <SendBody />,
    signatures: {
      signed: 0,
      required: 2,
      rows: ROWS.proposer,
      actions: { primary: { label: 'Review and sign' }, secondary: REPLACE },
    },
  }),
]

const typeVariant = (
  media: TypeMedia,
  rest: Omit<PanelVariant, 'media' | 'longTitle' | 'group' | 'signatures' | 'body'> & {
    details: [string, ReactNode][]
    to?: [string, ReactNode]
  },
): PanelVariant => {
  const { details, to, ...variant } = rest
  return queue(media, {
    group: 'Transaction types',
    ...variant,
    body: (
      <>
        <Summary account={TREASURY} to={to} />
        <Details rows={details} />
        <Advanced />
      </>
    ),
    signatures: yourTurn,
  })
}

const TYPES: PanelVariant[] = [
  typeVariant(
    { icon: Repeat2, title: 'Swap', subtitle: '1,000 USDC → 0.31 ETH · Limit' },
    {
      id: 'queue-swap-expired',
      label: 'Swap · order expired',
      banner: {
        tone: 'warning',
        title: 'Order expired',
        description: 'This order can’t fill anymore. Reject it to free up the nonce.',
      },
      details: [
        ['Order', 'Limit sell order'],
        ['Limit price', '1 ETH = 3,226 USDC'],
        ['Expiry', 'Oct 18, 2026 · 18:00'],
        ['Status', 'Expired'],
      ],
    },
  ),
  typeVariant(
    { icon: ArrowRightLeft, title: 'Bridge', subtitle: '5,000 USDC → Unknown network' },
    {
      id: 'queue-bridge-unknown',
      label: 'Bridge · unknown network',
      banner: {
        tone: 'warning',
        title: 'Unknown network',
        description:
          'We don’t support the destination chain, so we can’t show where the funds arrive. Check the chain ID.',
      },
      to: ['To', 'Unknown network'],
      details: [
        ['From', 'Ethereum'],
        ['To', 'Unknown network · chain 9999'],
        ['Recipient', 'This Safe account'],
        ['Fees', '4.20 USDC'],
        ['Via', 'Across'],
      ],
    },
  ),
  typeVariant(
    { icon: Layers, title: 'Batch', subtitle: '14 actions · 52,000 USDC' },
    {
      id: 'queue-batch-delegate',
      label: 'Batch · unexpected delegate call',
      banner: {
        tone: 'warning',
        title: 'Unexpected delegate call',
        description:
          'This batch runs another contract’s code with full control of this Safe. Only sign if you trust that contract.',
      },
      to: ['Contract', 'MultiSendCallOnly'],
      details: [
        [
          'Operation',
          <Badge key="op" variant="warning" size="status" shape="status">
            Unexpected delegate call
          </Badge>,
        ],
        ['Call', 'multiSend on MultiSendCallOnly'],
        ['Total value', '52,000 USDC'],
        ['All actions', '14'],
      ],
    },
  ),
  typeVariant(
    { icon: FileCode2, title: 'Contract', subtitle: 'approve · Uniswap Router' },
    {
      id: 'queue-contract-unverified',
      label: 'Contract · unverified',
      banner: {
        tone: 'warning',
        title: 'Unverified contract',
        description: 'The contract’s source code isn’t verified, so we can’t decode what this call does.',
      },
      to: ['Contract', 'Uniswap Router'],
      details: [
        [
          'Call',
          <Badge key="call" variant="warning" size="status" shape="status">
            Unverified
          </Badge>,
        ],
        ['Value', '0 ETH'],
      ],
    },
  ),
  typeVariant(
    { icon: Settings, title: 'Update', subtitle: 'Enable module: Zodiac Roles' },
    {
      id: 'queue-settings',
      label: 'Settings change',
      banner: {
        tone: 'warning',
        title: 'Changes who controls funds',
        description:
          'Modules, guards and fallback handlers can move funds or block transactions without the usual signatures.',
      },
      details: [
        ['Change', 'Enable module'],
        ['Module', 'Zodiac Roles'],
      ],
    },
  ),
  typeVariant(
    { icon: Network, title: 'Nested', subtitle: 'Approves #18 on Ops' },
    {
      id: 'queue-nested',
      label: 'Nested',
      to: ['Parent Safe', 'Ops'],
      details: [
        ['Call', 'approveHash on Ops'],
        ['Nested transaction', 'Send 2,000 USDC'],
      ],
    },
  ),
  typeVariant(
    { icon: CircleX, title: 'On-chain rejection', subtitle: 'Replaces #42' },
    {
      id: 'queue-rejection',
      label: 'On-chain rejection',
      note: 'This rejection can execute once the required approvals are collected.',
      details: [
        ['Effect', 'Sends no funds. Executing it replaces every awaiting transaction with nonce #42.'],
        ['Cost', 'Gas only'],
      ],
    },
  ),
]

export const QUEUE: PanelType = { id: 'queue', label: 'Pending queue', variants: [...STATES, ...TYPES] }
