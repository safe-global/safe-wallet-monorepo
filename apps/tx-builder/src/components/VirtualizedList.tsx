import { memo, useEffect, useState, ReactNode } from 'react'
import { Virtuoso } from 'react-virtuoso'
import styled from 'styled-components'

type VirtualizedListProps<T> = {
  innerRef: (ref: HTMLElement | null) => void
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
}

const VirtualizedList = <T,>({ innerRef, items, renderItem }: VirtualizedListProps<T>) => {
  const handleScrollerRef = (ref: HTMLElement | Window | null) => {
    if (ref instanceof HTMLElement || ref === null) {
      innerRef(ref)
    }
  }

  return (
    <Virtuoso
      style={{ height: 600 }}
      scrollerRef={handleScrollerRef}
      data={items}
      itemContent={(index, item) => renderItem(item, index)}
      components={{
        Item: HeightPreservingItem,
      }}
      totalCount={items.length}
      overscan={100}
    />
  )
}

interface HeightPreservingItemProps {
  children?: ReactNode
  'data-known-size'?: number
  style?: React.CSSProperties
}

const HeightPreservingItem = memo(({ children, ...props }: HeightPreservingItemProps) => {
  const [size, setSize] = useState(0)
  const knownSize = props['data-known-size']

  useEffect(() => {
    setSize((prevSize) => {
      return knownSize === 0 ? prevSize : (knownSize ?? 0)
    })
  }, [knownSize])

  return (
    <HeightPreservingContainer {...props} size={size}>
      {children}
    </HeightPreservingContainer>
  )
})

const HeightPreservingContainer = styled.div<{ size: number }>`
  --child-height: ${(props) => `${props.size}px`};
  &:empty {
    min-height: calc(var(--child-height));
    box-sizing: border-box;
  }
`

export default VirtualizedList
