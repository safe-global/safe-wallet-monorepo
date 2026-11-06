import type { ReactElement, ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import Identicon from '@/components/common/Identicon'
import TokenIcon from '@/components/common/TokenIcon'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Typography } from '@safe-global/views/components/ui/typography'
import { CHANGE_BADGE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/Summary/constants'
import { ADDRESS_BOOK, SIGNERS, SafeAddress, type M2Account } from '../../m2Prototype'
import { CHAIN_NAMES } from '../../m2OverviewPage'
import { getAccountTokens } from '../../m2SetupFlow'
import { CtaLink } from '../../../../SecurityHub/components/SecurityChecks/primitives'
import { PanelExpandableSection, PanelRow, PanelSection, StackedIcons } from '../PanelBody'
import type { SignatureRow } from '../SignaturesFooter'

const SIGNER_ADDRESSES = [
  '0x1f2e3d4c5b6a79880716253443526170819a2b3c',
  '0x7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
  '0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3',
]

export const PEOPLE = SIGNERS.map((signer, index) => ({ ...signer, address: SIGNER_ADDRESSES[index] }))
export const [NADIA, TOM, PRIYA] = PEOPLE
type Person = (typeof PEOPLE)[number]

/** Tom is "you" in every panel. */
export const created = (person: Person, time: string): SignatureRow => ({
  kind: 'created',
  name: person.firstName,
  time,
})
export const signed = (person: Person, time: string): SignatureRow => ({
  kind: 'signed',
  name: person.name,
  address: person.address,
  time,
  you: person === TOM,
})
export const needed = (person: Person): SignatureRow => ({
  kind: 'needed',
  name: person.name,
  address: person.address,
  you: person === TOM,
})

export const SIGNING_TIME = { meta: '6 days left', metaTooltip: 'Expires on Oct 21, 2026 at 13:02 UTC' }

const RemovedBadge = (): ReactElement => (
  <Badge variant={CHANGE_BADGE.removed.variant} className="w-20 shrink-0 justify-center">
    {CHANGE_BADGE.removed.label}
  </Badge>
)

const PREVIEW_COUNT = 3

/** M2's recipient card; `removed` marks every recipient for a pending removal. */
export const RecipientsSection = ({ account, removed }: { account: M2Account; removed?: boolean }): ReactElement => (
  <PanelExpandableSection
    title="Who can receive funds"
    detailsLabel="recipients"
    summary={
      <>
        <StackedIcons
          icons={ADDRESS_BOOK.slice(0, PREVIEW_COUNT).map(({ address }) => (
            <Identicon key={address} address={address} size={24} />
          ))}
        />
        <Typography variant="paragraph-small-medium" className="min-w-0 flex-1 truncate">
          {ADDRESS_BOOK.length} recipients
        </Typography>
        {removed && <RemovedBadge />}
      </>
    }
    items={ADDRESS_BOOK.map((contact) => (
      <>
        <span className="min-w-0 flex-1">
          <SafeAddress name={contact.name} address={contact.address} chainId={account.chainId} />
        </span>
        {removed && <RemovedBadge />}
      </>
    ))}
  />
)

/** M2's token card, with the account's real token icons. */
export const TokensSection = ({ account, removed }: { account: M2Account; removed?: boolean }): ReactElement => {
  const tokens = getAccountTokens(account)

  return (
    <PanelExpandableSection
      title="Which tokens can be sent"
      detailsLabel="tokens"
      summary={
        <>
          <StackedIcons
            icons={tokens.slice(0, PREVIEW_COUNT).map(({ symbol, logoUri }) => (
              <TokenIcon key={symbol} logoUri={logoUri} tokenSymbol={symbol} size={24} />
            ))}
          />
          <Typography variant="paragraph-small-medium" className="min-w-0 flex-1 truncate">
            {tokens.length} {tokens.length === 1 ? 'token' : 'tokens'}
          </Typography>
          {removed && <RemovedBadge />}
        </>
      }
      items={tokens.map(({ symbol, name, logoUri }) => (
        <>
          <TokenIcon logoUri={logoUri} tokenSymbol={symbol} size={24} />
          <span className="flex min-w-0 flex-1 flex-col">
            <Typography variant="paragraph-small-medium">{symbol}</Typography>
            <Typography variant="paragraph-small" color="muted" className="truncate">
              {name}
            </Typography>
          </span>
          {removed && <RemovedBadge />}
        </>
      ))}
    />
  )
}

export const EnforcedBy = ({ label, link = true }: { label: string; link?: boolean }): ReactElement => (
  <span className="inline-flex items-center gap-1.5">
    <ShieldCheck className="size-3.5" aria-hidden />
    <span className={link ? 'underline underline-offset-2' : undefined}>{label}</span>
  </span>
)

/** M1's "Policy overview"; `extra` rows go between the account and the network. */
export const PolicyOverview = ({
  account,
  enforcedBy,
  link = true,
  lastUpdated = 'Oct 12, 2026 · 13:02',
  extra,
}: {
  account: M2Account
  enforcedBy: string
  link?: boolean
  lastUpdated?: string
  extra?: ReactNode
}): ReactElement => (
  <PanelSection title="Policy overview">
    <PanelRow label="Safe account" account>
      <SafeAddress name={account.name} address={account.address} chainId={account.chainId} />
    </PanelRow>
    {extra}
    <PanelRow label="Network">{CHAIN_NAMES[account.chainId]}</PanelRow>
    <PanelRow label="Last updated">{lastUpdated}</PanelRow>
    <PanelRow label="Enforced by">
      <EnforcedBy label={enforcedBy} link={link} />
    </PanelRow>
  </PanelSection>
)

/** Security Hub's fix link; inert in the prototype. */
export const FixLink = ({ label }: { label: string }): ReactElement => (
  <CtaLink cta={{ label, onClick: () => undefined }} />
)

/** A muted paragraph inside a frame or card. */
export const Muted = ({ children }: { children: ReactNode }): ReactElement => (
  <Typography variant="paragraph-small" color="muted">
    {children}
  </Typography>
)
