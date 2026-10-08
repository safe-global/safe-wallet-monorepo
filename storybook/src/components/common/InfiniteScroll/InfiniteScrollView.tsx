import type { ReactElement, RefObject } from 'react'

export type InfiniteScrollViewProps = {
  elementRef: RefObject<HTMLDivElement | null>
}

export function InfiniteScrollView({ elementRef }: InfiniteScrollViewProps): ReactElement {
  return <div ref={elementRef} />
}
