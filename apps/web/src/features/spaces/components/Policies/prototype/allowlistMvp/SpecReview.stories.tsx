import type { ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import { Badge, BadgeDot } from '@safe-global/views/components/ui/badge'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import specScreens from './specScreens.json'
import { CANVAS_PARAM } from './GuardSetupFlow.stories'

type Status = 'designed' | 'update' | 'missing' | 'confirm' | 'skipped'

type SpecScreen = {
  title: string
  status: string
  /** A frame of the full prototype: an All states canvas id, or `jump:<Jump to label>`. */
  frame?: string
  /** Another story to show instead, by its Storybook id. */
  story?: string
  ref: string
  spec: string
  notes: string[]
}

type SpecColumn = { number: number; name: string; screens: SpecScreen[] }

const COLUMNS: SpecColumn[] = specScreens.columns

const FULL_FLOW_STORY = 'prototype-allowlist-mvp--policies-m-2-full-flow'

const STATUSES: Record<Status, { label: string; variant: 'success' | 'warning' | 'destructive' | 'subtle' }> = {
  designed: { label: 'Designed', variant: 'success' },
  update: { label: 'Needs updating', variant: 'warning' },
  missing: { label: 'Missing', variant: 'destructive' },
  confirm: { label: 'To confirm', variant: 'subtle' },
  skipped: { label: 'Skipped', variant: 'subtle' },
}

const toStatus = (status: string): Status => (status in STATUSES ? (status as Status) : 'missing')

const getFrameUrl = ({ frame, story }: SpecScreen): string | undefined => {
  if (story) return `iframe.html?id=${story}&viewMode=story`
  if (frame) return `iframe.html?id=${FULL_FLOW_STORY}&viewMode=story&${CANVAS_PARAM}=${encodeURIComponent(frame)}`
  return undefined
}

// The prototype is drawn at desktop size and shown at half scale.
const FRAME_WIDTH = 1440
const FRAME_HEIGHT = 900
const FRAME_SCALE = 0.5

const ScreenFrame = ({ url, status, title }: { url: string; status: Status; title: string }): ReactElement => (
  <div
    className={cn(
      'relative shrink-0 overflow-hidden rounded-lg border bg-card',
      status === 'update' ? 'border-2 border-yellow-400' : 'border-border',
    )}
    style={{ width: FRAME_WIDTH * FRAME_SCALE, height: FRAME_HEIGHT * FRAME_SCALE }}
  >
    <iframe
      src={url}
      title={title}
      loading="lazy"
      className="absolute top-0 left-0 origin-top-left border-0"
      style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT, transform: `scale(${FRAME_SCALE})` }}
    />
  </div>
)

const Placeholder = ({ number, screen }: { number: string; screen: SpecScreen }): ReactElement => {
  const isConfirm = ['confirm', 'skipped'].includes(toStatus(screen.status))
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col justify-center gap-3 rounded-lg border-2 border-dashed p-8',
        isConfirm ? 'border-border bg-muted' : 'border-red-400 bg-red-50 dark:bg-red-950/30',
      )}
      style={{ width: FRAME_WIDTH * FRAME_SCALE, height: FRAME_HEIGHT * FRAME_SCALE }}
    >
      <span
        className={cn(
          'font-mono text-sm font-semibold tracking-wide uppercase',
          isConfirm ? 'text-muted-foreground' : 'text-destructive',
        )}
      >
        {number} · {isConfirm ? STATUSES[toStatus(screen.status)].label : 'Missing screen'}
      </span>
      <Typography variant="h4">{screen.title}</Typography>
      <Typography variant="paragraph" color="muted" className="max-w-md">
        {screen.spec}
      </Typography>
    </div>
  )
}

const ScreenRow = ({ number, screen }: { number: string; screen: SpecScreen }): ReactElement => {
  const status = toStatus(screen.status)
  const url = getFrameUrl(screen)
  const { label, variant } = STATUSES[status]

  return (
    <section id={`screen-${number}`} className="flex flex-wrap items-start gap-6 border-t border-border py-8">
      {url && status !== 'missing' ? (
        <ScreenFrame url={url} status={status} title={`${number} ${screen.title}`} />
      ) : (
        <Placeholder number={number} screen={screen} />
      )}

      <div className="flex w-[380px] min-w-0 flex-col gap-4">
        <div className="flex flex-col items-start gap-2">
          <span className="font-mono text-2xl font-semibold">{number}</span>
          <Typography variant="h4">{screen.title}</Typography>
          <Badge variant={variant} size="status" shape="status">
            <BadgeDot />
            {label}
          </Badge>
        </div>

        <div className="flex flex-col gap-1">
          <Typography variant="paragraph-mini-medium" color="muted" className="uppercase">
            Spec · {screen.ref}
          </Typography>
          <Typography variant="paragraph-small">{screen.spec}</Typography>
        </div>

        {screen.notes.length > 0 && (
          <div className="flex flex-col gap-1">
            <Typography variant="paragraph-mini-medium" color="muted" className="uppercase">
              {status === 'designed' ? 'Notes' : 'To do'}
            </Typography>
            <ul
              className={cn(
                'flex list-disc flex-col gap-1 pl-5 text-sm',
                status === 'update' && 'text-warning-strong',
                status === 'missing' && 'text-destructive',
              )}
            >
              {screen.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {url && status !== 'missing' && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm underline underline-offset-2"
          >
            Open full size
            <ExternalLinkIcon className="size-3.5" aria-hidden />
          </a>
        )}
      </div>
    </section>
  )
}

const ColumnReview = ({ column }: { column: number }): ReactElement | null => {
  const current = COLUMNS.find(({ number }) => number === column)
  if (!current) return null
  const counts = current.screens.reduce<Record<Status, number>>(
    (total, { status }) => ({ ...total, [toStatus(status)]: total[toStatus(status)] + 1 }),
    { designed: 0, update: 0, missing: 0, confirm: 0, skipped: 0 },
  )

  return (
    <div className="min-h-screen bg-background p-10 text-foreground">
      <header className="flex flex-col gap-3 pb-4">
        <Typography variant="paragraph-small" color="muted">
          Spec review · {specScreens.spec}
        </Typography>
        <Typography variant="h2">
          {current.number} · {current.name}
        </Typography>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUSES) as Status[])
            .filter((status) => counts[status] > 0)
            .map((status) => (
              <Badge key={status} variant={STATUSES[status].variant} size="status" shape="status">
                <BadgeDot />
                {STATUSES[status].label} · {counts[status]}
              </Badge>
            ))}
        </div>
      </header>
      {current.screens.map((screen, index) => (
        <ScreenRow key={screen.title} number={`${current.number}.${index + 1}`} screen={screen} />
      ))}
    </div>
  )
}

const meta = {
  title: 'Prototype/Policy engine/Allowlist MVP · final design 2026/Spec review by column',
  id: 'prototype-allowlist-mvp-spec-review',
  component: ColumnReview,
  parameters: { layout: 'fullscreen' },
  argTypes: { column: { table: { disable: true } } },
} satisfies Meta<typeof ColumnReview>

export default meta
type Story = StoryObj<typeof meta>

export const BeforeSetup: Story = { name: '1 · Before setup', args: { column: 1 } }
export const SetUp: Story = { name: '2 · Set up', args: { column: 2 } }
export const SignAndActivate: Story = { name: '3 · Sign and activate', args: { column: 3 } }
export const PoliciesTable: Story = { name: '4 · Policies table', args: { column: 4 } }
export const SidePanel: Story = { name: '5 · Side panel', args: { column: 5 } }
export const Edit: Story = { name: '6 · Edit', args: { column: 6 } }
export const Cancel: Story = { name: '7 · Cancel', args: { column: 7 } }
export const Remove: Story = { name: '8 · Remove', args: { column: 8 } }
export const UsingTheSafe: Story = { name: '9 · Using the Safe', args: { column: 9 } }
