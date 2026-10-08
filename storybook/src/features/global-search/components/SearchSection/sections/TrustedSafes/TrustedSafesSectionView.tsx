import type { ReactNode } from 'react'
import type { MultiChainSafeItem, SafeItem } from '@/hooks/safes'

import SectionWrapper from '@views/features/global-search/components/SearchSection/SectionWrapper'

export type TrustedSafesSectionViewProps = {
  label: string

  items: { key: string; safe: SafeItem | MultiChainSafeItem }[]
  renderSafeCard: (props: { safe: SafeItem | MultiChainSafeItem; className: string }) => ReactNode
}

export const TrustedSafesSectionView = ({ label, items, renderSafeCard }: TrustedSafesSectionViewProps) => {
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
                className: 'group-data-[focused]/search-focus:bg-muted/50 px-2 sm:px-2',
              })}
            </div>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
