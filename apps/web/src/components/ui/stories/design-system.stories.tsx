import type { Meta, StoryObj } from '@storybook/react'
import type { ReactNode } from 'react'
import { Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

import { Button } from '../button'
import { Input } from '../input'
import { Textarea } from '../textarea'
import { Field, FieldLabel, FieldDescription, FieldError } from '../field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select'
import { SearchInput } from '../search-input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table'
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
import { linkTo } from '@storybook/addon-links'
import SubmitButton from '@/components/common/SubmitButton'
import { ActionButton } from '@/components/common/ActionBar'
import IconAction from '@/components/common/IconAction'
import ChoiceButton from '@/components/common/ChoiceButton'
import SplitMenuButton from '@/components/common/SplitMenuButton'
import DialogActions from '@/components/common/DialogActions'
import OnboardingFooter from '@/components/common/OnboardingFooter'

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

const Family = ({ title, lead, children }: { title: string; lead?: ReactNode; children: ReactNode }) => (
  <div className="flex max-w-5xl flex-col gap-12">
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {lead ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{lead}</p> : null}
    </div>
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
  to,
  toLabel,
  children,
}: {
  label?: string
  to?: string
  toLabel?: string
  children: ReactNode
}) => (
  <div className="flex flex-col items-start gap-2">
    <div className="flex min-h-9 items-center">{children}</div>
    {label ? <span className="font-mono text-[11px] leading-none text-muted-foreground">{label}</span> : null}
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
  </div>
)

const DemoSelect = ({ variant, size }: { variant?: 'default' | 'surface' | 'ghost'; size?: 'sm' | 'default' }) => (
  <Select defaultValue="1" items={{ '1': 'Mainnet', '2': 'Base', '3': 'Arbitrum' }}>
    <SelectTrigger variant={variant} size={size} className="w-40">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="1">Mainnet</SelectItem>
      <SelectItem value="2">Base</SelectItem>
      <SelectItem value="3">Arbitrum</SelectItem>
    </SelectContent>
  </Select>
)

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
          uniformity: reach for these, and migrate one-off sizes/variants toward the common ones (see the bottom).
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
          <Button>Add funds</Button>
        </Swatch>
        <Swatch label="outline · action" to="Pages/Core/Transactions/History" toLabel="Transactions">
          <Button variant="outline" size="action">
            Export
          </Button>
        </Swatch>
        <Swatch label="default · sm" to="Pages/Spaces/Settings" toLabel="Space settings">
          <Button size="sm">Save</Button>
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
        <Swatch label="lg · h-10" to="Pages/Onboarding/NewSafe/Create" toLabel="Create Safe">
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
        <Swatch label="SubmitButton" to="Components/Common/SubmitButton" toLabel="SubmitButton">
          <SubmitButton>Save changes</SubmitButton>
        </Swatch>
        <Swatch label="ActionButton" to="Components/Common/ActionBar" toLabel="ActionBar">
          <ActionButton>Send</ActionButton>
        </Swatch>
        <Swatch label="IconAction" to="Components/Common/IconAction" toLabel="IconAction">
          <IconAction aria-label="Add">
            <Plus />
          </IconAction>
        </Swatch>
        <Swatch label="SplitMenuButton" to="Components/Common/SplitMenuButton" toLabel="SplitMenuButton">
          <SplitMenuButton
            options={[
              { id: 'execute', label: 'Execute' },
              { id: 'role', label: 'Execute through role' },
            ]}
          />
        </Swatch>
      </Row>

      <Row label="Composite footers" note="the fixed dialog / onboarding footers — never hand-rolled">
        <Swatch label="DialogActions" to="Components/Common/DialogActions" toLabel="DialogActions">
          <div className="w-72">
            <DialogActions confirmLabel="Confirm" onCancel={() => {}} />
          </div>
        </Swatch>
        <Swatch label="OnboardingFooter" to="Components/Common/OnboardingFooter" toLabel="OnboardingFooter">
          <div className="w-80">
            <OnboardingFooter continueLabel="Continue" onBack={() => {}} onContinue={() => {}} />
          </div>
        </Swatch>
        <Swatch label="ChoiceButton" to="Components/Common/ChoiceButton" toLabel="ChoiceButton">
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
      lead={
        <>
          <code>Select</code> is the main value picker (currency, network, threshold…). Sizes mirror text fields so a
          select and an input on one row align.
        </>
      }
    >
      <Row
        label="Variants"
        note="default = the everyday select (almost all uses) · surface = filter/toolbar · ghost = inline trigger"
      >
        <Swatch label="default">
          <DemoSelect variant="default" />
        </Swatch>
        <Swatch label="surface">
          <DemoSelect variant="surface" />
        </Swatch>
        <Swatch label="ghost">
          <DemoSelect variant="ghost" />
        </Swatch>
      </Row>

      <Row label="Sizes we use" note="default is the standard; sm only for the compact currency selector">
        <Swatch label="default · h-9" to="Pages/Onboarding/NewSafe/AdvancedCreate" toLabel="Threshold / network">
          <DemoSelect size="default" />
        </Swatch>
        <Swatch label="sm · h-8" to="Pages/Core/Balances" toLabel="Currency select">
          <DemoSelect size="sm" />
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
  render: () => (
    <Family
      title="Tables"
      lead={
        <>
          <code>EnhancedTable</code> is the app&apos;s default data grid (sorting, pagination, sticky columns) —
          it&apos;s built on this <code>Table</code> primitive. Rows highlight on hover and when selected.
        </>
      }
    >
      <Row label="Data table">
        <div className="w-full max-w-xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Threshold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>alice.eth</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>2 of 3</TableCell>
              </TableRow>
              <TableRow data-state="selected">
                <TableCell>bob.eth</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>2 of 3</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>carol.eth</TableCell>
                <TableCell>Proposer</TableCell>
                <TableCell>—</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Row>

      <WhereUsed>
        <LinkGroup label="Pages">
          <StoryLink title="Pages/Core/AddressBook">Address book</StoryLink>
          <StoryLink title="Pages/Core/Balances">Assets</StoryLink>
        </LinkGroup>
        <LinkGroup label="Components">
          <StoryLink title="Components/Balances/AssetsTable">AssetsTable</StoryLink>
          <StoryLink title="Components/Settings/OwnerList">OwnerList</StoryLink>
          <StoryLink title="Features/Proposers/ProposersList">ProposersList</StoryLink>
        </LinkGroup>
        <LinkGroup label="Reference">
          <StoryLink title="UI/Table">Table</StoryLink>
          <StoryLink title="Components/Common/EnhancedTable">EnhancedTable</StoryLink>
        </LinkGroup>
      </WhereUsed>
    </Family>
  ),
}

/* ==================================================================== CARDS */

export const Cards: Story = {
  render: () => (
    <Family
      title="Cards"
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
      lead={
        <>
          Switch between views. All four <code>variant</code>s are in use — each in a specific place, linked below.
        </>
      }
    >
      <Row label="nav" note="page navigation (NavTabs) — Assets / Settings / Transactions headers">
        <Tabs defaultValue="a">
          <TabsList variant="nav">
            <TabsTrigger value="a">Home</TabsTrigger>
            <TabsTrigger value="b">Assets</TabsTrigger>
            <TabsTrigger value="c">Transactions</TabsTrigger>
          </TabsList>
        </Tabs>
        <StoryLink title="Pages/Core/Balances">Assets header</StoryLink>
      </Row>

      <Row label="segmented" note="large pill toggle — the Accounts / Workspaces switch (AccountsNavigation)">
        <Tabs defaultValue="a">
          <TabsList variant="segmented">
            <TabsTrigger value="a">Accounts</TabsTrigger>
            <TabsTrigger value="b">Workspaces</TabsTrigger>
          </TabsList>
        </Tabs>
        <StoryLink title="Pages/Onboarding/MyAccounts">My accounts</StoryLink>
      </Row>

      <Row label="line" note="underlined content tabs — Spaces address book & members">
        <Tabs defaultValue="a">
          <TabsList variant="line">
            <TabsTrigger value="a">Contacts</TabsTrigger>
            <TabsTrigger value="b">Pending</TabsTrigger>
          </TabsList>
        </Tabs>
        <StoryLink title="Pages/Spaces/AddressBook">Address book</StoryLink>
        <StoryLink title="Pages/Spaces/Members">Members</StoryLink>
      </Row>

      <Row label="default" note="boxed toggle on a muted track — SecurityHub report drawer (least used)">
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
    <Family title="Tooltip" lead="Short, on-hover helper text for icons and truncated values.">
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
