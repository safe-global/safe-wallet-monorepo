/**
 * Ten hues anchored on the Safe theme (brand green, info, warning, error, review, graphite) plus
 * four complementary ones, ordered so neighbours differ. Colour is a deterministic hash of the tag
 * name, so the same tag looks the same everywhere and nothing about colour is stored.
 */
export const TAG_PALETTE = [
  {
    dot: 'bg-[var(--color-secondary-main)]',
    fill: 'bg-[var(--color-secondary-background)] text-[var(--color-success-dark)]',
  },
  {
    dot: 'bg-[var(--color-info-main)]',
    fill: 'bg-[var(--color-info-background)] text-[var(--color-info-dark)]',
  },
  {
    dot: 'bg-[var(--color-warning-main)]',
    fill: 'bg-[var(--color-warning-background)] text-[var(--color-warning-dark)]',
  },
  { dot: 'bg-violet-500', fill: 'bg-violet-500/10 text-violet-800 dark:text-violet-200' },
  {
    dot: 'bg-[var(--color-error-main)]',
    fill: 'bg-[var(--color-error-background)] text-[var(--color-error-dark)]',
  },
  { dot: 'bg-teal-600', fill: 'bg-teal-600/10 text-teal-800 dark:text-teal-200' },
  {
    dot: 'bg-[var(--color-review-main)]',
    fill: 'bg-[var(--color-review-background)] text-amber-900 dark:text-amber-200',
  },
  { dot: 'bg-blue-500', fill: 'bg-blue-500/10 text-blue-800 dark:text-blue-200' },
  { dot: 'bg-pink-500', fill: 'bg-pink-500/10 text-pink-800 dark:text-pink-200' },
  {
    dot: 'bg-[var(--color-primary-light)]',
    fill: 'bg-[var(--color-background-main)] text-[var(--color-text-primary)]',
  },
] as const

export const tagColorIndex = (tag: string): number => {
  const key = tag.trim().toLowerCase()
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % TAG_PALETTE.length
}

export const tagColor = (tag: string) => TAG_PALETTE[tagColorIndex(tag)]
