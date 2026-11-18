'use client'

import { useEffect, useRef, useState } from 'react'
import { Code } from '../site/code'
import { Input } from '@safe-global/ui/primitives/input'
import { Label } from '@safe-global/ui/primitives/label'
import { Badge } from '@safe-global/ui/primitives/badge'
import { Typography } from '@safe-global/ui/primitives/typography'

type Variant = Parameters<typeof Typography>[0]['variant']

interface Metrics {
  size: string
  weight: string
  lineHeight: string
  family: string
}

const DEFAULT_SAMPLE = 'Every signature counts'

const px = (value: string) => (value.endsWith('px') ? `${Math.round(parseFloat(value) * 10) / 10}px` : value)

function Specimen({ variant, sample }: { variant: NonNullable<Variant>; sample: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  useEffect(() => {
    const element = ref.current?.firstElementChild
    if (!element) return
    const style = getComputedStyle(element)
    setMetrics({
      size: px(style.fontSize),
      weight: style.fontWeight,
      lineHeight: px(style.lineHeight),
      family: style.fontFamily.split(',')[0].replace(/['"]/g, ''),
    })
  }, [variant])

  const code = `<Typography variant="${variant}">${sample}</Typography>`

  return (
    <section className="grid gap-4 border-b py-8 lg:grid-cols-[220px_1fr]" data-specimen={variant}>
      <div className="flex flex-col gap-2">
        <code className="text-sm font-semibold">{variant}</code>
        {metrics ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <dt>Size</dt>
            <dd className="m-0 font-mono text-foreground" data-metric="size">
              {metrics.size}
            </dd>
            <dt>Weight</dt>
            <dd className="m-0 font-mono text-foreground">{metrics.weight}</dd>
            <dt>Line height</dt>
            <dd className="m-0 font-mono text-foreground">{metrics.lineHeight}</dd>
            <dt>Font</dt>
            <dd className="m-0 font-mono text-foreground">{metrics.family}</dd>
          </dl>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <div ref={ref}>
          <Typography variant={variant} className="break-words" data-sample>
            {sample}
          </Typography>
        </div>
        <Code code={code} lang="tsx" />
      </div>
    </section>
  )
}

export function Typeset({ variants }: { variants: NonNullable<Variant>[] }) {
  const [sample, setSample] = useState(DEFAULT_SAMPLE)
  const shown = sample.trim() ? sample : DEFAULT_SAMPLE

  return (
    <div className="flex flex-col">
      <div className="sticky top-(--site-header-height) z-10 -mx-4 flex flex-wrap items-end gap-4 border-b bg-background/90 px-4 py-4 backdrop-blur-md">
        <div className="flex min-w-64 flex-1 flex-col gap-2">
          <Label htmlFor="typeset-sample">Sample text</Label>
          <Input
            id="typeset-sample"
            value={sample}
            onChange={(event) => setSample(event.target.value)}
            placeholder={DEFAULT_SAMPLE}
            data-typeset-input
          />
        </div>
        <Badge variant="outline">{variants.length} styles</Badge>
      </div>
      {variants.map((variant) => (
        <Specimen key={variant} variant={variant} sample={shown} />
      ))}
    </div>
  )
}
