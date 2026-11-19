import { Fragment, useId, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Ban, Clock, Info, Minus, Plus, Search, Send, X } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Label } from '@safe-global/views/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@safe-global/views/components/ui/radio-group'
import { Input } from '@safe-global/views/components/ui/input'
import { ShadcnProvider } from '@safe-global/views/components/ui/ShadcnProvider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { ThresholdBadge } from '@safe-global/views/components/common/AccountBadges'
import { cn } from '@safe-global/views/utils/cn'
import { M2Alert } from '../m2Alert'
import Identicon from '@/components/common/Identicon'
import SafeLogo from '@/components/common/SafeLogo'
import { HeaderAccountInfo, HeaderNavigation } from '@/features/spaces'
import { useDarkMode } from '@/hooks/useDarkMode'
import { PayNowPayLater } from '@/features/counterfactual'
import useWallet from '@/hooks/wallets/useWallet'
import { useWalletName } from '@/hooks/wallets/useWalletName'
import { TOM_ADDRESS } from '../m2OverviewPage'
import {
  AddFromAddressBook,
  CONTACT_GROUPS,
  ContactsHeader,
  POPULAR_TOKENS,
  type Contact,
  GroupSurface,
  ItemSurface,
  SelectableChip,
  StepIcon,
  StepLabel,
} from '../m2SetupFlow'
import { AddressHoverTooltip, FullAddress, SafeAddress, type M2Account, TOOLTIP_OFFSET } from '../m2Prototype'

export type SafeKind = 'standard' | 'restricted'

export type Signer = { id: number; name: string; address: string }

type StepId = 'type' | 'basics' | 'signers' | 'allowlist' | 'review'

const STEP_LABELS: Record<StepId, string> = {
  type: 'Account type',
  basics: 'Name and network',
  signers: 'Signers',
  allowlist: 'Allowed transfers',
  review: 'Review',
}

const KIND_LABELS: Record<SafeKind, string> = { standard: 'Standard', restricted: 'Protected' }

const NEW_SAFE_ADDRESS = '0x5afE0a1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f'

type Network = { chainId: string; name: string }

const NETWORKS: Network[] = [
  { chainId: '1', name: 'Ethereum' },
  { chainId: '8453', name: 'Base' },
  { chainId: '42161', name: 'Arbitrum' },
  { chainId: '10', name: 'Optimism' },
  { chainId: '137', name: 'Polygon' },
  { chainId: '100', name: 'Gnosis Chain' },
  { chainId: '56', name: 'BNB Smart Chain' },
  { chainId: '43114', name: 'Avalanche' },
  { chainId: '324', name: 'zkSync Era' },
  { chainId: '59144', name: 'Linea' },
  { chainId: '534352', name: 'Scroll' },
  { chainId: '11155111', name: 'Sepolia' },
]

const chainLogo = (chainId: string) => `https://safe-transaction-assets.safe.global/chains/${chainId}/chain_logo.png`

const getNetworkName = (chainId: string): string => NETWORKS.find((network) => network.chainId === chainId)?.name ?? ''

type InfoItem = { title: string; text: ReactNode }

/** Production's create-page hints, moved into an info icon next to the title they belong to. */
const InfoTip = ({ label, items }: { label: string; items: InfoItem[] }): ReactElement => (
  <Tooltip>
    <TooltipTrigger render={<span className="inline-flex text-muted-foreground" />} aria-label={label}>
      <Info className="size-4" aria-hidden />
    </TooltipTrigger>
    <TooltipContent sideOffset={TOOLTIP_OFFSET} className="max-w-80">
      <span className="flex flex-col gap-2">
        {items.map(({ title, text }) => (
          <span key={title} className="flex flex-col gap-0.5">
            <span className="font-semibold">{title}</span>
            <span>{text}</span>
          </span>
        ))}
      </span>
    </TooltipContent>
  </Tooltip>
)

const TitleWithInfo = ({ title, info }: { title: string; info?: InfoItem[] }): ReactElement => (
  <span className="flex items-center gap-1.5">
    {title}
    {info && info.length > 0 && <InfoTip label={`About ${title.toLowerCase()}`} items={info} />}
  </span>
)

// The hints production's create page shows beside each step, word for word.
const NAME_INFO: InfoItem[] = [
  {
    title: 'Address book privacy',
    text: 'The name of your Safe account will be stored in a local address book on your device and can be changed at a later stage. It will not be shared with us or any third party.',
  },
]
const NETWORK_FEE_INFO: InfoItem = {
  title: 'Network fee',
  text: 'Deploying your Safe account requires the payment of the associated network fee with your connected wallet. An estimation will be provided in the last step.',
}
const MULTICHAIN_INFO: InfoItem = {
  title: 'Same address. Many networks.',
  text: 'You can choose which networks to deploy your account on and will need to deploy them one by one after creation.',
}
const SIGNERS_INFO: InfoItem[] = [
  {
    title: 'Flat hierarchy',
    text: 'Every signer has the same rights within the Safe account and can propose, sign and execute transactions that have the required confirmations.',
  },
  {
    title: 'Managing signers',
    text: 'You can always change the number of signers and required confirmations in your Safe account after creation.',
  },
]
const getThresholdInfo = (threshold: number, owners: number): InfoItem[] => [
  ...(threshold === 1
    ? [
        {
          title: `1/${owners} policy`,
          text: 'Use a threshold higher than one to prevent losing access to your Safe account in case a signer key is lost or compromised.',
        },
      ]
    : []),
  ...(threshold === owners && owners > 1
    ? [
        {
          title: `${owners}/${owners} policy`,
          text: 'Use a threshold which is lower than the total number of signers of your Safe account in case a signer loses access to their account and needs to be replaced.',
        },
      ]
    : []),
]
const CREATION_INFO: InfoItem[] = [
  {
    title: 'Wait for the creation',
    text: 'Depending on network usage, it can take some time until the transaction is successfully added to the blockchain and picked up by our services.',
  },
]

const RESTRICTED_POINTS = [
  { Icon: Send, text: 'Funds only go to recipients you trust, in tokens you pick' },
  { Icon: Ban, text: 'Everything else is blocked onchain, even with every signature' },
  { Icon: Clock, text: 'Changes wait 24 hours' },
]

/** A recipient chip whose full address opens above its identicon, 4px up, while the whole chip is hovered. */
const RecipientChip = ({ recipient, onToggle }: { recipient: Contact; onToggle: () => void }): ReactElement => {
  const [isOpen, setIsOpen] = useState(false)
  const closeTimer = useRef<number>(undefined)
  const show = () => {
    window.clearTimeout(closeTimer.current)
    setIsOpen(true)
  }
  const hide = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setIsOpen(false), 150)
  }

  return (
    <span className="inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      <SelectableChip
        isSelected
        onToggle={onToggle}
        icon={
          <Tooltip open={isOpen}>
            <TooltipTrigger render={<span className="flex size-6 overflow-hidden rounded-full" />}>
              <Identicon address={recipient.address} size={24} />
            </TooltipTrigger>
            <TooltipContent
              sideOffset={TOOLTIP_OFFSET}
              side="top"
              className="max-w-none"
              onMouseEnter={show}
              onMouseLeave={hide}
            >
              <FullAddress address={recipient.address} chainId="1" />
            </TooltipContent>
          </Tooltip>
        }
        label={recipient.name}
        subline={<span className="font-mono text-xs text-muted-foreground">{shortAddress(recipient.address)}</span>}
        ariaLabel={`Allow ${recipient.name}`}
      />
    </span>
  )
}

/** Overlapping round badges, as production's network list; hovering one names it. */
const BadgeStack = ({ items }: { items: { key: string; icon: ReactNode; tooltip: ReactNode }[] }): ReactElement => (
  <span className="flex items-center">
    {items.map(({ key, icon, tooltip }, index) => (
      <Tooltip key={key}>
        <TooltipTrigger
          render={
            <span
              className={cn(
                'flex size-6 shrink-0 overflow-hidden rounded-full ring-2 ring-card',
                index > 0 && '-ml-1.5',
              )}
            />
          }
        >
          {icon}
        </TooltipTrigger>
        <TooltipContent sideOffset={TOOLTIP_OFFSET} side="top" className="max-w-none">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    ))}
  </span>
)

export const NetworkBadges = ({ chainIds }: { chainIds: string[] }): ReactElement => (
  <BadgeStack
    items={chainIds.map((chainId) => ({
      key: chainId,
      icon: <img src={chainLogo(chainId)} alt={getNetworkName(chainId)} className="size-6" />,
      tooltip: getNetworkName(chainId),
    }))}
  />
)

const AddressBadgeTooltip = ({ name, address, chainId }: { name: string; address: string; chainId: string }) => (
  <span className="flex flex-col gap-0.5">
    <span className="font-semibold">{name}</span>
    <FullAddress address={address} chainId={chainId} />
  </span>
)

export const SignerBadges = ({ signers, chainId = '1' }: { signers: Signer[]; chainId?: string }): ReactElement => (
  <BadgeStack
    items={signers.map(({ id, name, address }, index) => ({
      key: String(id),
      icon: <Identicon address={address} size={24} />,
      tooltip: <AddressBadgeTooltip name={name || `Signer ${index + 1}`} address={address} chainId={chainId} />,
    }))}
  />
)

export const TokenBadges = ({
  tokens,
}: {
  tokens: { symbol: string; name: string; logoUri: string }[]
}): ReactElement => (
  <BadgeStack
    items={tokens.map(({ symbol, name, logoUri }) => ({
      key: symbol,
      icon: <img src={logoUri} alt={symbol} className="size-6" />,
      tooltip: `${symbol} · ${name}`,
    }))}
  />
)

export const RecipientBadges = ({ recipients, chainId }: { recipients: Contact[]; chainId: string }): ReactElement => (
  <BadgeStack
    items={recipients.map(({ name, address }) => ({
      key: address,
      icon: <Identicon address={address} size={24} />,
      tooltip: <AddressBadgeTooltip name={name} address={address} chainId={chainId} />,
    }))}
  />
)

const RESTRICTED_INFO: InfoItem[] = [
  {
    title: 'Protected Safe account',
    text: 'Funds only go to recipients you trust, in tokens you pick. Everything else is blocked onchain, even with every signature. Changes wait 24 hours.',
  },
]

/** The account type, with a short explanation next to Protected. */
export const KindValue = ({ kind }: { kind: SafeKind }): ReactElement => (
  <span className="flex items-center gap-1.5">
    {kind === 'restricted' && <InfoTip label="What a protected Safe account is" items={RESTRICTED_INFO} />}
    {KIND_LABELS[kind]}
  </span>
)

/** The earlier flows' top bar: the logo, then the header's wallet controls. */
const FlowTopBar = (): ReactElement => {
  const wallet = useWallet()
  const walletName = useWalletName(wallet)

  return (
    <div className="flex items-center px-6 pt-6 pb-4" data-m2-new="M1 copy · Flow top bar">
      <SafeLogo />
      <div className="ml-auto flex min-w-0 flex-wrap items-center gap-1 rounded-xl bg-card p-2 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]">
        <HeaderNavigation
          walletAddress={wallet?.address ?? ''}
          walletEns={walletName}
          isConnected={Boolean(wallet)}
          walletIcon={wallet?.icon}
          walletLabel={wallet?.label}
        />
        <HeaderAccountInfo />
      </div>
    </div>
  )
}

/** Portalled over the whole app, so neither the sidebar nor the app header shows, as on the create page. */
const FullScreenFlow = ({ children }: { children: ReactNode }): ReactElement | null => {
  const isDarkMode = useDarkMode()
  if (typeof document === 'undefined') return null

  return createPortal(
    <ShadcnProvider dark={isDarkMode} className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="min-h-full pb-16" style={{ backgroundColor: 'var(--color-background-main)' }}>
        {children}
      </div>
    </ShadcnProvider>,
    document.body,
  )
}

/** The earlier flows' step rail: a check once done, a plus for the current and later steps. */
const StepRail = ({
  steps,
  current,
  onSelect,
}: {
  steps: StepId[]
  current: number
  onSelect: (index: number) => void
}): ReactElement => (
  <nav aria-label="Steps" className="flex w-fit flex-col items-start rounded-lg bg-card p-4">
    {steps.map((step, index) => (
      <Fragment key={step}>
        {index > 0 && <span aria-hidden className="ml-[9px] h-6 w-0.5 bg-border" />}
        <button
          type="button"
          onClick={() => onSelect(index)}
          disabled={index >= current}
          aria-current={index === current ? 'step' : undefined}
          className={cn(
            'group flex cursor-pointer items-center gap-3 text-left disabled:cursor-default',
            index > current ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          <StepIcon isDone={index < current} isUpcoming={index > current} />
          <StepLabel>{STEP_LABELS[step]}</StepLabel>
        </button>
      </Fragment>
    ))}
  </nav>
)

/** "USDC, USDT and 2 more": the first two names, then a count. */
const listNames = (names: string[]): string => {
  if (names.length <= 2) return names.join(' and ')
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`
}

/** What a Protected Safe account can do, in one plain sentence. */
const ProtectedSummary = ({
  tokens,
  recipients,
}: {
  tokens: { symbol: string }[]
  recipients: Contact[]
}): ReactElement => {
  if (tokens.length === 0 || recipients.length === 0) {
    return <>Pick tokens and recipients to see what this Safe account can send.</>
  }
  return (
    <>
      This Safe account can only send{' '}
      <span className="font-semibold text-foreground">{listNames(tokens.map(({ symbol }) => symbol))}</span> to{' '}
      <span className="font-semibold text-foreground">{listNames(recipients.map(({ name }) => name))}</span>. Everything
      else is blocked onchain, even with every signature.
    </>
  )
}

/** The search field's look, for every typed field in the flow: 48px, no outline. */
const FIELD = 'h-12 rounded-lg border-0 px-3 focus-visible:ring-2 focus-visible:ring-ring aria-invalid:ring-2'

const SummaryRow = ({
  label,
  isTopAligned = false,
  children,
}: {
  label: string
  /** For a multi-line value, so the label sits by its first line. */
  isTopAligned?: boolean
  children: ReactNode
}): ReactElement => (
  <div className={cn('flex justify-between gap-3', isTopAligned ? 'items-start' : 'items-center')}>
    <Typography variant="paragraph-small" color="muted" className={cn(isTopAligned && 'pt-0.5')}>
      {label}
    </Typography>
    <div className="flex min-w-0 items-center gap-2">{children}</div>
  </div>
)

/** Back and the step's action, inside the card. */
const StepFooter = ({
  onBack,
  nextLabel = 'Next',
  onNext,
  isNextDisabled = false,
  disabledHint,
}: {
  onBack: () => void
  nextLabel?: string
  onNext: () => void
  isNextDisabled?: boolean
  disabledHint?: string
}): ReactElement => {
  const next = (
    <Button size="submit" onClick={onNext} disabled={isNextDisabled}>
      {nextLabel}
    </Button>
  )

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <Button variant="outline" onClick={onBack}>
        Back
      </Button>
      {isNextDisabled && disabledHint ? (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>{next}</TooltipTrigger>
          <TooltipContent sideOffset={TOOLTIP_OFFSET}>{disabledHint}</TooltipContent>
        </Tooltip>
      ) : (
        next
      )}
    </div>
  )
}

/** A grey panel with the app's radio; the picked one gets a thin dark border, as Pay now / Pay later does. */
const ChoicePanel = ({
  value,
  isSelected,
  title,
  titleSuffix,
  description,
  children,
}: {
  value: SafeKind
  isSelected: boolean
  title: string
  titleSuffix?: ReactNode
  description?: ReactNode
  children?: ReactNode
}): ReactElement => (
  <Label
    className={cn(
      'flex w-full cursor-pointer flex-col items-stretch gap-3 rounded-xl border bg-muted p-4 font-normal transition-colors',
      isSelected ? 'border-foreground' : 'border-border',
    )}
  >
    <span className="flex items-start gap-3">
      <RadioGroupItem value={value} className="mt-0.5" />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2">
          <Typography variant="paragraph-bold">{title}</Typography>
          {titleSuffix}
        </span>
        {description && (
          <Typography variant="paragraph-small" color="muted">
            {description}
          </Typography>
        )}
      </span>
    </span>
    {children}
  </Label>
)

type PickerItem = {
  id: string
  label: string
  detail?: string
  /** The detail is an address, so it's set in the code font. */
  isDetailAddress?: boolean
  /** Full address for the identicon's hover tooltip. */
  address?: string
  icon: ReactNode
  searchText?: string
}
type PickerGroup = { id: string; header?: ReactNode; items: PickerItem[] }

/** A persistent search field: clicking lists everything, typing filters, and the list stays open to pick several. */
const SearchPicker = ({
  placeholder,
  groups,
  selected,
  onToggle,
  emptyLabel,
  getExtraItem,
  onSelectAll,
}: {
  placeholder: string
  groups: PickerGroup[]
  selected: string[]
  onToggle: (item: PickerItem) => void
  emptyLabel: string
  /** An option built from what's typed, e.g. a pasted address that isn't a contact. */
  getExtraItem?: (query: string) => PickerItem | undefined
  /** Adds a Select all row over the listed items; `isSelecting` is false when they're all picked already. */
  onSelectAll?: (ids: string[], isSelecting: boolean) => void
}): ReactElement => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const listId = useId()
  const search = query.trim().toLowerCase()
  const extra = getExtraItem?.(query.trim())
  const results = [
    ...(extra ? [{ id: 'typed', items: [extra] }] : []),
    ...groups.map((group) => ({
      ...group,
      items: group.items.filter(
        ({ label, detail, searchText, id }) =>
          !search || `${label} ${detail ?? ''} ${searchText ?? ''} ${id}`.toLowerCase().includes(search),
      ),
    })),
  ].filter(({ items }) => items.length > 0)
  const first = results[0]?.items[0]
  const listedIds = results.filter(({ id }) => id !== 'typed').flatMap(({ items }) => items.map(({ id }) => id))
  const pickedCount = listedIds.filter((id) => selected.includes(id)).length
  const isAllPicked = listedIds.length > 0 && pickedCount === listedIds.length

  return (
    <div className="relative">
      <label className="flex h-12 items-center gap-3 rounded-lg bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setIsOpen(false)
            if (event.key === 'Enter' && first) onToggle(first)
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      {isOpen && (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-card px-1 pb-1 shadow-lg"
          // Keeps focus in the field, so the list stays open while picking several.
          onMouseDown={(event) => event.preventDefault()}
        >
          {results.length === 0 ? (
            <Typography variant="paragraph-small" color="muted" className="px-3 py-2">
              {emptyLabel}
            </Typography>
          ) : (
            <>
              {onSelectAll && listedIds.length > 1 && (
                <button
                  type="button"
                  onClick={() => onSelectAll(listedIds, !isAllPicked)}
                  className="mt-1 flex w-full items-center gap-3 rounded-md border-b border-border px-3 py-2.5 text-left text-sm font-medium hover:bg-muted"
                >
                  <Checkbox
                    checked={isAllPicked}
                    indeterminate={pickedCount > 0 && !isAllPicked}
                    tabIndex={-1}
                    className="pointer-events-none"
                  />
                  Select all
                </button>
              )}
              {results.map(({ id: groupId, header, items }) => (
                <div key={groupId}>
                  {/* Solid to the list's top edge, so rows scrolling up never show above the header. */}
                  {header ? <div className="sticky top-0 z-10 bg-card pt-1">{header}</div> : <div className="pt-1" />}
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={selected.includes(item.id)}
                      onClick={() => {
                        onToggle(item)
                        // A typed option is done once added, so the field is ready for the next search.
                        if (groupId === 'typed') setQuery('')
                      }}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Checkbox checked={selected.includes(item.id)} tabIndex={-1} className="pointer-events-none" />
                      {item.address ? (
                        <AddressHoverTooltip address={item.address} className="flex shrink-0">
                          <span className="flex size-6 overflow-hidden rounded-full">{item.icon}</span>
                        </AddressHoverTooltip>
                      ) : (
                        <span className="flex size-6 shrink-0 overflow-hidden rounded-full">{item.icon}</span>
                      )}
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{item.label}</span>
                        {item.detail && (
                          <span
                            className={cn(
                              'truncate text-xs text-muted-foreground',
                              item.isDetailAddress && 'font-mono',
                            )}
                          >
                            {item.detail}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// As wide as each chip's content, wrapping onto new lines.
const ChipGrid = ({ children }: { children: ReactNode }): ReactElement => (
  <div className="flex flex-wrap gap-2">{children}</div>
)

const shortAddress = (address: string): string => `${address.slice(0, 6)}...${address.slice(-4)}`

const NetworksGroup = ({
  selected,
  onChange,
  info,
}: {
  selected: string[]
  onChange: (chainIds: string[]) => void
  info: InfoItem[]
}): ReactElement => {
  const toggle = (chainId: string) =>
    onChange(selected.includes(chainId) ? selected.filter((id) => id !== chainId) : [...selected, chainId])
  const networkIcon = (chainId: string) => <img src={chainLogo(chainId)} alt="" className="size-6 rounded-full" />

  return (
    <GroupSurface
      title={<TitleWithInfo title="Networks" info={info} />}
      description="Where this Safe account will live. You can add networks later."
      markNew="New · Network search and chips"
    >
      <SearchPicker
        placeholder="Search networks"
        emptyLabel="No networks found"
        groups={[
          {
            id: 'networks',
            items: NETWORKS.map(({ chainId, name }) => ({ id: chainId, label: name, icon: networkIcon(chainId) })),
          },
        ]}
        selected={selected}
        onToggle={({ id }) => toggle(id)}
      />
      {/* Only what was picked from the list; turning a chip off removes it. */}
      {selected.length > 0 && (
        <ChipGrid>
          {selected.map((chainId) => (
            <SelectableChip
              key={chainId}
              isSelected
              onToggle={() => toggle(chainId)}
              icon={networkIcon(chainId)}
              label={getNetworkName(chainId)}
              ariaLabel={`Deploy on ${getNetworkName(chainId)}`}
            />
          ))}
        </ChipGrid>
      )}
    </GroupSurface>
  )
}

const TokensPicker = ({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (symbols: string[]) => void
}): ReactElement => {
  const toggle = (symbol: string) =>
    onChange(selected.includes(symbol) ? selected.filter((item) => item !== symbol) : [...selected, symbol])
  const tokenFor = (symbol: string) => POPULAR_TOKENS.find((token) => token.symbol === symbol)
  const tokenIcon = (logoUri: string) => <img src={logoUri} alt="" className="size-6 rounded-full" />

  return (
    <GroupSurface
      title="Which tokens can be sent"
      description="Only transfers of the tokens selected below will be allowed."
      markNew="New · Token search and chips"
    >
      <SearchPicker
        placeholder="Search tokens by name or address"
        emptyLabel="No tokens found"
        groups={[
          {
            id: 'tokens',
            items: POPULAR_TOKENS.map(({ symbol, name, logoUri, address }) => ({
              id: symbol,
              label: symbol,
              detail: name,
              searchText: address,
              icon: tokenIcon(logoUri),
            })),
          },
        ]}
        selected={selected}
        onToggle={({ id }) => toggle(id)}
        onSelectAll={(ids, isSelecting) =>
          onChange(isSelecting ? [...new Set([...selected, ...ids])] : selected.filter((id) => !ids.includes(id)))
        }
      />
      {selected.length > 0 && (
        <ChipGrid>
          {selected.map((symbol) => (
            <SelectableChip
              key={symbol}
              isSelected
              onToggle={() => toggle(symbol)}
              icon={tokenIcon(tokenFor(symbol)?.logoUri ?? '')}
              label={symbol}
              ariaLabel={`Allow ${symbol}`}
            />
          ))}
        </ChipGrid>
      )}
    </GroupSurface>
  )
}

const RecipientsPicker = ({
  selected,
  onChange,
}: {
  selected: Contact[]
  onChange: (recipients: Contact[]) => void
}): ReactElement => {
  const selectedAddresses = selected.map(({ address }) => address.toLowerCase())
  const toggle = (contact: Contact) =>
    onChange(
      selectedAddresses.includes(contact.address.toLowerCase())
        ? selected.filter(({ address }) => address.toLowerCase() !== contact.address.toLowerCase())
        : [...selected, contact],
    )
  const avatar = (address: string) => <Identicon address={address} size={24} />
  const knownAddresses = CONTACT_GROUPS.flatMap(({ contacts }) => contacts.map(({ address }) => address.toLowerCase()))

  return (
    <GroupSurface
      title="Who can receive funds"
      description="Only transfers to the recipients selected below will be allowed."
      markNew="New · Recipient search and chips"
    >
      <SearchPicker
        placeholder="Search contacts or paste an address"
        emptyLabel="No contacts found. Paste an address to add it."
        groups={CONTACT_GROUPS.map(({ id, Icon, label, tooltip, contacts }) => ({
          id,
          header: <ContactsHeader Icon={Icon} label={label} tooltip={tooltip} count={contacts.length} />,
          items: contacts.map(({ name, address }) => ({
            id: address.toLowerCase(),
            label: name,
            detail: checksumAddress(address),
            isDetailAddress: true,
            address,
            searchText: address,
            icon: avatar(address),
          })),
        }))}
        selected={selectedAddresses}
        onToggle={({ id, label, searchText }) => {
          const contact = CONTACT_GROUPS.flatMap(({ contacts }) => contacts).find(
            ({ address }) => address.toLowerCase() === id,
          )
          toggle(contact ?? { name: label, address: searchText ?? id })
        }}
        getExtraItem={(query) =>
          isAddress(query) && !knownAddresses.includes(query.toLowerCase())
            ? {
                id: query.toLowerCase(),
                label: 'New recipient',
                detail: checksumAddress(query),
                isDetailAddress: true,
                address: query,
                searchText: query,
                icon: avatar(query),
              }
            : undefined
        }
      />
      {selected.length > 0 && (
        <ChipGrid>
          {selected.map((recipient) => (
            <RecipientChip key={recipient.address} recipient={recipient} onToggle={() => toggle(recipient)} />
          ))}
        </ChipGrid>
      )}
    </GroupSurface>
  )
}

/** Review's one-per-line addresses: identicon, name and short address. */
const AddressList = ({
  people,
  chainId,
}: {
  people: { name: string; address: string }[]
  chainId: string
}): ReactElement => (
  <span className="flex flex-col items-start gap-2">
    {people.map(({ name, address }) => (
      <SafeAddress key={address} name={name || undefined} address={address} chainId={chainId} />
    ))}
  </span>
)

/** Identicon kept round at its own size, whatever the row around it. */
const SignerAvatar = ({ address }: { address: string }): ReactElement => (
  <span className="flex size-5 shrink-0 overflow-hidden rounded-full">
    <Identicon address={address} size={20} />
  </span>
)

const isAddress = (value: string): boolean => /^0x[0-9a-fA-F]{40}$/.test(value.trim())

/** One labelled field of a signer row, with an optional line under it, as on the app's signers step. */
const SignerField = ({
  label,
  labelNote,
  hint,
  children,
}: {
  label: string
  /** Muted, on the label's line, so the row keeps the others' height. */
  labelNote?: string
  hint?: string
  children: ReactNode
}): ReactElement => (
  <div className="flex min-w-0 flex-col gap-1.5">
    <span className="flex items-baseline gap-2">
      <Typography variant="paragraph-small-medium">{label}</Typography>
      {labelNote && (
        <Typography variant="paragraph-small" color="muted">
          {labelNote}
        </Typography>
      )}
    </span>
    {children}
    {hint && (
      <Typography variant="paragraph-small" color="muted">
        {hint}
      </Typography>
    )}
  </div>
)

/** Create a Safe account in the earlier flows' style: step rail, one white card of grey panels, a summary on the right. */
export const CreateSafeFlow = ({
  onClose,
  onCreate,
  initialKind = 'standard',
}: {
  onClose: () => void
  /** An entry point for protected Safe accounts opens the flow with that type already picked. */
  initialKind?: SafeKind
  onCreate: (account: M2Account & { kind: SafeKind }) => void
}): ReactElement => {
  const wallet = useWallet()
  const ownerAddress = wallet?.address ?? TOM_ADDRESS
  const [stepIndex, setStepIndex] = useState(0)
  const [name, setName] = useState('')
  const [chainIds, setChainIds] = useState<string[]>([])
  const [kind, setKind] = useState<SafeKind>(initialKind)
  const [ownerName, setOwnerName] = useState('')
  const [extraSigners, setExtraSigners] = useState<Signer[]>([])
  const [threshold, setThreshold] = useState(1)
  const [tokenSymbols, setTokenSymbols] = useState<string[]>([])
  const [recipients, setRecipients] = useState<Contact[]>([])
  const [payMethod, setPayMethod] = useState<PayMethod>(PayMethod.PayLater)

  // Coming from a Protected Safe account entry point, the type is already decided.
  const isTypePicked = initialKind === 'restricted'
  const steps: StepId[] = [
    ...(isTypePicked ? [] : (['type'] as const)),
    'basics',
    'signers',
    ...(kind === 'restricted' ? (['allowlist'] as const) : []),
    'review',
  ]
  const step = steps[stepIndex]
  const isPast = (id: StepId) => steps.indexOf(id) !== -1 && steps.indexOf(id) < stepIndex
  const signers = [{ id: 0, name: ownerName, address: ownerAddress }, ...extraSigners]
  // The signer row whose address field has the contacts list open.
  const [pickingFor, setPickingFor] = useState<number | null>(null)
  const signerFieldRef = useRef<HTMLDivElement>(null)
  const listedSignerAddresses = signers.map(({ address }) => address.toLowerCase()).filter(Boolean)
  const hasInvalidSigner = extraSigners.some(({ address }) => !isAddress(address))
  const pickedSigner = extraSigners.find(({ id }) => id === pickingFor)
  const updateSigner = (id: number, change: Partial<Signer>) =>
    setExtraSigners((current) => current.map((signer) => (signer.id === id ? { ...signer, ...change } : signer)))
  const chainId = chainIds[0] ?? '1'
  const account: M2Account = {
    name: name || 'New Safe account',
    address: NEW_SAFE_ADDRESS,
    chainId,
    version: '1.4.1',
    threshold,
    owners: signers.length,
  }
  const tokens = POPULAR_TOKENS.filter(({ symbol }) => tokenSymbols.includes(symbol))
  const next = () => setStepIndex((index) => Math.min(index + 1, steps.length - 1))
  const back = () => (stepIndex === 0 ? onClose() : setStepIndex((index) => index - 1))

  const pickKind = (nextKind: SafeKind) => {
    setKind(nextKind)
    // A lower threshold is the point of a protected Safe account, so it starts at one.
    setThreshold(nextKind === 'restricted' ? 1 : Math.min(2, signers.length))
  }

  const stepContent: Record<StepId, ReactNode> = {
    basics: (
      <>
        <GroupSurface
          title={<TitleWithInfo title="Name" info={NAME_INFO} />}
          description="Only you and your team see it."
          markNew="M1 copy · Safe name"
        >
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Payments Safe"
            // eslint-disable-next-line no-restricted-syntax -- Input has no 48px borderless size; matches the flow's search fields
            className={cn(FIELD, 'bg-card dark:bg-card')}
          />
        </GroupSurface>
        <NetworksGroup
          selected={chainIds}
          onChange={setChainIds}
          info={[NETWORK_FEE_INFO, ...(chainIds.length > 1 ? [MULTICHAIN_INFO] : [])]}
        />
        <StepFooter
          onBack={back}
          onNext={next}
          isNextDisabled={!name.trim() || chainIds.length === 0}
          disabledHint="Add a name and pick at least one network"
        />
      </>
    ),
    type: (
      <>
        <RadioGroup value={kind} onValueChange={(value) => pickKind(value as SafeKind)} className="gap-4">
          <ChoicePanel
            value="standard"
            isSelected={kind === 'standard'}
            title="Standard Safe account"
            description="Any transaction is possible. Your signers are responsible for checking what they sign."
          />
          <ChoicePanel
            value="restricted"
            isSelected={kind === 'restricted'}
            title="Protected Safe account"
            titleSuffix={
              // eslint-disable-next-line no-restricted-syntax -- prototype: the green banner's border; no Badge variant has one yet
              <Badge variant="success" size="status" shape="status" className="border border-green-200">
                New
              </Badge>
            }
          >
            <ul className="flex flex-col gap-2 pl-7">
              {RESTRICTED_POINTS.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <Typography variant="paragraph-small" color="muted">
                    {text}
                  </Typography>
                </li>
              ))}
            </ul>
            {/* The link opens the article without also picking the option. */}
            <span className="pl-7" onClick={(event) => event.stopPropagation()}>
              <ExternalLink
                href={HelpCenterArticle.POLICIES}
                noIcon
                className="text-sm [&>span]:underline [&>span]:decoration-current [&>span]:underline-offset-2"
              >
                Learn more
              </ExternalLink>
            </span>
          </ChoicePanel>
        </RadioGroup>
        <StepFooter onBack={back} onNext={next} />
      </>
    ),
    signers: (
      <>
        <GroupSurface
          title={<TitleWithInfo title="Signers" info={SIGNERS_INFO} />}
          description="The wallets that can confirm this Safe account’s transactions."
          markNew="M1 copy · Signers"
        >
          <div className="flex flex-col gap-2">
            {signers.map((signer, index) => {
              const isOwner = index === 0
              const isInvalid = !isOwner && signer.address.trim() !== '' && !isAddress(signer.address)
              return (
                <ItemSurface key={signer.id}>
                  <div className="grid grid-cols-[minmax(7rem,1fr)_25rem_1.5rem] items-start gap-3">
                    <SignerField label="Signer name">
                      <Input
                        value={signer.name}
                        onChange={(event) =>
                          isOwner
                            ? setOwnerName(event.target.value)
                            : updateSigner(signer.id, { name: event.target.value })
                        }
                        placeholder={`Signer ${index + 1}`}
                        // eslint-disable-next-line no-restricted-syntax -- Input has no 48px borderless size; matches the flow's search fields
                        className={cn(FIELD, 'bg-muted')}
                      />
                    </SignerField>
                    <SignerField
                      label="Signer"
                      labelNote={isOwner ? 'Your connected wallet' : undefined}
                      hint={isInvalid ? 'Enter a valid address' : undefined}
                    >
                      {isOwner ? (
                        <div className="flex h-12 items-center gap-2 rounded-lg bg-muted px-3">
                          <AddressHoverTooltip address={signer.address} chainId={chainId} className="flex shrink-0">
                            <SignerAvatar address={signer.address} />
                          </AddressHoverTooltip>
                          <span className="truncate font-mono text-[13px]">{signer.address}</span>
                        </div>
                      ) : (
                        <div ref={pickingFor === signer.id ? signerFieldRef : undefined} className="relative">
                          {isAddress(signer.address) && (
                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                              <SignerAvatar address={signer.address} />
                            </span>
                          )}
                          <Input
                            value={signer.address}
                            onChange={(event) => {
                              updateSigner(signer.id, { address: event.target.value })
                              setPickingFor(signer.id)
                            }}
                            onClick={() => setPickingFor(signer.id)}
                            placeholder="Search contacts or paste an address"
                            aria-invalid={isInvalid}
                            className={cn(
                              FIELD,
                              // eslint-disable-next-line no-restricted-syntax -- Input has no 48px borderless size; matches the flow's search fields
                              'bg-muted',
                              signer.address && 'font-mono text-[13px] md:text-[13px]',
                              isAddress(signer.address) && 'pl-10',
                            )}
                          />
                        </div>
                      )}
                    </SignerField>
                    {isOwner ? (
                      <span aria-hidden />
                    ) : (
                      <Button
                        variant="ghost-muted"
                        size="icon-xs"
                        className="mt-9.5"
                        aria-label={`Remove ${signer.name || `signer ${index + 1}`}`}
                        onClick={() => {
                          setExtraSigners((current) => current.filter(({ id }) => id !== signer.id))
                          setThreshold((current) => Math.min(current, signers.length - 1))
                        }}
                      >
                        <X />
                      </Button>
                    )}
                  </div>
                </ItemSurface>
              )
            })}
          </div>
          {/* The allowlist's address book list, one contact per signer. */}
          <AddFromAddressBook
            isSingle
            open={pickedSigner !== undefined}
            onOpenChange={(open) => !open && setPickingFor(null)}
            listedAddresses={listedSignerAddresses}
            onAdd={([contact]) => {
              if (!contact || pickingFor === null) return
              updateSigner(pickingFor, {
                address: contact.address,
                ...(pickedSigner?.name ? {} : { name: contact.name }),
              })
              setPickingFor(null)
            }}
            anchorRef={signerFieldRef}
            externalQuery={pickedSigner && !isAddress(pickedSigner.address) ? pickedSigner.address : ''}
          />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const id = Date.now()
                setExtraSigners((current) => [...current, { id, name: '', address: '' }])
              }}
            >
              <Plus data-icon="inline-start" aria-hidden />
              Add new signer
            </Button>
          </div>
        </GroupSurface>
        <GroupSurface
          title={<TitleWithInfo title="Threshold" info={getThresholdInfo(threshold, signers.length)} />}
          description={
            kind === 'restricted'
              ? 'Funds can only go to your allowlist, so fewer confirmations can be enough.'
              : 'How many signers need to confirm each transaction.'
          }
          markNew="New · Threshold"
        >
          <ItemSurface>
            <div className="flex items-center justify-between gap-3">
              <Typography variant="paragraph-small-medium">
                {threshold} out of {signers.length} signers
              </Typography>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-xs"
                  aria-label="Fewer confirmations"
                  disabled={threshold <= 1}
                  onClick={() => setThreshold((current) => current - 1)}
                >
                  <Minus />
                </Button>
                <Button
                  variant="outline"
                  size="icon-xs"
                  aria-label="More confirmations"
                  disabled={threshold >= signers.length}
                  onClick={() => setThreshold((current) => current + 1)}
                >
                  <Plus />
                </Button>
              </div>
            </div>
          </ItemSurface>
        </GroupSurface>
        <StepFooter
          onBack={back}
          onNext={next}
          isNextDisabled={hasInvalidSigner}
          disabledHint="Pick or paste an address for each signer"
        />
      </>
    ),
    allowlist: (
      <>
        <TokensPicker selected={tokenSymbols} onChange={setTokenSymbols} />
        <RecipientsPicker selected={recipients} onChange={setRecipients} />
        <StepFooter
          onBack={back}
          onNext={next}
          isNextDisabled={tokens.length === 0 || recipients.length === 0}
          disabledHint="Pick at least one token and one recipient"
        />
      </>
    ),
    review: (
      <>
        <GroupSurface
          title={<TitleWithInfo title="Safe account" info={CREATION_INFO} />}
          markNew="New · Review account"
        >
          <ItemSurface>
            <div className="flex flex-col gap-5 py-1">
              <SummaryRow label="Name">
                <Typography variant="paragraph-small-medium">{account.name}</Typography>
              </SummaryRow>
              <SummaryRow label={chainIds.length > 1 ? 'Networks' : 'Network'}>
                <NetworkBadges chainIds={chainIds} />
              </SummaryRow>
              <SummaryRow label="Signers" isTopAligned>
                <AddressList people={signers} chainId={chainId} />
              </SummaryRow>
              <SummaryRow label="Threshold">
                <ThresholdBadge threshold={threshold} owners={signers.length} />
              </SummaryRow>
              <SummaryRow label="Type">
                <Typography variant="paragraph-small-medium">
                  <KindValue kind={kind} />
                </Typography>
              </SummaryRow>
            </div>
          </ItemSurface>
        </GroupSurface>
        {kind === 'restricted' && (
          <GroupSurface title="Allowed transfers" markNew="New · Review allowed transfers">
            <ItemSurface>
              <div className="flex flex-col gap-5 py-1">
                <SummaryRow label="Tokens">
                  <TokenBadges tokens={tokens} />
                </SummaryRow>
                <SummaryRow label="Recipients" isTopAligned>
                  <AddressList people={recipients} chainId={chainId} />
                </SummaryRow>
              </div>
            </ItemSurface>
          </GroupSurface>
        )}
        {/* Production's fee choice from the create flow's Review step, as is. */}
        <section className="flex flex-col gap-2 rounded-xl bg-muted p-4" data-m2-new="Production · Pay now or later">
          <PayNowPayLater
            totalFee="< 0.00001"
            canRelay={false}
            isMultiChain={chainIds.length > 1}
            payMethod={payMethod}
            setPayMethod={setPayMethod}
          />
        </section>
        <StepFooter onBack={back} nextLabel="Create account" onNext={() => onCreate({ ...account, kind })} />
      </>
    ),
  }

  // Only what the user has decided so far.
  const summaryRows: { label: string; value: ReactNode }[] = [
    ...(isTypePicked || isPast('type') ? [{ label: 'Type', value: <KindValue kind={kind} /> }] : []),
    ...(name.trim() ? [{ label: 'Name', value: name.trim() }] : []),
    ...(chainIds.length
      ? [{ label: chainIds.length > 1 ? 'Networks' : 'Network', value: <NetworkBadges chainIds={chainIds} /> }]
      : []),
    ...(isPast('signers')
      ? [
          { label: 'Signers', value: <SignerBadges signers={signers} chainId={chainId} /> },
          { label: 'Threshold', value: <ThresholdBadge threshold={threshold} owners={signers.length} /> },
        ]
      : []),
    ...(isPast('allowlist')
      ? [
          { label: 'Tokens', value: <TokenBadges tokens={tokens} /> },
          { label: 'Recipients', value: <RecipientBadges recipients={recipients} chainId={chainId} /> },
        ]
      : []),
  ]

  return (
    <FullScreenFlow>
      <FlowTopBar />
      <div className="px-[var(--space-3)]">
        <div className="mx-auto grid w-full max-w-[1360px] grid-cols-1 items-start gap-x-6 gap-y-[var(--space-2)] min-[1200px]:grid-cols-[minmax(0,1fr)_minmax(0,672px)_minmax(0,1fr)]">
          <div className="hidden min-[1200px]:block" />
          <div className="flex h-12 items-center justify-between">
            <Typography variant="h3" className="font-bold">
              {kind === 'restricted' ? 'Create protected Safe account' : 'Create new Safe account'}
            </Typography>
            <Button variant="surface" size="icon" aria-label="Close" onClick={onClose}>
              <X />
            </Button>
          </div>
          <div className="hidden min-[1200px]:block" />

          <aside className="hidden min-[1200px]:flex min-[1200px]:justify-end">
            <StepRail steps={steps} current={stepIndex} onSelect={setStepIndex} />
          </aside>

          <div className="flex min-w-0 flex-col gap-4 rounded-xl bg-card p-4" data-m2-new="New · Create Safe step">
            <Typography variant="paragraph-bold">{STEP_LABELS[step]}</Typography>
            {stepContent[step]}
          </div>

          {/* Review already lists everything, so only the plain-language summary stays there. */}
          {step === 'review' && kind !== 'restricted' ? (
            <div className="hidden min-[1200px]:block" />
          ) : (
            <div
              className="flex flex-col gap-3 rounded-lg bg-card p-4 min-[1200px]:max-w-[320px]"
              data-m2-new="New · Safe account summary"
            >
              <Typography variant="paragraph-small-medium">Safe account preview</Typography>
              {kind === 'restricted' && (isTypePicked || isPast('type')) && (
                <Typography
                  variant="paragraph-small"
                  color="muted"
                  className={cn('rounded-md bg-muted px-3 py-2.5', step !== 'review' && 'mb-1')}
                >
                  <ProtectedSummary tokens={tokens} recipients={recipients} />
                </Typography>
              )}
              {step !== 'review' && summaryRows.length > 0 && (
                // One row height, so text rows and badge rows sit on an even rhythm.
                <div className="flex flex-col gap-2 [&>*]:min-h-7">
                  {summaryRows.map(({ label, value }) => (
                    <SummaryRow key={label} label={label}>
                      <Typography variant="paragraph-small" className="truncate" as="span">
                        {value}
                      </Typography>
                    </SummaryRow>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </FullScreenFlow>
  )
}

/** Where teams already look, a short pointer to protected Safe accounts that opens the flow with the type picked. */
export const RestrictedSafeBanner = ({
  title,
  description,
  onCreate,
  onDismiss,
}: {
  title: string
  description: string
  onCreate: () => void
  onDismiss?: () => void
}): ReactElement => (
  <M2Alert
    tone="info"
    title={title}
    description={description}
    onDismiss={onDismiss}
    action={
      <Button size="sm" onClick={onCreate}>
        Create protected Safe account
      </Button>
    }
  />
)
