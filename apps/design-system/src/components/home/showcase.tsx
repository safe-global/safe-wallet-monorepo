'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, CalendarClock, FileCode2, Repeat, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@safe-global/ui/primitives/alert'
import { Avatar, AvatarFallback, AvatarGroup } from '@safe-global/ui/primitives/avatar'
import { Badge, BadgeDot } from '@safe-global/ui/primitives/badge'
import { Button } from '@safe-global/ui/primitives/button'
import { Calendar } from '@safe-global/ui/primitives/calendar'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@safe-global/ui/primitives/card'
import { Checkbox } from '@safe-global/ui/primitives/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@safe-global/ui/primitives/dialog'
import { Field, FieldDescription, FieldLabel } from '@safe-global/ui/primitives/field'
import { Input } from '@safe-global/ui/primitives/input'
import { Label } from '@safe-global/ui/primitives/label'
import { Progress } from '@safe-global/ui/primitives/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@safe-global/ui/primitives/select'
import { Separator } from '@safe-global/ui/primitives/separator'
import { Switch } from '@safe-global/ui/primitives/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@safe-global/ui/primitives/tabs'
import { Toggle } from '@safe-global/ui/primitives/toggle'
import { Code } from '../site/code'

const TOKENS = { eth: 'ETH', usdc: 'USDC', safe: 'SAFE' }
const NETWORKS = { mainnet: 'Ethereum', base: 'Base', gnosis: 'Gnosis Chain' }

function SendTokensCard() {
  return (
    <Card variant="outlined" data-showcase="send-tokens">
      <CardHeader>
        <CardTitle>Send tokens</CardTitle>
        <CardDescription>Create a transaction for your signers to approve.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="showcase-recipient">Recipient</FieldLabel>
            <Input id="showcase-recipient" placeholder="0x… or ENS name" defaultValue="vitalik.eth" />
          </Field>
          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <Field>
              <FieldLabel htmlFor="showcase-amount">Amount</FieldLabel>
              <Input id="showcase-amount" inputMode="decimal" defaultValue="1,250.00" />
            </Field>
            <Select defaultValue="usdc" items={TOKENS}>
              <SelectTrigger aria-label="Token" className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TOKENS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Field>
            <FieldLabel>Network</FieldLabel>
            <Select defaultValue="mainnet" items={NETWORKS}>
              <SelectTrigger aria-label="Network" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NETWORKS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>Balance: 8,420.19 USDC</FieldDescription>
          </Field>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch">
        <span className="brand flex flex-col">
          <Button>Review transaction</Button>
        </span>
        <span className="mt-2 text-center text-xs text-muted-foreground">Needs 2 of 3 signatures to execute</span>
      </CardFooter>
    </Card>
  )
}

const SIGNERS = [
  { initials: 'AL', name: 'Alice', address: '0x8f3c…a21e', signed: true },
  { initials: 'BO', name: 'Bob', address: '0x4b1d…77c0', signed: true },
  { initials: 'CA', name: 'Carol', address: '0xd92e…03f9', signed: false },
]

function SignersCard() {
  return (
    <Card variant="outlined" data-showcase="signers">
      <CardHeader>
        <CardTitle>Signers</CardTitle>
        <CardDescription>Send 1,250 USDC to vitalik.eth</CardDescription>
        <CardAction>
          <Badge variant="success">2 of 3</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <AvatarGroup>
              {SIGNERS.map((signer) => (
                <Avatar key={signer.initials} size="sm">
                  <AvatarFallback>{signer.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
            <span className="text-sm text-muted-foreground">Threshold reached</span>
          </div>
          <Progress value={66} aria-label="Confirmations" />
          <ul className="flex flex-col gap-3">
            {SIGNERS.map((signer) => (
              <li key={signer.initials} className="flex items-center gap-3">
                <Avatar size="sm">
                  <AvatarFallback>{signer.initials}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{signer.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{signer.address}</span>
                </div>
                <Badge variant={signer.signed ? 'positive' : 'subtle'} size="sm">
                  {signer.signed ? 'Signed' : 'Waiting'}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full gap-2">
          <Button variant="outline" className="flex-1">
            Reject
          </Button>
          <span className="brand flex flex-1 flex-col">
            <Button>Execute</Button>
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}

const QUEUE = [
  {
    icon: ArrowUpRight,
    title: 'Send 1,250 USDC',
    meta: 'to vitalik.eth · nonce 42',
    status: '2/3',
    variant: 'warning',
  },
  { icon: Repeat, title: 'Swap 2 ETH for SAFE', meta: 'CoW Swap · nonce 43', status: '1/3', variant: 'warning' },
  { icon: FileCode2, title: 'Add signer', meta: 'Settings change · nonce 44', status: '0/3', variant: 'subtle' },
  { icon: ArrowDownLeft, title: 'Received 0.5 ETH', meta: 'from 0x71c7…976f', status: 'Done', variant: 'success' },
] as const

function TransactionsCard() {
  return (
    <Card variant="outlined" data-showcase="transactions">
      <CardHeader>
        <CardTitle>Pending transactions</CardTitle>
        <CardDescription>Queued on Ethereum</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            View all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col">
          {QUEUE.map((tx, index) => (
            <li key={tx.title}>
              {index > 0 ? <Separator /> : null}
              <div className="flex items-center gap-3 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
                  <tx.icon className="size-4" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{tx.title}</span>
                  <span className="truncate text-xs text-muted-foreground">{tx.meta}</span>
                </div>
                <Badge variant={tx.variant} size="sm">
                  {tx.status}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

const ACTIVITY = {
  '7d': [38, 52, 44, 70, 58, 82, 64],
  '30d': [24, 30, 42, 36, 48, 40, 56, 62, 50, 68, 74, 60, 78, 86, 72, 90],
}

function ActivityCard() {
  const [range, setRange] = useState<keyof typeof ACTIVITY>('7d')
  const bars = ACTIVITY[range]
  return (
    <Card variant="outlined" data-showcase="activity">
      <CardHeader>
        <CardDescription>Total balance</CardDescription>
        <CardTitle className="text-3xl tabular-nums">$48,210.55</CardTitle>
        <CardAction>
          <div className="flex gap-1">
            {(Object.keys(ACTIVITY) as Array<keyof typeof ACTIVITY>).map((key) => (
              <Toggle key={key} size="sm" pressed={range === key} onPressedChange={() => setRange(key)}>
                {key}
              </Toggle>
            ))}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <span className="text-sm text-accent-success">+12.4% this month</span>
          <div className="flex h-36 items-end gap-1.5" role="img" aria-label={`Activity over ${range}`}>
            {bars.map((value, index) => (
              <div
                key={index}
                className="flex-1 rounded-t-sm bg-muted transition-all last:bg-brand"
                style={{ height: `${value}%` }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SettingsCard() {
  return (
    <Card variant="outlined" data-showcase="settings">
      <CardHeader>
        <CardTitle>Safe settings</CardTitle>
        <CardDescription>Manage how your Safe account behaves.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="security">
          <TabsList variant="underline">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="flex flex-col gap-4 pt-4">
            <Field>
              <FieldLabel htmlFor="showcase-name">Safe name</FieldLabel>
              <Input id="showcase-name" defaultValue="Treasury" />
            </Field>
          </TabsContent>
          <TabsContent value="security" className="flex flex-col gap-4 pt-4">
            {[
              ['showcase-guard', 'Transaction guard', 'Block calls to unverified contracts', true],
              ['showcase-limit', 'Spending limits', 'Let signers send small amounts alone', false],
              ['showcase-recovery', 'Recovery module', 'Recover access after a 30 day delay', true],
            ].map(([id, title, description, on]) => (
              <div key={id as string} className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <Label id={`${id}-label`} htmlFor={id as string}>
                    {title as string}
                  </Label>
                  <span className="text-xs text-muted-foreground">{description as string}</span>
                </div>
                <Switch id={id as string} defaultChecked={on as boolean} aria-labelledby={`${id}-label`} />
              </div>
            ))}
          </TabsContent>
          <TabsContent value="alerts" className="flex flex-col gap-3 pt-4">
            {['New transaction queued', 'Transaction executed', 'Signer added or removed'].map((label, index) => (
              <div key={label} className="flex items-center gap-2">
                <Checkbox
                  id={`showcase-alert-${index}`}
                  defaultChecked={index !== 2}
                  aria-labelledby={`showcase-alert-${index}-label`}
                />
                <Label id={`showcase-alert-${index}-label`} htmlFor={`showcase-alert-${index}`}>
                  {label}
                </Label>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function ControlsCard() {
  return (
    <Card variant="outlined" data-showcase="controls">
      <CardHeader>
        <CardTitle>Building blocks</CardTitle>
        <CardDescription>Variants and sizes come from props, not class names.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">
              Secondary
            </Button>
            <Button size="sm" variant="outline">
              Outline
            </Button>
            <Button size="sm" variant="ghost">
              Ghost
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">
              <BadgeDot />
              Executed
            </Badge>
            <Badge variant="warning">Needs signatures</Badge>
            <Badge variant="destructive">Failed</Badge>
            <Badge variant="info">Simulated</Badge>
            <Badge variant="outline">Nonce 42</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch id="showcase-hide-small" defaultChecked aria-labelledby="showcase-hide-small-label" />
              <Label id="showcase-hide-small-label" htmlFor="showcase-hide-small">
                Hide small balances
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="showcase-trusted" defaultChecked aria-labelledby="showcase-trusted-label" />
              <Label id="showcase-trusted-label" htmlFor="showcase-trusted">
                Trusted only
              </Label>
            </div>
          </div>
          <div className="flex gap-1" role="group" aria-label="View">
            {['Tokens', 'NFTs', 'Positions'].map((label, index) => (
              <Toggle key={label} variant="outline" size="sm" defaultPressed={index === 0}>
                {label}
              </Toggle>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ReviewCard() {
  return (
    <Card variant="outlined" data-showcase="review">
      <CardHeader>
        <CardTitle>Review before signing</CardTitle>
        <CardDescription>Simulation found one thing to check.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Alert variant="warning">
            <TriangleAlert />
            <AlertTitle>Unverified contract</AlertTitle>
            <AlertDescription>This interaction calls a contract without verified source code.</AlertDescription>
          </Alert>
          <Dialog>
            <DialogTrigger render={<Button variant="outline">Open signing dialog</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm transaction</DialogTitle>
                <DialogDescription>You are the second of three signers. Executing sends 1,250 USDC.</DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4" aria-hidden />
                Simulation passed on Ethereum
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline">Cancel</Button>} />
                <span className="brand inline-flex">
                  <DialogClose render={<Button>Sign and execute</Button>} />
                </span>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

const INSTALL = {
  registry: 'npx shadcn@latest add @safe/button',
  npm: "npm install @safe-global/ui\n\nimport { Button } from '@safe-global/ui/primitives/button'",
}

function InstallCard() {
  return (
    <Card variant="outlined" data-showcase="install">
      <CardHeader>
        <CardTitle>Add it to your app</CardTitle>
        <CardDescription>Copy the source with the shadcn CLI, or import the package.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="registry">
          <TabsList variant="underline">
            <TabsTrigger value="registry">shadcn registry</TabsTrigger>
            <TabsTrigger value="npm">npm package</TabsTrigger>
          </TabsList>
          {(Object.keys(INSTALL) as Array<keyof typeof INSTALL>).map((key) => (
            <TabsContent key={key} value={key}>
              <Code code={INSTALL[key]} lang={key === 'npm' ? 'tsx' : 'bash'} className="my-3" />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

const DEFAULT_MONTH = new Date(2026, 10, 1)

function ScheduleCard() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 10, 18))
  return (
    <Card variant="outlined" data-showcase="schedule">
      <CardHeader>
        <CardTitle>Schedule a recovery check</CardTitle>
        <CardDescription>
          <CalendarClock className="me-1.5 inline size-3.5 align-[-2px]" aria-hidden />
          {date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pick a date'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Calendar mode="single" defaultMonth={DEFAULT_MONTH} selected={date} onSelect={setDate} />
      </CardContent>
    </Card>
  )
}

export function Showcase() {
  return (
    <section
      className="mx-auto w-full max-w-(--site-max-width) px-4 pb-24 lg:px-6"
      aria-label="Component showcase"
      data-showcase-grid
    >
      <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
        <SendTokensCard />
        <ActivityCard />
        <InstallCard />
        <SignersCard />
        <ControlsCard />
        <TransactionsCard />
        <ScheduleCard />
        <SettingsCard />
        <ReviewCard />
      </div>
    </section>
  )
}
