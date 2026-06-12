import { sectionItems, type SectionItem } from './sectionItems'
import { SectionVisibilityProvider, useSectionVisibility } from './SectionVisibilityContext'

interface SearchSectionProps {
  query: string
}

const NoResults = () => (
  <div className="flex h-full min-h-[350px] items-center justify-center px-4">
    <p className="text-base text-muted-foreground">No results found</p>
  </div>
)

const SectionEntry = ({ item, query }: { item: SectionItem; query: string }) => {
  const isActive = item.useActivate()

  if (!isActive) return null

  // Render as a component (not a function call) so the section's hooks are
  // not registered against SectionEntry, which returns early when inactive
  const SectionContent = item.renderItem
  return <SectionContent query={query} label={item.label} />
}

const SearchSectionContent = ({ query }: SearchSectionProps) => {
  const { hasVisibleSections } = useSectionVisibility()
  const hasQuery = query.trim().length > 0

  return (
    <>
      {sectionItems.map((item) => (
        <SectionEntry key={item.label} item={item} query={query} />
      ))}
      {hasQuery && !hasVisibleSections && <NoResults />}
    </>
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
