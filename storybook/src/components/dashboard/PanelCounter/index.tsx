import type { ReactElement } from 'react'

import { cn } from '@/utils/cn'

export const PanelCounter = ({
  count,
  variant = 'warning',
}: {
  count?: string
  variant?: 'warning' | 'subtle'
}): ReactElement | null =>
  count ? (
    <span
      className={cn(
        'ml-6 inline-flex h-5 min-w-5 items-center justify-center rounded-[10px] px-0.5 align-middle text-[11px] font-bold',
        variant === 'warning'
          ? 'bg-[var(--color-warning-light)] text-[var(--color-static-main)]'
          : 'border border-[var(--color-background-main)] bg-[var(--color-background-main)] text-[var(--color-text-primary)]',
      )}
    >
      {count}
    </span>
  ) : null
