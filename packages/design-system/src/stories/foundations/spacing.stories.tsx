import type { Meta, StoryObj } from '@storybook/react'
import { useEffect, useRef, useState } from 'react'

import { Typography } from '../../components/typography'
import { RADIUS_TOKENS, Z_TOKENS, readToken } from './tokens'

/**
 * Spacing, radius and stacking — the geometry tokens.
 *
 * Spacing comes from Tailwind's 4px scale (`gap-2` = 8px, `p-4` = 16px …); the design system does
 * not redefine it, so this page shows the steps actually in use rather than inventing names. Radius
 * and the overlay z-index ladder ARE design-system tokens, and are read live from the stylesheet.
 */
const meta = {
  title: 'Foundations/Spacing & radius',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** The steps components actually use — 4px base, so the step number is a quarter of the pixels. */
const SPACING_STEPS = [
  { utility: '0.5', px: 2, use: 'Hairline gaps inside a control' },
  { utility: '1', px: 4, use: 'Icon-to-label in a compact control' },
  { utility: '1.5', px: 6, use: 'Icon-to-label, default button' },
  { utility: '2', px: 8, use: 'Related controls in a row' },
  { utility: '3', px: 12, use: 'Form field to field' },
  { utility: '4', px: 16, use: 'Card padding, list rows' },
  { utility: '6', px: 24, use: 'Card padding (lg), section inner' },
  { utility: '8', px: 32, use: 'Between sections' },
  { utility: '12', px: 48, use: 'Between major page blocks' },
]

export const Overview: Story = {
  render: () => {
    const probe = useRef<HTMLDivElement>(null)
    const [values, setValues] = useState<Record<string, string>>({})

    useEffect(() => {
      const next: Record<string, string> = {}
      for (const { name } of [...RADIUS_TOKENS, ...Z_TOKENS]) next[name] = readToken(probe.current, name)
      setValues(next)
    }, [])

    return (
      <div ref={probe} className="flex max-w-5xl flex-col gap-10">
        <div>
          <Typography variant="h2">Spacing &amp; radius</Typography>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Spacing is Tailwind&apos;s 4px scale — the design system does not rename it. Radius and the overlay stacking
            order are design-system tokens, defined in <code>packages/design-system/src/styles/tokens.css</code>.
          </p>
        </div>

        <section>
          <h3 className="mb-1 text-xs font-semibold tracking-wider text-foreground uppercase">Spacing</h3>
          <p className="mb-4 max-w-2xl text-xs text-muted-foreground">
            The steps in real use. Prefer a step from this list over an arbitrary value — an off-scale gap is visible
            next to an on-scale one.
          </p>
          <ul className="flex flex-col gap-3">
            {SPACING_STEPS.map(({ utility, px, use }) => (
              <li key={utility} className="flex items-center gap-4">
                <code className="w-16 shrink-0 text-[11px] text-muted-foreground">{utility}</code>
                <span className="h-3 shrink-0 rounded-2xs bg-primary" style={{ width: px }} />
                <span className="w-16 shrink-0 text-[11px] text-muted-foreground">{px}px</span>
                <span className="text-[11px] text-muted-foreground">{use}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-1 text-xs font-semibold tracking-wider text-foreground uppercase">Radius</h3>
          <p className="mb-4 max-w-2xl text-xs text-muted-foreground">
            Components set their own radius through a `radius`/`variant` prop — reach for those rather than a
            `rounded-*` utility at the call site.
          </p>
          <ul className="flex flex-wrap gap-6">
            {RADIUS_TOKENS.map(({ name, utility }) => (
              <li key={name} className="flex flex-col items-start gap-1.5">
                <span
                  className="size-16 border border-border bg-muted"
                  style={{ borderRadius: `var(${name})` }}
                  aria-hidden
                />
                <code className="text-[11px] text-foreground">{utility}</code>
                <code className="text-[11px] text-muted-foreground">{values[name] || '—'}</code>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-1 text-xs font-semibold tracking-wider text-foreground uppercase">Overlay stacking</h3>
          <p className="mb-4 max-w-2xl text-xs text-muted-foreground">
            Not decorative: an overlay opened from inside another one has to beat it, or it renders behind and the flow
            dead-ends. apps/web asserts the wallet-modal end of this ladder in <code>walletModalZIndex.test.ts</code>.
          </p>
          <ul className="flex flex-col divide-y divide-border">
            {Z_TOKENS.map(({ name, use }) => (
              <li key={name} className="flex flex-wrap items-baseline gap-x-3 py-2">
                <code className="w-56 shrink-0 text-[12px] text-foreground">{name}</code>
                <code className="w-16 shrink-0 text-[11px] text-muted-foreground">{values[name] || '—'}</code>
                <span className="text-[11px] text-muted-foreground">{use}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    )
  },
}
