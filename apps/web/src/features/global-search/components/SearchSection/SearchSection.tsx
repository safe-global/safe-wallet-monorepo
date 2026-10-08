import { sectionItems, type SectionItem } from './sectionItems'
import {
  SectionVisibilityProvider,
  useSectionVisibility,
} from '@views/features/global-search/components/SearchSection/SectionVisibilityContext'
import { SearchSectionView } from '@views/features/global-search/components/SearchSection/SearchSectionView'

interface SearchSectionProps {
  query: string
}

const SectionEntry = ({ item, query }: { item: SectionItem; query: string }) => {
  const isActive = item.useActivate()

  if (!isActive) return null

  return <item.Component query={query} label={item.label} />
}

const SearchSectionContent = ({ query }: SearchSectionProps) => {
  const { hasVisibleSections } = useSectionVisibility()
  const hasQuery = query.trim().length > 0

  return (
    <SearchSectionView showNoResults={hasQuery && !hasVisibleSections}>
      {sectionItems.map((item) => (
        <SectionEntry key={item.label} item={item} query={query} />
      ))}
    </SearchSectionView>
  )
}

const SearchSection = ({ query }: SearchSectionProps) => {
  return (
    <SectionVisibilityProvider>
      <SearchSectionContent query={query} />
    </SectionVisibilityProvider>
  )
}

export default SearchSection
