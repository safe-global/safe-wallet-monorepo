import type { Meta, StoryObj } from '@storybook/react'

import { Typography } from '../../components/typography'

/**
 * Typography — the full type scale, one row per variant.
 *
 * `Typography` is the only sanctioned way to set type: it owns size, weight and line-height, so a
 * text style can be changed here and every screen follows. Setting `text-*`/`font-*` utilities on
 * a `className` instead is what makes headings drift apart between screens.
 *
 * Variant names mirror the Figma text styles, so a designer and an engineer can name the same
 * thing: `h1`–`h4`, then `paragraph` / `paragraph-small` / `paragraph-mini`, each with a
 * `-medium` and `-bold` weight. `code` is the mono variant.
 */
const meta = {
  title: 'Foundations/Typography',
  component: Typography,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Typography>

export default meta
type Story = StoryObj<typeof meta>

const VARIANTS = [
  { variant: 'h1', use: 'Page title — one per page' },
  { variant: 'h2', use: 'Section heading' },
  { variant: 'h3', use: 'Sub-section heading' },
  { variant: 'h4', use: 'Card / panel heading' },
  { variant: 'paragraph', use: 'Body copy' },
  { variant: 'paragraph-medium', use: 'Body, emphasised' },
  { variant: 'paragraph-bold', use: 'Body, strong' },
  { variant: 'paragraph-small', use: 'Dense body, table cells' },
  { variant: 'paragraph-small-medium', use: 'Dense body, emphasised' },
  { variant: 'paragraph-small-bold', use: 'Dense body, strong' },
  { variant: 'paragraph-mini', use: 'Captions, helper text' },
  { variant: 'paragraph-mini-medium', use: 'Captions, emphasised' },
  { variant: 'paragraph-mini-bold', use: 'Labels, overlines' },
  { variant: 'code', use: 'Addresses, hashes, calldata' },
] as const

export const Scale: Story = {
  render: () => (
    <div className="flex max-w-5xl flex-col gap-8">
      <div>
        <Typography variant="h2">Typography</Typography>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every variant, rendered at its real size. The font is DM Sans, set once on <code>--font-sans</code> in the
          token layer. Pick a variant by role, not by the size you want — that is what keeps two screens showing the
          same thing at the same size.
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-border">
        {VARIANTS.map(({ variant, use }) => (
          <li key={variant} className="flex flex-col gap-1 py-5">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <code className="text-[11px] text-muted-foreground">{variant}</code>
              <span className="text-[11px] text-muted-foreground">{use}</span>
            </div>
            <Typography variant={variant}>The quick brown fox jumps over the lazy dog</Typography>
          </li>
        ))}
      </ul>

      <section>
        <h3 className="mb-1 text-xs font-semibold tracking-wider text-foreground uppercase">Colour</h3>
        <p className="mb-4 max-w-2xl text-xs text-muted-foreground">
          Two ink options, both token-backed. Anything else — a status colour, a link colour — comes from the component
          you are inside, not from a colour on the text.
        </p>
        <div className="flex flex-col gap-2">
          <Typography>color=&quot;default&quot; — the page ink</Typography>
          <Typography color="muted">color=&quot;muted&quot; — secondary / caption ink</Typography>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold tracking-wider text-foreground uppercase">Alignment</h3>
        <div className="flex flex-col gap-2">
          <Typography align="left">align=&quot;left&quot;</Typography>
          <Typography align="center">align=&quot;center&quot;</Typography>
          <Typography align="right">align=&quot;right&quot;</Typography>
        </div>
      </section>
    </div>
  ),
}
