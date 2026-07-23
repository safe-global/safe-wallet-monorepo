import type { Meta, StoryObj } from '@storybook/react'
import { useState, type ReactNode } from 'react'
import { Plus, ArrowUpRight, ArrowDownLeft, Download } from 'lucide-react'

import { Button } from '../button'
import { Input } from '../input'
import { Textarea } from '../textarea'
import { Field, FieldLabel, FieldDescription, FieldError } from '../field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select'
import { SearchInput } from '../search-input'
import EnhancedTable from '@/components/common/EnhancedTable'
import TableCard from '@/components/common/TableCard'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card'
import { Tabs, TabsList, TabsTrigger } from '../tabs'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../dialog'
import { Tooltip, TooltipTrigger, TooltipContent } from '../tooltip'
import { Typography } from '../typography'
import TokenIcon from '@/components/common/TokenIcon'
import { linkTo } from '@storybook/addon-links'
import SubmitButton from '@/components/common/SubmitButton'
import { ActionButton } from '@/components/common/ActionBar'
import IconAction from '@/components/common/IconAction'
import ChoiceButton from '@/components/common/ChoiceButton'
import SplitMenuButton from '@/components/common/SplitMenuButton'
import DialogActions from '@/components/common/DialogActions'
import OnboardingFooter from '@/components/common/OnboardingFooter'
import CopyButton from '@/components/common/CopyButton'
import ExplorerButton from '@/components/common/ExplorerButton'

/**
 * Design System — the shared, most-used building blocks of Safe{Wallet}, shown as they actually
 * render. This is the alignment surface between design and engineering: change a component here and
 * it changes everywhere it's used, which is exactly what keeps the app consistent.
 *
 * Visual-first on purpose — the component is the hero, captions are kept short. The exhaustive
 * per-variant/state references live under UI/ (UI/Button, UI/Input, …).
 */
const meta = {
  title: 'Design System',
  parameters: {
    layout: 'padded',
    // Reference gallery — visual but partly interactive; keep it out of image snapshots.
    visualTest: { disable: true },
  },
  tags: ['skip-visual-test'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/* ------------------------------------------------------------------ layout helpers */

const Family = ({
  title,
  lead,
  review,
  children,
}: {
  title: string
  lead?: ReactNode
  /** Open questions + when-to-use suggestions surfaced for the design review (not a component reference). */
  review?: ReactNode[]
  children: ReactNode
}) => (
  <div className="flex max-w-5xl flex-col gap-12">
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {lead ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{lead}</p> : null}
    </div>
    {review && review.length > 0 ? (
      <section className="rounded-lg border border-dashed border-border bg-muted/50 p-4">
        <h3 className="mb-2 text-xs font-semibold tracking-wider text-foreground uppercase">To review with design</h3>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
          {review.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>
    ) : null}
    {children}
  </div>
)

const Row = ({ label, note, children }: { label: string; note?: ReactNode; children: ReactNode }) => (
  <section>
    <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{label}</h3>
      {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
    </div>
    <div className="flex flex-wrap items-end gap-x-10 gap-y-7">{children}</div>
  </section>
)

const Swatch = ({
  label,
  use,
  review,
  to,
  toLabel,
  children,
}: {
  label?: string
  /** A short "when to use this" caption under the label. */
  use?: string
  /** A short open question for the design review, shown inline beside the component it's about. */
  review?: ReactNode
  to?: string
  toLabel?: string
  children: ReactNode
}) => (
  <div className="flex flex-col items-start gap-1.5">
    <div className="flex min-h-9 items-center">{children}</div>
    {label ? <span className="font-mono text-[11px] leading-none text-muted-foreground">{label}</span> : null}
    {use ? <span className="max-w-[220px] text-[11px] leading-snug text-muted-foreground">{use}</span> : null}
    {to ? (
      <button
        type="button"
        onClick={linkTo(to)}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 text-[11px] underline underline-offset-2"
      >
        {toLabel ?? 'Where'}
        <ArrowUpRight className="size-3" />
      </button>
    ) : null}
    {review ? (
      <span className="mt-0.5 max-w-[220px] rounded border border-dashed border-border bg-muted/50 px-1.5 py-1 text-[11px] leading-snug text-foreground">
        {review}
      </span>
    ) : null}
  </div>
)

const DemoSelect = ({ variant }: { variant?: 'default' | 'ghost' }) => (
  <Select defaultValue="1" items={{ '1': 'Mainnet', '2': 'Base', '3': 'Arbitrum' }}>
    <SelectTrigger variant={variant} className="w-40">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="1">Mainnet</SelectItem>
      <SelectItem value="2">Base</SelectItem>
      <SelectItem value="3">Arbitrum</SelectItem>
    </SelectContent>
  </Select>
)

// Mirrors the AutocompleteItem the app renders inside TokenAmountInput's compact `sm` select —
// an icon + name + balance — so the story shows what `sm` actually carries in use, not just a plain
// label. Kept self-contained (no tx-flow import) to stay Storybook-safe.
const DEMO_TOKENS = [
  {
    symbol: 'ETH',
    name: 'Ether',
    balance: '2.4',
    logoUri: 'https://assets.smold.app/api/token/1/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE/logo-128.png',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    balance: '1,250.00',
    logoUri: 'https://assets.smold.app/api/token/1/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo-128.png',
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    balance: '820.50',
    logoUri: 'https://assets.smold.app/api/token/1/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo-128.png',
  },
]

const TokenOptionItem = ({ token }: { token: (typeof DEMO_TOKENS)[number] }) => (
  <div className="flex items-center gap-2">
    <TokenIcon logoUri={token.logoUri} tokenSymbol={token.symbol} />
    <div className="flex-1">
      <Typography variant="paragraph-small" className="block whitespace-nowrap">
        {token.name}
      </Typography>
      <Typography variant="paragraph-mini" className="block">
        {token.balance} {token.symbol}
      </Typography>
    </div>
  </div>
)

// Rich-content `sm` select: the trigger value and each item carry a token row (mirrors TokenAmountInput).
const DemoTokenSelect = () => {
  const [value, setValue] = useState('ETH')
  const selected = DEMO_TOKENS.find((token) => token.symbol === value) ?? DEMO_TOKENS[0]
  return (
    <Select value={value} onValueChange={(next) => next && setValue(next)}>
      <SelectTrigger>
        <SelectValue>
          <TokenOptionItem token={selected} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="w-auto min-w-44">
        {DEMO_TOKENS.map((token) => (
          <SelectItem key={token.symbol} value={token.symbol}>
            <TokenOptionItem token={token} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Links to other Storybook stories (navigates the manager via addon-links) — so "where used"
// jumps straight to the exhaustive UI reference or the component living in a real screen.
const StoryLink = ({ title, name, children }: { title: string; name?: string; children: ReactNode }) => (
  <button
    type="button"
    onClick={linkTo(title, name)}
    className="border-border text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
  >
    {children}
    <ArrowUpRight className="size-3 opacity-60" />
  </button>
)

const LinkGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-muted-foreground w-24 shrink-0 text-xs">{label}</span>
    {children}
  </div>
)

const WhereUsed = ({ children }: { children: ReactNode }) => (
  <section>
    <h3 className="text-foreground mb-3 text-xs font-semibold tracking-wider uppercase">Where it&apos;s used</h3>
    <div className="flex flex-col gap-2.5">{children}</div>
  </section>
)

// A catalog entry for a component we ship but don't render inline (too heavy / feature-scoped to
// mock here) — its name, a when-to-use line, a link to its own story, and an optional review question.
const CatalogRow = ({
  name,
  use,
  to,
  toLabel,
  review,
}: {
  name: string
  use: string
  to?: string
  toLabel?: string
  review?: string
}) => (
  <li className="flex flex-col gap-1.5 border-b border-border py-3 last:border-0">
    <div className="flex flex-wrap items-baseline gap-x-2">
      <code className="text-[13px] text-foreground">{name}</code>
      <span className="text-sm text-muted-foreground">{use}</span>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {to ? <StoryLink title={to}>{toLabel ?? name}</StoryLink> : null}
      {review ? (
        <span className="rounded border border-dashed border-border bg-muted/50 px-1.5 py-0.5 text-[11px] leading-snug text-foreground">
          {review}
        </span>
      ) : null}
    </div>
  </li>
)

/* ================================================================= OVERVIEW */

export const Overview: Story = {
  render: () => (
    <div className="flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Design System</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The most-used building blocks of Safe{'{'}Wallet{'}'}, rendered as they actually appear in the app. Design and
          engineering align here: these components are shared, so changing one is a deliberate, app-wide change —
          that&apos;s what keeps the product consistent. Pick a component from the sidebar for its variants, sizes and
          states.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-x-10 gap-y-8 rounded-xl border border-border p-6">
        <Swatch label="Button">
          <Button size="action">Confirm</Button>
        </Swatch>
        <Swatch label="Input">
          <div className="w-52">
            <Input placeholder="0x…" />
          </div>
        </Swatch>
        <Swatch label="Select">
          <DemoSelect />
        </Swatch>
        <Swatch label="Search">
          <div className="w-56">
            <SearchInput placeholder="Search" />
          </div>
        </Swatch>
        <Swatch label="Tabs">
          <Tabs defaultValue="a">
            <TabsList>
              <TabsTrigger value="a">Assets</TabsTrigger>
              <TabsTrigger value="b">NFTs</TabsTrigger>
            </TabsList>
          </Tabs>
        </Swatch>
      </div>
    </div>
  ),
}

/* ================================================================== BUTTONS */

export const Buttons: Story = {
  render: () => (
    <Family
      title="Buttons"
      lead={
        <>
          The real buttons we ship, by intent. Most don&apos;t pick a size — they come through a{' '}
          <strong>fixed-size preset</strong> (DialogActions, ActionButton, SubmitButton, OnboardingFooter). Aim for
          uniformity: reach for these, and migrate one-off sizes/variants toward the common ones (see the bottom).{' '}
          <strong>Leading icon</strong> only for standalone verb actions (money movement, add/create, export) — dialog
          &amp; form-footer actions (confirm, cancel, save, delete) stay text-only.
        </>
      }
    >
      <Row label="Actions we use" note="the real buttons, by intent — label · variant / size · and where they live">
        <Swatch label="default · action" to="Features/ActionsTray/ActionsTray" toLabel="Actions tray">
          <Button size="action">
            <ArrowUpRight />
            Send
          </Button>
        </Swatch>
        <Swatch label="secondary · action" to="Features/ActionsTray/ActionsTray" toLabel="Actions tray">
          <Button variant="secondary" size="action">
            <ArrowDownLeft />
            Receive
          </Button>
        </Swatch>
        <Swatch label="default · submit" to="Components/Common/DialogActions" toLabel="DialogActions">
          <Button size="submit">Confirm</Button>
        </Swatch>
        <Swatch label="default" to="Features/Proposers/ProposersList" toLabel="Proposers">
          <Button>
            <Plus />
            Add proposer
          </Button>
        </Swatch>
        <Swatch label="default" to="Pages/Core/Home" toLabel="Dashboard">
          <Button>
            <Plus />
            Add funds
          </Button>
        </Swatch>
        <Swatch label="outline · action" to="Pages/Core/Transactions/History" toLabel="Transactions">
          <Button variant="outline" size="action">
            <Download />
            Export
          </Button>
        </Swatch>
        <Swatch label="default" to="Pages/Spaces/Settings" toLabel="Space settings">
          <Button>Save</Button>
        </Swatch>
        <Swatch label="outline · submit" to="Components/Common/DialogActions" toLabel="DialogActions">
          <Button variant="outline" size="submit">
            Cancel
          </Button>
        </Swatch>
        <Swatch label="destructive" to="Pages/Spaces/Settings" toLabel="Delete workspace">
          <Button variant="destructive">Delete</Button>
        </Swatch>
        <Swatch label="ghost" to="Components/Settings/OwnerList" toLabel="Signers">
          <Button variant="ghost">Manage signers</Button>
        </Swatch>
      </Row>

      <Row
        label="Sizes we use"
        note="the only ones in real use — most buttons take no size (= default) or a preset that locks it"
      >
        <Swatch label="default · h-9" to="Pages/Core/Home" toLabel="Dashboard">
          <Button>Default</Button>
        </Swatch>
        <Swatch label="sm · h-8" to="Components/Settings/OwnerList" toLabel="Signer rows">
          <Button size="sm">Small</Button>
        </Swatch>
        <Swatch
          label="lg · h-10"
          review="lg / action / submit all render at h-10 — is lg redundant, and should action + submit merge?"
          to="Pages/Onboarding/NewSafe/Create"
          toLabel="Create Safe"
        >
          <Button size="lg">Large</Button>
        </Swatch>
        <Swatch label="action · h-10 → ActionButton" to="Features/ActionsTray/ActionsTray" toLabel="Actions tray">
          <Button size="action">Action</Button>
        </Swatch>
        <Swatch label="submit · h-10 → SubmitButton" to="Components/Common/DialogActions" toLabel="DialogActions">
          <Button size="submit">Submit</Button>
        </Swatch>
      </Row>

      <Row
        label="Presets & composites"
        note="most buttons come through one of these — they lock size + styling so usage stays uniform"
      >
        <Swatch
          label="SubmitButton"
          use="The one form/flow submit — label→spinner at a stable width"
          to="Components/Common/SubmitButton"
          toLabel="SubmitButton"
        >
          <SubmitButton>Save changes</SubmitButton>
        </Swatch>
        <Swatch
          label="ActionButton"
          use="A prominent surface CTA (Send / Receive)"
          to="Components/Common/ActionBar"
          toLabel="ActionBar"
        >
          <ActionButton>Send</ActionButton>
        </Swatch>
        <Swatch
          label="IconAction"
          use="Header / toolbar icon button (ghost, icon-sm)"
          review="These three are all ghost icon-sm buttons — collapse into one preset?"
          to="Components/Common/IconAction"
          toLabel="IconAction"
        >
          <IconAction aria-label="Add">
            <Plus />
          </IconAction>
        </Swatch>
        <Swatch label="CopyButton" use="Copy-to-clipboard affordance">
          <CopyButton text="0x1234…5678" />
        </Swatch>
        <Swatch label="ExplorerButton" use="Open a block explorer link">
          <ExplorerButton title="View on explorer" href="https://etherscan.io" />
        </Swatch>
        <Swatch
          label="SplitMenuButton"
          use="One action + alternate execution modes"
          to="Components/Common/SplitMenuButton"
          toLabel="SplitMenuButton"
        >
          <SplitMenuButton
            options={[
              { id: 'execute', label: 'Execute' },
              { id: 'role', label: 'Execute through role' },
            ]}
          />
        </Swatch>
      </Row>

      <Row label="Composite footers" note="the fixed dialog / onboarding footers — never hand-rolled">
        <Swatch
          label="DialogActions"
          use="Every dialog footer (Cancel + Confirm), CheckWallet-gated"
          to="Components/Common/DialogActions"
          toLabel="DialogActions"
        >
          <div className="w-72">
            <DialogActions confirmLabel="Confirm" onCancel={() => {}} />
          </div>
        </Swatch>
        <Swatch
          label="OnboardingFooter"
          use="Back / Continue for full-screen onboarding"
          to="Components/Common/OnboardingFooter"
          toLabel="OnboardingFooter"
        >
          <div className="w-80">
            <OnboardingFooter continueLabel="Continue" onBack={() => {}} onContinue={() => {}} />
          </div>
        </Swatch>
        <Swatch
          label="ChoiceButton"
          use="Card-like mutually-exclusive chooser row"
          review="A bespoke button, not built on Button — rebuild on the primitive or bless as an exception?"
          to="Components/Common/ChoiceButton"
          toLabel="ChoiceButton"
        >
          <div className="w-72">
            <ChoiceButton
              title="Send tokens"
              description="Transfer assets to another address"
              icon={ArrowUpRight}
              onClick={() => {}}
            />
          </div>
        </Swatch>
      </Row>

      <section>
        <h3 className="text-foreground mb-3 text-xs font-semibold tracking-wider uppercase">Aim for uniformity</h3>
        <ul className="text-muted-foreground flex list-disc flex-col gap-1 pl-5 text-sm">
          <li>
            <code>xs</code> (~6 uses) → prefer <code>sm</code>
          </li>
          <li>
            button <code>xl</code> (~3) → only via <code>OnboardingFooter</code>
          </li>
          <li>
            <code>icon-lg</code> (~1) → prefer <code>icon-sm</code>
          </li>
          <li>
            <code>link</code> &amp; <code>destructive-outline</code> (~2 each) → prefer <code>ghost</code> /{' '}
            <code>destructive</code> unless genuinely inline or bordered
          </li>
          <li>
            Reach for a <strong>preset</strong> before a raw <code>&lt;Button&gt;</code> so size + styling stay
            consistent.
          </li>
        </ul>
        <p className="mt-3 max-w-2xl rounded border border-dashed border-border bg-muted/50 px-2.5 py-1.5 text-xs leading-snug text-foreground">
          To review: this list still cites removed variants (link, destructive-outline, icon-lg, xs) — reconcile it with
          the current buttonVariants.
        </p>
      </section>

      <WhereUsed>
        <LinkGroup label="Pages">
          <StoryLink title="Pages/Core/Home">Dashboard</StoryLink>
          <StoryLink title="Pages/Core/Transactions/Queue">Tx queue</StoryLink>
          <StoryLink title="Pages/Onboarding/Welcome">Welcome</StoryLink>
        </LinkGroup>
        <LinkGroup label="Components">
          <StoryLink title="Components/Common/ActionCard">ActionCard</StoryLink>
          <StoryLink title="Features/SpendingLimits/CreateSpendingLimit">Spending-limit form</StoryLink>
        </LinkGroup>
        <LinkGroup label="Reference">
          <StoryLink title="UI/Button">Button</StoryLink>
          <StoryLink title="Components/Common/SubmitButton">SubmitButton</StoryLink>
          <StoryLink title="Components/Common/ActionBar">ActionBar</StoryLink>
          <StoryLink title="Components/Common/DialogActions">DialogActions</StoryLink>
          <StoryLink title="Components/Common/IconAction">IconAction</StoryLink>
        </LinkGroup>
      </WhereUsed>
    </Family>
  ),
}

/* =============================================================== TEXT FIELDS */

export const TextFields: Story = {
  render: () => (
    <Family
      title="Text fields"
      review={[
        'When to use which: NumberField for any numeric value (amounts, gas, nonce, threshold) — not a raw Input; AddressInput / AddressBookInput for addresses; TokenAmountInput for amount + token.',
        'AddressInput bypasses the DS Input (base-ui + its own CSS module) — consolidate onto the shared Input / InputGroup shell?',
        'The size note is stale: only default (h-9) and hero exist now — sm & lg are gone.',
        'Bless NumberField as the canonical numeric field, so numeric parsing is not re-implemented on a plain Input.',
      ]}
      lead={
        <>
          Text entry. Wrap fields in <code>Field</code> for a label, description and error; the input height comes from{' '}
          <code>inputSize</code> and mirrors selects so a field and a select on one row line up. Nearly every field uses
          the default height — only Safe creation reaches for the tall <code>hero</code>.
        </>
      }
    >
      <Row label="Labelled field" note="Field + Input + description">
        <div className="w-72">
          <Field>
            <FieldLabel>Safe name</FieldLabel>
            <Input placeholder="My Safe" />
            <FieldDescription>Only stored on this device.</FieldDescription>
          </Field>
        </div>
      </Row>

      <Row label="States">
        <Swatch label="placeholder">
          <div className="w-56">
            <Input placeholder="0x…" />
          </div>
        </Swatch>
        <Swatch label="value">
          <div className="w-56">
            <Input defaultValue="Safe main" />
          </div>
        </Swatch>
        <Swatch label="disabled">
          <div className="w-56">
            <Input defaultValue="Read only" disabled />
          </div>
        </Swatch>
        <Swatch label="error">
          <div className="w-72">
            <Field>
              <Input aria-invalid defaultValue="not-an-address" />
              <FieldError>Enter a valid address</FieldError>
            </Field>
          </div>
        </Swatch>
      </Row>

      <Row
        label="Sizes we use"
        note="default almost everywhere; hero is the tall Safe-creation / big-filter field (sm & lg exist but are rarely needed)"
      >
        <Swatch label="default · h-9" to="Pages/Core/Settings/Setup" toLabel="Settings">
          <div className="w-56">
            <Input placeholder="Recipient" />
          </div>
        </Swatch>
        <Swatch label="hero · h-[66px]" to="Pages/Onboarding/NewSafe/Create" toLabel="Create Safe">
          <div className="w-56">
            <Input inputSize="hero" variant="surface" placeholder="Safe name" />
          </div>
        </Swatch>
      </Row>

      <Row label="Skins" note="surface for muted/coloured surfaces">
        <Swatch label="default">
          <div className="w-52">
            <Input placeholder="default" />
          </div>
        </Swatch>
        <Swatch label="surface">
          <div className="w-52">
            <Input variant="surface" placeholder="surface" />
          </div>
        </Swatch>
      </Row>

      <Row label="Multi-line">
        <div className="w-72">
          <Textarea placeholder="Add a transaction note…" rows={3} />
        </div>
      </Row>

      <WhereUsed>
        <LinkGroup label="Pages">
          <StoryLink title="Pages/Onboarding/NewSafe/Create">Create Safe</StoryLink>
          <StoryLink title="Pages/Core/AddressBook">Address book</StoryLink>
          <StoryLink title="Pages/Core/Settings/Setup">Settings</StoryLink>
        </LinkGroup>
        <LinkGroup label="Components">
          <StoryLink title="Features/SpendingLimits/CreateSpendingLimit">Amount + token field</StoryLink>
        </LinkGroup>
        <LinkGroup label="Reference">
          <StoryLink title="UI/Input">Input</StoryLink>
          <StoryLink title="UI/Field">Field</StoryLink>
          <StoryLink title="UI/Textarea">Textarea</StoryLink>
          <StoryLink title="Components/Common/NameInput">NameInput</StoryLink>
        </LinkGroup>
      </WhereUsed>
    </Family>
  ),
}

/* ================================================================ DROPDOWNS */

export const Dropdowns: Story = {
  render: () => (
    <Family
      title="Dropdowns"
      review={[
        'When to use which: Select = pick one value from a short list; DropdownMenu = trigger an action from a menu; Combobox = type-to-filter a long/dynamic list; ContextMenu = right-click.',
        'context-menu.tsx has zero real consumers — every *ContextMenu we ship is actually a DropdownMenu. Adopt it or drop it (and rename the composites).',
        'Roughly seven near-identical row-overflow menus (SafeListContextMenu, MultiAccountContextMenu, MemberRowActionsMenu…) — one shared OverflowMenu?',
        'SafeListSortToggle and OrderByButton do the same job — unify into one sort control.',
        'This page shows only Select; DropdownMenu (~16 composites) and Combobox are not represented.',
      ]}
      lead={
        <>
          <code>Select</code> is the main value picker (currency, network, threshold…). Sizes mirror text fields so a
          select and an input on one row align.
        </>
      }
    >
      <Row label="Variants" note="default = the everyday select (almost all uses) · ghost = inline trigger">
        <Swatch label="default">
          <DemoSelect variant="default" />
        </Swatch>
        <Swatch label="ghost">
          <DemoSelect variant="ghost" />
        </Swatch>
      </Row>

      <Row
        label="Height"
        note="one height (min-h-9) — it grows to fit rich multi-line values like the token picker (no separate sm size)"
      >
        <Swatch label="default" to="Pages/Onboarding/NewSafe/AdvancedCreate" toLabel="Threshold / network">
          <DemoSelect />
        </Swatch>
        <Swatch label="grows for rich content" to="Pages/Core/Balances" toLabel="Currency select">
          <DemoTokenSelect />
        </Swatch>
      </Row>

      <Row label="States">
        <Swatch label="disabled">
          <Select defaultValue="1" items={{ '1': 'Mainnet' }} disabled>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Mainnet</SelectItem>
            </SelectContent>
          </Select>
        </Swatch>
        <Swatch label="error">
          <Select defaultValue="1" items={{ '1': 'Mainnet' }}>
            <SelectTrigger aria-invalid className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Mainnet</SelectItem>
            </SelectContent>
          </Select>
        </Swatch>
      </Row>

      <WhereUsed>
        <LinkGroup label="Pages">
          <StoryLink title="Pages/Core/Balances">Assets (currency)</StoryLink>
          <StoryLink title="Pages/Onboarding/NewSafe/AdvancedCreate">Advanced create</StoryLink>
        </LinkGroup>
        <LinkGroup label="Components">
          <StoryLink title="Components/TxFlow/ConfirmationViews/ChangeThreshold">Change threshold</StoryLink>
          <StoryLink title="Components/Balances/CurrencySelect">CurrencySelect</StoryLink>
        </LinkGroup>
        <LinkGroup label="Reference">
          <StoryLink title="UI/Select">Select</StoryLink>
          <StoryLink title="UI/Combobox">Combobox</StoryLink>
        </LinkGroup>
      </WhereUsed>
    </Family>
  ),
}

/* =================================================================== SEARCH */

export const Search: Story = {
  render: () => (
    <Family
      title="Search"
      review={[
        'When to use which: SearchInput / SearchField = the standard list-filter box; the topbar global search is a button that only looks like a field (it opens a modal).',
        'SearchField vs SearchInput identity is muddled — the swatch labelled "SearchField" actually renders SearchInput. Pick one canonical component.',
        'The topbar entry point hand-reimplements the field look — add a read-only / trigger variant so it stays in sync.',
        'Three controlled clones (SafeSearch, GlobalSearch, AddressBookSearchInput) — replace with one controlled SearchField?',
      ]}
      lead={
        <>
          <code>SearchField</code> is the standard app search box (address book, accounts, filters). It defaults to the
          <code> surface</code> skin and shares the input size scale.
        </>
      }
    >
      <Row label="Standard" note="SearchField — the default list filter">
        <Swatch label="default · SearchField" to="Pages/Core/AddressBook" toLabel="Address book">
          <div className="w-72">
            <SearchInput placeholder="Search" />
          </div>
        </Swatch>
      </Row>

      <Row label="Skins" note="surface (default) on lists · default on white/dialog">
        <Swatch label="surface">
          <div className="w-52">
            <SearchInput placeholder="Search" />
          </div>
        </Swatch>
        <Swatch label="default">
          <div className="w-52">
            <SearchInput variant="default" placeholder="Search" />
          </div>
        </Swatch>
      </Row>

      <WhereUsed>
        <LinkGroup label="Pages">
          <StoryLink title="Pages/Core/AddressBook">Address book</StoryLink>
          <StoryLink title="Pages/Onboarding/MyAccounts">My accounts</StoryLink>
          <StoryLink title="Pages/Apps">Safe Apps</StoryLink>
        </LinkGroup>
        <LinkGroup label="Reference">
          <StoryLink title="UI/SearchInput">SearchInput</StoryLink>
        </LinkGroup>
      </WhereUsed>
    </Family>
  ),
}

/* =================================================================== TABLES */

export const Tables: Story = {
  render: () => {
    const headCells = [
      { id: 'name', label: 'Name', width: '45%' },
      { id: 'role', label: 'Role', width: '30%' },
      { id: 'threshold', label: 'Threshold', width: '25%', disableSort: true },
    ]
    const rows = [
      {
        key: 'a',
        cells: {
          name: { content: 'alice.eth', rawValue: 'alice.eth' },
          role: { content: 'Owner', rawValue: 'Owner' },
          threshold: { content: '2 of 3', rawValue: '2' },
        },
      },
      {
        key: 'b',
        cells: {
          name: { content: 'bob.eth', rawValue: 'bob.eth' },
          role: { content: 'Owner', rawValue: 'Owner' },
          threshold: { content: '2 of 3', rawValue: '2' },
        },
      },
      {
        key: 'c',
        cells: {
          name: { content: 'carol.eth', rawValue: 'carol.eth' },
          role: { content: 'Proposer', rawValue: 'Proposer' },
          threshold: { content: '—', rawValue: '' },
        },
      },
    ]
    return (
      <Family
        title="Tables"
        lead={
          <>
            We don&apos;t hand-build raw <code>Table</code>s — you pick a table <em>type</em>. Below are the ones we
            ship. The open question for the review: the two generic grids (<code>EnhancedTable</code> and{' '}
            <code>PaginatedDataTable</code>) overlap — should they unify?
          </>
        }
      >
        <Row
          label="Default grid — EnhancedTable"
          note="shown in its card wrapper (TableCard), the way it renders in the app — sortable, paginated, sticky"
        >
          <Swatch
            label="TableCard › EnhancedTable"
            use="Untyped rows + headCells. ~9 consumers (AssetsTable, OwnerList, ProposersList, NestedSafesList…). Always wrapped in a card surface — never rendered bare."
            review="Is the newer PaginatedDataTable its successor? If yes, ~9 consumers need migrating; if no, draw a clear boundary — and their pagination differs, so pick one."
            to="Components/Common/EnhancedTable"
            toLabel="EnhancedTable"
          >
            <div className="w-full max-w-2xl rounded-lg bg-[var(--color-background-main)] p-6">
              <TableCard>
                <EnhancedTable headCells={headCells} rows={rows} />
              </TableCard>
            </div>
          </Swatch>
        </Row>

        <section>
          <h3 className="mb-1 text-xs font-semibold tracking-wider text-foreground uppercase">Which table for what</h3>
          <p className="mb-2 text-xs text-muted-foreground">
            the other types we ship — open each in its own story to see it live
          </p>
          <ul className="flex flex-col">
            <CatalogRow
              name="PaginatedDataTable"
              use="Newer typed-column grid (alignment, emphasis, sticky, responsive column drop). Powers the Spaces address book, members and requests."
              to="Features/Spaces/PaginatedDataTable"
              review="The generic-grid overlap with EnhancedTable is the main thing to resolve; its own note wants the bounded column variants promoted onto the ui/table primitive."
            />
            <CatalogRow
              name="SafeAccountsTable"
              use="My accounts / Workspaces — drag-reorder + multi-chain grouping + selection. Hand-assembled, not a generic grid."
              to="Features/MyAccounts/SafeAccountsTable"
            />
            <CatalogRow
              name="AssetsTable"
              use="Balances — desktop table, mobile cards."
              to="Components/Balances/AssetsTable"
            />
            <CatalogRow
              name="NftGrid"
              use="NFT collections."
              to="Features/Nfts/NftGrid"
              review="Borrows EnhancedTable's CSS module instead of the component — render through it, or promote shared cell styles onto the primitive?"
            />
            <CatalogRow
              name="DataTable"
              use="NOT a grid — a read-only key/value list used in tx confirmations (Bridge, Swap, Vault)."
              to="Components/Common/DataTable"
              review="Naming collision with PaginatedDataTable / DataTableColumn — rename it (DataList / SummaryList)?"
            />
            <CatalogRow
              name="TableCard"
              use="The card wrapper, not a table — the single source of truth for the 'table inside a card' look (bg-card, rounded, padded, in-card row polish). Address book, Spaces team & contacts wrap their grid in it."
              review="AssetsTable uses its own Card wrapper instead — should every grid go through TableCard so the surface is consistent?"
            />
          </ul>
        </section>

        <WhereUsed>
          <LinkGroup label="Pages">
            <StoryLink title="Pages/Core/AddressBook">Address book</StoryLink>
            <StoryLink title="Pages/Core/Balances">Assets</StoryLink>
          </LinkGroup>
          <LinkGroup label="Reference">
            <StoryLink title="UI/Table">Table (the shared shell — rarely used directly)</StoryLink>
          </LinkGroup>
        </WhereUsed>
      </Family>
    )
  },
}

/* ==================================================================== CARDS */

export const Cards: Story = {
  render: () => (
    <Family
      title="Cards"
      review={[
        'When to use which: raw Card for generic surfaces; SettingsCard for titled settings sections; TxCard for tx-flow steps.',
        'Five+ "cards" bypass the primitive with raw rounded divs (ActionCard, dashboard Card, WelcomeContentCard, GetStartedCard) — because the radius/elevation scale cannot express the real surfaces (rounded-2xl/3xl/md + shadows). Extend the scale?',
        'Severity cards are duplicated (ActionCard vs InfoWidget) — consolidate into one.',
        'After shadows/rings were removed, default has no border or elevation — should outlined be the effective default?',
      ]}
      lead={
        <>
          Surfaces that group content. Padding is the <code>size</code> prop, the surface is <code>variant</code> —{' '}
          <code>className</code> stays layout-only.
        </>
      }
    >
      <Row label="Variants" note="default · outlined · muted">
        <Swatch label="default">
          <Card className="w-64">
            <CardHeader>
              <CardTitle>Total balance</CardTitle>
              <CardDescription>Across all networks</CardDescription>
            </CardHeader>
            <CardContent>$142,204.19</CardContent>
          </Card>
        </Swatch>
        <Swatch label="outlined">
          <Card variant="outlined" className="w-64">
            <CardHeader>
              <CardTitle>Total balance</CardTitle>
              <CardDescription>Across all networks</CardDescription>
            </CardHeader>
            <CardContent>$142,204.19</CardContent>
          </Card>
        </Swatch>
        <Swatch label="muted">
          <Card variant="muted" className="w-64">
            <CardHeader>
              <CardTitle>Total balance</CardTitle>
              <CardDescription>Across all networks</CardDescription>
            </CardHeader>
            <CardContent>$142,204.19</CardContent>
          </Card>
        </Swatch>
      </Row>

      <Row label="With footer action">
        <Card variant="outlined" className="w-72">
          <CardHeader>
            <CardTitle>Add a signer</CardTitle>
            <CardDescription>Increase the security of your Safe.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button size="sm">Add signer</Button>
          </CardFooter>
        </Card>
      </Row>

      <WhereUsed>
        <LinkGroup label="Pages">
          <StoryLink title="Pages/Core/Home">Dashboard</StoryLink>
        </LinkGroup>
        <LinkGroup label="Components">
          <StoryLink title="Components/Common/ActionCard">ActionCard</StoryLink>
          <StoryLink title="Features/Recovery/RecoveryProposalCard">Recovery card</StoryLink>
        </LinkGroup>
        <LinkGroup label="Reference">
          <StoryLink title="UI/Card">Card</StoryLink>
        </LinkGroup>
      </WhereUsed>
    </Family>
  ),
}

/* ===================================================================== TABS */

export const Tabs_: Story = {
  render: () => (
    <Family
      title="Tabs"
      review={[
        'When to use which: underline·brand = top-level page nav (NavTabs); underline·neutral = in-content sub-tabs; toggle = pill switches (lg = welcome switch, default = compact drawer).',
        'The variant × tone × size API collapses to just four looks — flatten to a single 4-value enum so invalid combinations cannot be expressed?',
        'TabsList defaults to toggle (used only by the SecurityHub drawer) though underline nav is the common case — should the default be underline?',
        'Public names (underline/toggle) diverge from the internal data-variant (nav/line/segmented) — pick one shared vocabulary.',
      ]}
      lead={
        <>
          Switch between views. Two families: <code>underline</code> (page nav &amp; in-content) and <code>toggle</code>{' '}
          (compact &amp; large switches). Each treatment below is one of those two.
        </>
      }
    >
      <Row label="underline · tone=brand" note="bold page navigation (NavTabs) — Assets / Settings / Transactions">
        <Tabs defaultValue="a">
          <TabsList variant="underline" tone="brand">
            <TabsTrigger value="a">Home</TabsTrigger>
            <TabsTrigger value="b">Assets</TabsTrigger>
            <TabsTrigger value="c">Transactions</TabsTrigger>
          </TabsList>
        </Tabs>
        <StoryLink title="Pages/Core/Balances">Assets header</StoryLink>
      </Row>

      <Row label="underline (neutral)" note="lighter in-content tabs — Spaces address book & members">
        <Tabs defaultValue="a">
          <TabsList variant="underline">
            <TabsTrigger value="a">Contacts</TabsTrigger>
            <TabsTrigger value="b">Pending</TabsTrigger>
          </TabsList>
        </Tabs>
        <StoryLink title="Pages/Spaces/AddressBook">Address book</StoryLink>
        <StoryLink title="Pages/Spaces/Members">Members</StoryLink>
      </Row>

      <Row label="toggle · size=lg" note="large pill toggle — the Accounts / Workspaces switch (AccountsNavigation)">
        <Tabs defaultValue="a">
          <TabsList variant="toggle" size="lg">
            <TabsTrigger value="a">Accounts</TabsTrigger>
            <TabsTrigger value="b">Workspaces</TabsTrigger>
          </TabsList>
        </Tabs>
        <StoryLink title="Pages/Onboarding/MyAccounts">My accounts</StoryLink>
      </Row>

      <Row label="toggle (default)" note="compact pill toggle on a muted track — SecurityHub report drawer">
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Overview</TabsTrigger>
            <TabsTrigger value="b">Details</TabsTrigger>
          </TabsList>
        </Tabs>
      </Row>

      <WhereUsed>
        <LinkGroup label="Reference">
          <StoryLink title="UI/Tabs">Tabs</StoryLink>
        </LinkGroup>
      </WhereUsed>
    </Family>
  ),
}

/* =================================================================== DIALOG */

export const Dialog_: Story = {
  render: () => (
    <Family
      title="Dialog"
      review={[
        'When to use which: ModalDialog = the default app modal (titled header, ~39 screens); AlertDialog = blocking, must-answer confirmations; raw Dialog = bespoke composition only.',
        'sm means opposite sizes in Dialog vs AlertDialog — align the size scale.',
        'Three different backdrops (Dialog, AlertDialog, TxModalDialog) — pick one canonical scrim.',
        'The example below hand-builds its footer, but the lead prescribes DialogActions — make the reference follow it.',
      ]}
      lead={
        <>
          Modal for focused tasks and confirmations. The footer pairs a <code>Cancel</code> (outline) with the primary
          or destructive confirm — use the <code>DialogActions</code> preset so every dialog footer matches.
        </>
      }
    >
      <Row label="Confirmation dialog" note="shown open">
        <Dialog defaultOpen>
          <DialogTrigger render={<Button variant="outline">Open dialog</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove signer?</DialogTitle>
              <DialogDescription>
                This queues a transaction that must be signed by the threshold before it takes effect.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <DialogClose render={<Button variant="destructive">Remove</Button>} />
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Row>

      <WhereUsed>
        <LinkGroup label="Flows">
          <StoryLink title="Pages/Core/Transactions/Queue">Tx queue</StoryLink>
          <StoryLink title="Features/SpendingLimits/RemoveSpendingLimitReview">Remove spending limit</StoryLink>
        </LinkGroup>
        <LinkGroup label="Reference">
          <StoryLink title="UI/Dialog">Dialog</StoryLink>
          <StoryLink title="Components/Common/DialogActions">DialogActions</StoryLink>
        </LinkGroup>
      </WhereUsed>
    </Family>
  ),
}

/* ================================================================== TOOLTIP */

export const Tooltip_: Story = {
  render: () => (
    <Family
      title="Tooltip"
      lead="Short, on-hover helper text for icons and truncated values."
      review={[
        'When to use which: Tooltip = plain hover bubble; InfoTooltip = the (i)-icon explanation; CopyTooltip = click-to-copy feedback; OnboardingTooltip = first-run hint.',
        'Three near-identical info-icon tooltips (InfoTooltip, HelpIconTooltip, HelpTooltip) — consolidate on InfoTooltip.',
        'CustomTooltip has no app consumers (dead code) — remove it, or bless it as the sanctioned light tooltip.',
        'Two default surfaces (dark bubble vs light) exist with no rule — pick the canonical one.',
      ]}
    >
      <Row label="Positions" note="shown open">
        <div className="flex min-h-28 flex-wrap items-center gap-12 pt-8">
          <Tooltip open>
            <TooltipTrigger render={<Button variant="outline">Top</Button>} />
            <TooltipContent side="top">
              <p>Copy address</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip open>
            <TooltipTrigger render={<Button variant="outline">Right</Button>} />
            <TooltipContent side="right">
              <p>Copy address</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip open>
            <TooltipTrigger render={<Button variant="outline">Bottom</Button>} />
            <TooltipContent side="bottom">
              <p>Copy address</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </Row>

      <WhereUsed>
        <LinkGroup label="Components">
          <StoryLink title="Features/Batching/BatchTooltip">Batch tooltip</StoryLink>
        </LinkGroup>
        <LinkGroup label="Reference">
          <StoryLink title="UI/Tooltip">Tooltip</StoryLink>
        </LinkGroup>
      </WhereUsed>
    </Family>
  ),
}
