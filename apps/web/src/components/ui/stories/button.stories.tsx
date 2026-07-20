import type { Meta, StoryObj } from '@storybook/react'
import { SquareDashed, Plus, ArrowRight, ArrowUpRight, ArrowDownLeft, Repeat } from 'lucide-react'
import { Button } from '../button'

/**
 * Button Component Stories
 *
 * Figma: https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=842-44442
 */
const meta = {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'destructive-outline', 'surface', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'action', 'submit', 'xl', 'icon', 'icon-sm', 'icon-xs'],
    },
    disabled: {
      control: 'boolean',
    },
    children: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Variants</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="destructive-outline">Destructive outline</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Sizes</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="action">Action</Button>
          <Button size="submit">Submit</Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          <code>action</code> = toolbar/action-bar pill. <code>submit</code> = the same pill with a stable min-width for
          modal/flow submit buttons (label can swap to a spinner without resizing).
        </p>
      </div>

      <div>
        <h3 className="mb-1 text-lg font-semibold">Action buttons (CTA pattern)</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          The canonical action-bar pattern: <code>size=&quot;action&quot;</code> for one shared height/padding, with{' '}
          <code>variant=&quot;default&quot;</code> for the primary action and <code>variant=&quot;secondary&quot;</code>{' '}
          for secondary actions. Used for Send/Receive/Swap, Confirm/Execute, Filter/Export, Save settings, etc.
          <br />
          Surface rule: filled <code>secondary</code> only reads on white/card surfaces (e.g. the dashboard). On the
          muted page background (e.g. the transactions toolbar) use <code>variant=&quot;outline&quot;</code> so the
          button stays visible.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="default" size="action">
            <ArrowUpRight className="text-green-400" />
            Send
          </Button>
          <Button variant="secondary" size="action">
            <ArrowDownLeft />
            Receive
          </Button>
          <Button variant="secondary" size="action">
            <Repeat strokeWidth={1.5} />
            Swap
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Icon Sizes</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="icon-xs" variant="outline">
            <Plus className="size-3" />
          </Button>
          <Button size="icon-sm" variant="outline">
            <Plus className="size-4" />
          </Button>
          <Button size="icon" variant="outline">
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">With Icons</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button>
            <Plus className="size-4" />
            Add Item
          </Button>
          <Button variant="secondary">
            Next
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="outline">
            <SquareDashed className="size-4" />
            Label
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">States</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
          <Button aria-invalid>Invalid</Button>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Expanded (menu trigger open)</h3>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" aria-expanded>
            Outline
          </Button>
          <Button variant="secondary" aria-expanded>
            Secondary
          </Button>
          <Button variant="ghost" aria-expanded>
            Ghost
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">All Variants × Sizes</h3>
        <div className="flex flex-col gap-4">
          {(['default', 'secondary', 'outline', 'ghost', 'destructive'] as const).map((variant) => (
            <div key={variant} className="flex items-center gap-4">
              <span className="w-24 text-sm text-muted-foreground">{variant}</span>
              <Button variant={variant} size="sm">
                SM
              </Button>
              <Button variant={variant} size="default">
                Default
              </Button>
              <Button variant={variant} size="lg">
                LG
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
}

/**
 * When to use which variant/size — the decision matrix the app should follow.
 *
 * The one rule that keeps buttons consistent: on `<Button>`, `className` is for LAYOUT ONLY
 * (w-full, margins, grid placement). Height, padding, font-size, radius, and background are owned
 * by the `size`/`variant` props — never re-declare them via className. If no size/variant fits a
 * recurring need, add one to `components/ui/button.tsx`. This is enforced by the `no-restricted-syntax`
 * ESLint rule and documented in `.storybook/AGENTS.md`.
 */
export const Guidelines: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h3 className="mb-1 text-lg font-semibold">The rule</h3>
        <p className="text-sm text-muted-foreground">
          On <code>&lt;Button&gt;</code>, <code>className</code> is for <strong>layout only</strong> (
          <code>w-full</code>, margins, grid placement). Height, padding, font-size, radius and background belong to the{' '}
          <code>size</code>/<code>variant</code> props — never re-declare them via <code>className</code>. If no
          size/variant fits a recurring need, add one to <code>components/ui/button.tsx</code> instead of overriding at
          the call site.
        </p>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">When to use — variant (emphasis)</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-border border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Variant</th>
                <th className="py-2 pr-4 font-medium">Use for</th>
                <th className="py-2 font-medium">Example</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  [
                    'default',
                    'The one primary action of a surface/row (Create, Connect, Confirm, Save)',
                    <Button key="v-default" variant="default">
                      Primary
                    </Button>,
                  ],
                  [
                    'secondary',
                    'Secondary action of equal weight — only on white/card surfaces',
                    <Button key="v-secondary" variant="secondary">
                      Secondary
                    </Button>,
                  ],
                  [
                    'outline',
                    'Secondary action on page/toolbar backgrounds; neutral button; dialog Cancel',
                    <Button key="v-outline" variant="outline">
                      Outline
                    </Button>,
                  ],
                  [
                    'ghost',
                    'Low-emphasis, repeated, toolbar, list-row, icon/menu-trigger actions',
                    <Button key="v-ghost" variant="ghost">
                      Ghost
                    </Button>,
                  ],
                  [
                    'destructive',
                    'Filled-tint primary destructive action (Delete/Remove)',
                    <Button key="v-destructive" variant="destructive">
                      Delete
                    </Button>,
                  ],
                  [
                    'destructive-outline',
                    'Bordered destructive that reads as a normal button (Leave workspace)',
                    <Button key="v-destructive-outline" variant="destructive-outline">
                      Leave
                    </Button>,
                  ],
                  [
                    'surface',
                    'Card-surface CTA on a coloured / promo surface (Earn, Stake, Add funds)',
                    <Button key="v-surface" variant="surface">
                      Surface
                    </Button>,
                  ],
                  [
                    'link',
                    'Inline text / navigational action',
                    <Button key="v-link" variant="link">
                      Link
                    </Button>,
                  ],
                ] as const
              ).map(([variant, usage, sample]) => (
                <tr key={variant} className="border-border/60 border-b align-middle">
                  <td className="py-3 pr-4">
                    <code>{variant}</code>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{usage}</td>
                  <td className="py-3">{sample}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Rule of thumb: <strong>at most one filled primary (default) per surface or row</strong> — hierarchy comes from
          the variant, not from custom colours. Filled <code>secondary</code> only reads on white/card surfaces; on the
          muted page background use <code>outline</code>.
        </p>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">When to use — size (height / padding)</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-border border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Size</th>
                <th className="py-2 pr-4 font-medium">Box</th>
                <th className="py-2 pr-4 font-medium">Use for</th>
                <th className="py-2 font-medium">Example</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  [
                    'action',
                    'h-10 px-6',
                    'Prominent CTA / action-bar pill: page-header primary actions, Send/Receive/Swap, Confirm/Execute, Filter/Export',
                    <Button key="s-action" size="action">
                      Action
                    </Button>,
                  ],
                  [
                    'submit',
                    'h-10 min-w',
                    'Modal / flow / settings submit (label can swap to a spinner without resizing)',
                    <Button key="s-submit" size="submit">
                      Submit
                    </Button>,
                  ],
                  [
                    'xl',
                    'h-12',
                    'Full-screen onboarding / flow footer CTA (use via the OnboardingFooter preset)',
                    <Button key="s-xl" size="xl">
                      XL
                    </Button>,
                  ],
                  [
                    'lg',
                    'h-10',
                    'Large stacked form-step buttons (create-safe flow)',
                    <Button key="s-lg" size="lg">
                      Large
                    </Button>,
                  ],
                  [
                    'default',
                    'h-9',
                    'Standard button, default inside content',
                    <Button key="s-default" size="default">
                      Default
                    </Button>,
                  ],
                  [
                    'sm',
                    'h-8',
                    'Compact / inline / toolbar, list-row actions, cards, dense headers',
                    <Button key="s-sm" size="sm">
                      Small
                    </Button>,
                  ],
                  [
                    'icon*',
                    'square',
                    'Icon-only; match the neighbouring text button (icon-sm↔sm, icon↔default)',
                    <Button key="s-icon" size="icon-sm" variant="outline">
                      <Plus />
                    </Button>,
                  ],
                ] as const
              ).map(([size, box, usage, sample]) => (
                <tr key={size} className="border-border/60 border-b align-middle">
                  <td className="py-3 pr-4">
                    <code>{size}</code>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    <code>{box}</code>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{usage}</td>
                  <td className="py-3">{sample}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-lg font-semibold">Do / Don&apos;t</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          A real example: the welcome-screen header actions. Buttons meant to be siblings must share one{' '}
          <code>size</code>; the hierarchy is carried by the <code>variant</code>.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="border-border rounded-lg border p-4">
            <p className="text-[var(--color-success-main)] mb-3 text-sm font-semibold">✓ Do</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="action">
                <Plus />
                Add
              </Button>
              <Button variant="default" size="action">
                Create account
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              One <code>size=&quot;action&quot;</code> → identical height, padding, font and radius.{' '}
              <code>outline</code> vs <code>default</code> carries the emphasis. className is layout-only.
            </p>
          </div>
          <div className="border-border rounded-lg border p-4">
            <p className="mb-3 text-sm font-semibold text-destructive">✗ Don&apos;t</p>
            <div className="flex flex-wrap items-center gap-2">
              {/* eslint-disable-next-line no-restricted-syntax -- intentional anti-pattern for the docs */}
              <Button variant="outline" size="sm" className="h-9 rounded-lg px-4 text-base">
                <Plus />
                Add
              </Button>
              {/* eslint-disable-next-line no-restricted-syntax -- intentional anti-pattern for the docs */}
              <Button variant="default" size="sm" className="rounded-lg text-base">
                Create account
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Same intent, but <code>size=&quot;sm&quot;</code> is overridden by <code>h-9</code>/<code>text-base</code>
              /<code>rounded-lg</code> on one and not the other → mismatched height, font and radius. This is exactly
              the drift the ESLint rule now blocks.
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
}
