import type { ContactTag, WorkspaceTag } from '../types'
import { sameTagName } from './tagRules'

type TagColor = ContactTag['color']

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

export type TagLabel = { name: string; color?: TagColor }

/** A tag being picked: an existing one keeps its colour, a new one gets a free colour when it's created. */
export type TagChoice = { name: string; color: TagColor }

const TAG_COLORS = Object.keys(TAG_COLOR_CLASSES) as TagColor[]

/** A random colour that none of `taken` uses; undefined once all of them are. */
export const pickFreeColor = (taken: readonly TagColor[]): TagColor | undefined => {
  const free = TAG_COLORS.filter((color) => !taken.includes(color))
  return free.length > 0 ? free[Math.floor(Math.random() * free.length)] : undefined
}

/** A contact's tag names with their workspace colours; a name the workspace no longer has is left out. */
export const toTagChoices = (names: readonly string[], tags: readonly WorkspaceTag[]): TagChoice[] =>
  names.flatMap((name) => {
    const tag = tags.find((candidate) => sameTagName(candidate.name, name))
    return tag ? [{ name: tag.name, color: tag.color }] : []
  })

/** What a save sends: every tag's name, and the colours picked for the tags it creates. */
export const toTagRequest = (
  choices: readonly TagChoice[],
  tags: readonly WorkspaceTag[],
): { tags: string[]; tagColors: TagChoice[] } => ({
  tags: choices.map((choice) => choice.name),
  tagColors: choices.filter((choice) => !tags.some((tag) => sameTagName(tag.name, choice.name))),
})
