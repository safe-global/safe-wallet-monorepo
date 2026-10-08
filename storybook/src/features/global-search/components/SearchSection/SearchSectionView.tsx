import type { ReactNode } from 'react'

const NoResults = () => (
  <div className="flex h-full min-h-[350px] items-center justify-center px-4">
    <p className="text-base text-muted-foreground">No results found</p>
  </div>
)

export type SearchSectionViewProps = {
  children: ReactNode
  showNoResults: boolean
}

export const SearchSectionView = ({ children, showNoResults }: SearchSectionViewProps) => {
  return (
    <>
      {children}
      {showNoResults && <NoResults />}
    </>
  )
}
