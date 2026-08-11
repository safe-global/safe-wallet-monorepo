import type { Meta, StoryObj } from '@storybook/react'
import { useEffect, useRef, useState } from 'react'

import { Typography } from '../../components/typography'
import { SEMANTIC_GROUPS, readToken } from './tokens'

/**
 * Colour — every semantic token the design system exposes, resolved live from the stylesheet.
 *
 * This is the page to change when a colour is wrong. Tokens are defined in
 * `packages/design-system/src/styles/tokens.css` (the semantic layer) on top of
 * `brand-vars.css` (generated from `@safe-global/theme`). Nothing in the apps may hard-code a
 * colour: components reference these tokens, so editing one here changes every surface at once.
 *
 * Flip the toolbar's theme switch to review light and dark — both must be changed together.
 */
const meta = {
  title: 'Foundations/Colour',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/**
 * Reads the resolved value of each token from a probe element inside the scope, so the swatch
 * and its printed value can never disagree with the stylesheet.
 */
const useResolvedTokens = (names: string[]) => {
  const probe = useRef<HTMLDivElement>(null)
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const next: Record<string, string> = {}
    for (const name of names) next[name] = readToken(probe.current, name)
    setValues(next)
    // `names` is a stable literal list per story; re-resolve when the theme class flips.
  }, [names])

  return { probe, values }
}

const Swatch = ({ name, use, value }: { name: string; use: string; value: string }) => (
  <li className="flex items-start gap-3">
    <span
      className="mt-0.5 size-10 shrink-0 rounded-md border border-border"
      style={{ background: value || 'transparent' }}
      // A token that resolves to nothing renders as a transparent chip — visible on purpose.
      aria-hidden
    />
    <div className="min-w-0">
      <code className="block text-[12px] text-foreground">{name}</code>
      <span className="block text-[11px] text-muted-foreground">{use}</span>
      <code className="block text-[11px] text-muted-foreground">{value || 'unresolved'}</code>
    </div>
  </li>
)

export const Overview: Story = {
  render: () => {
    const names = SEMANTIC_GROUPS.flatMap((group) => group.tokens.map((token) => token.name))
    const { probe, values } = useResolvedTokens(names)

    return (
      <div ref={probe} className="flex max-w-5xl flex-col gap-10">
        <div>
          <Typography variant="h2">Colour</Typography>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every semantic token, resolved from the live stylesheet. Change these in{' '}
            <code>packages/design-system/src/styles/tokens.css</code>; the brand values they build on are generated from{' '}
            <code>@safe-global/theme</code> into <code>brand-vars.css</code>. Light and dark are always changed together
            — use the theme switch above to check both.
          </p>
        </div>

        {SEMANTIC_GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="mb-1 text-xs font-semibold tracking-wider text-foreground uppercase">{group.title}</h3>
            <p className="mb-4 max-w-2xl text-xs text-muted-foreground">{group.blurb}</p>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.tokens.map((token) => (
                <Swatch key={token.name} name={token.name} use={token.use} value={values[token.name] ?? ''} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    )
  },
}
