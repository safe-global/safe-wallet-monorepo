import { sectionItems } from './sectionItems'

interface SearchSectionProps {
  query: string
}

const SearchSection = ({ query }: SearchSectionProps) => {
  return (
    <>
      {sectionItems.map((item) => (
        <div key={item.label} className="flex flex-col">
          <p className="px-4 py-2 text-xs text-muted-foreground">{item.label}</p>
          {item.renderItem({ query })}
        </div>
      ))}
    </>
  )
}

export default SearchSection
