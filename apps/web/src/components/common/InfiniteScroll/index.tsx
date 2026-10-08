import { useEffect, useRef, type ReactElement } from 'react'
import useOnceVisible from '@/hooks/useOnceVisible'
import { InfiniteScrollView } from '@views/components/common/InfiniteScroll/InfiniteScrollView'

const InfiniteScroll = ({ onLoadMore }: { onLoadMore: () => void }): ReactElement => {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const isVisible = useOnceVisible(elementRef)

  useEffect(() => {
    if (isVisible) {
      onLoadMore()
    }
  }, [isVisible, onLoadMore])

  return <InfiniteScrollView elementRef={elementRef} />
}

export default InfiniteScroll
