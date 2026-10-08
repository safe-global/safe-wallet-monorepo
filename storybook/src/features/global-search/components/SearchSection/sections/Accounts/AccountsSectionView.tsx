import type { ReactNode } from 'react'
import type { MultiChainSafeItem, SafeItem } from '@/hooks/safes'
import { Skeleton } from '@/components/ui/skeleton'
import SectionWrapper from '@views/features/global-search/components/SearchSection/SectionWrapper'

export type AccountsSectionViewProps = {
  label: string
  isLoading: boolean
  items: { key: string; safe: SafeItem | MultiChainSafeItem }[]
  renderSafeCard: (props: { safe: SafeItem | MultiChainSafeItem; className: string }) => ReactNode
}

export const AccountsSectionView = ({ label, isLoading, items, renderSafeCard }: AccountsSectionViewProps) => {
  if (isLoading) {
    return (
      <SectionWrapper label={label}>
        <div className="flex flex-col gap-2 px-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </SectionWrapper>
    )
  }
  if (items.length === 0) {
    return null
  }

  return (
    <SectionWrapper label={label}>
      <div className="flex flex-col gap-1 px-2">
        {items.map(({ key, safe }) => {
          return (
            <div key={key} data-search-item className="group/search-focus">
              {renderSafeCard({
                safe,
                className: 'group-data-[focused]/search-focus:bg-accent px-2 sm:px-2',
              })}
            </div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
