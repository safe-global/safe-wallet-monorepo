import React from 'react'
import { sectionItems } from './sectionItems'

const SearchSection = () => {
  return (
    <>
      {sectionItems.map((item) => (
        <>{item.label}</>
      ))}
      {sectionItems.map((item) => (
        <>{item.renderItem()}</>
      ))}
    </>
  )
}

export default SearchSection
