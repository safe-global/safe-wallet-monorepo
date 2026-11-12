import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@safe-global/ui/button'

const STACK = ['React 19', 'Tailwind CSS v4', 'Base UI', 'shadcn registry', 'Dark mode']

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden" data-hero>
      <div className="site-grid absolute inset-x-0 top-0 -z-10 h-[560px]" aria-hidden />
      <div className="site-glow absolute inset-x-0 top-0 -z-10 h-[560px]" aria-hidden />
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 pt-20 pb-14 text-center sm:pt-28">
        <Link
          href="/docs/installation/#shadcn-registry"
          className="group inline-flex items-center gap-2 rounded-full border bg-background/70 py-1 pr-3 pl-1 text-sm text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
          data-announcement
        >
          <span className="brand-mark rounded-full px-2 py-0.5 text-xs font-semibold">New</span>
          shadcn registry for Safe UI
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
        <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
          The design system for building Safe apps
        </h1>
        <p className="max-w-2xl text-lg text-balance text-muted-foreground sm:text-xl">
          Accessible React components, Safe&apos;s design tokens and a shadcn registry. Install the package, or copy the
          source and make it yours.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <span className="brand inline-flex">
            <Button size="lg" render={<Link href="/docs/installation/" />} nativeButton={false}>
              Get started
              <ArrowRight />
            </Button>
          </span>
          <Button variant="outline" size="lg" render={<Link href="/components/" />} nativeButton={false}>
            View components
          </Button>
        </div>
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-4 text-sm text-muted-foreground">
          {STACK.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
