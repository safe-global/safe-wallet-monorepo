import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { linkTo } from '@storybook/addon-links'

/** Story groups that live in THIS Storybook. Anything else belongs to the app Storybook. */
const LOCAL_GROUPS = ['Design System', 'Foundations/', 'UI/', 'Presets/']

/**
 * Where the app Storybook is published, so a "where it's used" link can leave this one.
 * Set `STORYBOOK_APP_URL` when building (the branch preview serves it at `/storybook/`).
 */
const APP_STORYBOOK_URL = (typeof process !== 'undefined' ? process.env?.STORYBOOK_APP_URL : undefined) ?? ''

const isLocalStory = (title: string) => LOCAL_GROUPS.some((group) => title.startsWith(group))

// Mirrors Storybook's own id derivation closely enough to build a deep link.
const toStoryPath = (title: string, name?: string) => {
  const slug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  return name ? `${slug(title)}--${slug(name)}` : slug(title)
}

/**
 * Navigates to another story. Titles inside this Storybook use addon-links; app-owned titles
 * (Components/…, Features/…, Pages/…) open the app Storybook in a new tab when its URL is
 * configured. Without that URL an app-owned link is inert rather than misleading — the same
 * call from the app Storybook, where those titles are local, always works.
 */
export const openStory = (title: string, name?: string) => () => {
  if (isLocalStory(title) || !APP_STORYBOOK_URL) {
    linkTo(title, name)()
    return
  }
  window.open(`${APP_STORYBOOK_URL.replace(/\/$/, '')}/?path=/story/${toStoryPath(title, name)}`, '_blank')
}

/**
 * Layout primitives for designer-facing gallery stories — the "Design System" showcase in
 * this package and the app-side surveys that catalogue Safe-specific components.
 *
 * These are Storybook furniture, not shipped UI: they render the frame around a component
 * (label, when-to-use caption, open review question, link to the exhaustive story) so every
 * gallery page reads the same way. Keep them here rather than copying them per story —
 * duplicated furniture is how two gallery pages start disagreeing about what a swatch looks
 * like.
 */

export const Family = ({
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

export const Row = ({ label, note, children }: { label: string; note?: ReactNode; children: ReactNode }) => (
  <section>
    <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{label}</h3>
      {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
    </div>
    <div className="flex flex-wrap items-end gap-x-10 gap-y-7">{children}</div>
  </section>
)

export const Swatch = ({
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
        onClick={openStory(to)}
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

// Links to other Storybook stories (navigates the manager via addon-links) — so "where used"
// jumps straight to the exhaustive UI reference or the component living in a real screen.
export const StoryLink = ({ title, name, children }: { title: string; name?: string; children: ReactNode }) => (
  <button
    type="button"
    onClick={openStory(title, name)}
    className="border-border text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
  >
    {children}
    <ArrowUpRight className="size-3 opacity-60" />
  </button>
)

export const LinkGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-muted-foreground w-24 shrink-0 text-xs">{label}</span>
    {children}
  </div>
)

export const WhereUsed = ({ children }: { children: ReactNode }) => (
  <section>
    <h3 className="text-foreground mb-3 text-xs font-semibold tracking-wider uppercase">Where it&apos;s used</h3>
    <div className="flex flex-col gap-2.5">{children}</div>
  </section>
)

// A catalog entry for a component we ship but don't render inline (too heavy / feature-scoped to
// mock here) — its name, a when-to-use line, a link to its own story, and an optional review question.
export const CatalogRow = ({
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
