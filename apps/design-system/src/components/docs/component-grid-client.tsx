'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@safe-global/ui/input-group'
import { withBasePath } from '@/lib/env'

export interface ComponentCard {
  name: string
  title: string
  description: string
  url: string
  story: string | null
}

function Thumbnail({ name, story }: { name: string; story: string | null }) {
  if (!story) return <div className="h-full w-full bg-muted" />
  return (
    <div className="pointer-events-none h-full w-full overflow-hidden" aria-hidden>
      <iframe
        src={withBasePath(`/preview/${name}/${story}/`)}
        title={`${name} thumbnail`}
        loading="lazy"
        tabIndex={-1}
        className="h-[200%] w-[200%] origin-top-left scale-50 border-0"
        data-thumbnail={name}
      />
    </div>
  )
}

export function ComponentGridClient({ cards }: { cards: ComponentCard[] }) {
  const [query, setQuery] = useState('')
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return cards
    return cards.filter((card) => `${card.title} ${card.name} ${card.description}`.toLowerCase().includes(needle))
  }, [cards, query])

  return (
    <div className="not-prose flex flex-col gap-6" data-component-grid>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <InputGroup inputSize="default" className="w-full sm:w-80">
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Filter components"
            placeholder="Filter components…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
        <p className="m-0 text-sm text-muted-foreground" aria-live="polite">
          {visible.length} of {cards.length} components
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {visible.map((card) => (
          <Link
            key={card.name}
            href={card.url}
            className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/30"
            data-component-card={card.name}
          >
            <div className="relative h-40 border-b bg-background">
              <Thumbnail name={card.name} story={card.story} />
            </div>
            <div className="flex flex-col gap-1 p-4">
              <span className="font-medium">{card.title}</span>
              <span className="line-clamp-2 text-sm text-muted-foreground">{card.description}</span>
            </div>
          </Link>
        ))}
      </div>
      {visible.length === 0 ? <p className="text-sm text-muted-foreground">No component matches “{query}”.</p> : null}
    </div>
  )
}
