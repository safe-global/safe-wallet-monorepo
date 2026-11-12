import Link from 'next/link'
import { Blocks, Palette, ShieldCheck, Terminal } from 'lucide-react'

const FEATURES = [
  {
    icon: Blocks,
    title: 'Import it or own it',
    body: 'Use @safe-global/ui as a package, or copy any component into your app with the @safe shadcn registry.',
    href: '/docs/installation/',
  },
  {
    icon: Palette,
    title: 'One source of tokens',
    body: 'Colours, spacing and radius come from @safe-global/theme, the same palettes the Safe mobile app uses.',
    href: '/docs/theming/',
  },
  {
    icon: ShieldCheck,
    title: 'Accessible by default',
    body: 'Built on Base UI: focus management, keyboard support and ARIA come with every interactive component.',
    href: '/components/',
  },
  {
    icon: Terminal,
    title: 'Made for agents too',
    body: 'Props are generated from TypeScript, rules come from lint, and llms.txt indexes every page.',
    href: '/docs/',
  },
]

export function Features() {
  return (
    <section className="border-t" aria-labelledby="features-title">
      <div className="mx-auto grid max-w-(--site-max-width) gap-10 px-4 py-20 lg:grid-cols-[1fr_2fr] lg:px-6">
        <div className="flex flex-col gap-3">
          <h2 id="features-title" className="m-0 text-3xl font-semibold tracking-tight">
            Everything a Safe app needs to look like Safe
          </h2>
          <p className="m-0 text-muted-foreground">
            The components that power {'Safe{Wallet}'}, documented for every team building on Safe.
          </p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group flex flex-col gap-3 bg-background p-6 transition-colors hover:bg-muted/50"
            >
              <span className="brand-mark grid size-9 place-items-center rounded-lg">
                <feature.icon className="size-4" aria-hidden />
              </span>
              <span className="font-medium">{feature.title}</span>
              <span className="text-sm text-muted-foreground">{feature.body}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
