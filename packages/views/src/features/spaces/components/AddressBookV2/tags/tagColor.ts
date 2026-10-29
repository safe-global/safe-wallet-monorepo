import type { ContactTag } from '../types'

export type TagColor = ContactTag['color']

// Spelled out in full so Tailwind finds the classes; the colours are the theme's `tag` tokens.
export const TAG_COLOR_CLASSES: Record<TagColor, { chip: string; dot: string }> = {
  slate: {
    chip: 'bg-[var(--color-tag-slate-bg)] text-[var(--color-tag-slate-fg)]',
    dot: 'bg-[var(--color-tag-slate-dot)]',
  },
  clay: {
    chip: 'bg-[var(--color-tag-clay-bg)] text-[var(--color-tag-clay-fg)]',
    dot: 'bg-[var(--color-tag-clay-dot)]',
  },
  rose: {
    chip: 'bg-[var(--color-tag-rose-bg)] text-[var(--color-tag-rose-fg)]',
    dot: 'bg-[var(--color-tag-rose-dot)]',
  },
  lilac: {
    chip: 'bg-[var(--color-tag-lilac-bg)] text-[var(--color-tag-lilac-fg)]',
    dot: 'bg-[var(--color-tag-lilac-dot)]',
  },
  iris: {
    chip: 'bg-[var(--color-tag-iris-bg)] text-[var(--color-tag-iris-fg)]',
    dot: 'bg-[var(--color-tag-iris-dot)]',
  },
  cobalt: {
    chip: 'bg-[var(--color-tag-cobalt-bg)] text-[var(--color-tag-cobalt-fg)]',
    dot: 'bg-[var(--color-tag-cobalt-dot)]',
  },
  sky: { chip: 'bg-[var(--color-tag-sky-bg)] text-[var(--color-tag-sky-fg)]', dot: 'bg-[var(--color-tag-sky-dot)]' },
  lagoon: {
    chip: 'bg-[var(--color-tag-lagoon-bg)] text-[var(--color-tag-lagoon-fg)]',
    dot: 'bg-[var(--color-tag-lagoon-dot)]',
  },
}

export type TagLabel = { name: string; color: TagColor }
