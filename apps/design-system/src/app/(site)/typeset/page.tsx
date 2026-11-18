import type { Metadata } from 'next'
import { Typeset } from '@/components/typeset/typeset'
import { getProps, getTokens } from '@/lib/generated'
import { SiteFooter } from '@/components/site/site-footer'

export const metadata: Metadata = {
  title: 'Typeset',
  description: 'The Safe type scale, rendered with your own sample text.',
}

type Variant = Parameters<typeof Typeset>[0]['variants'][number]

export default function TypesetPage() {
  const variants = (getProps('typography').cva.find((doc) => doc.name === 'typographyVariants')?.variants.variant ??
    []) as Variant[]
  const { fontSans } = getTokens()
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-5xl px-4 pt-14 pb-20">
        <header className="flex flex-col gap-3 pb-8">
          <p className="m-0 text-sm font-medium text-muted-foreground">Typeset</p>
          <h1 className="m-0 text-4xl font-semibold tracking-tight sm:text-5xl">The Safe type scale</h1>
          <p className="m-0 max-w-2xl text-lg text-muted-foreground">
            Every <code className="font-mono text-base">Typography</code> variant in{' '}
            <code className="font-mono text-base">{fontSans}</code>. Type your own sample text; the sizes are read from
            the rendered styles, so they always match the tokens.
          </p>
        </header>
        <Typeset variants={variants} />
      </div>
      <SiteFooter />
    </main>
  )
}
