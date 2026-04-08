import React from 'react'
import { sectionItems } from './sectionItems'

const SearchSection = () => {
  return (
    <>
      {sectionItems.map((item) => (
        <div className="flex flex-col">
          <p className="px-4 py-2 text-xs text-muted-foreground">{item.label}</p>
          {item.renderItem()}
        </div>
      ))}
    </>
  )
}

export default SearchSection
