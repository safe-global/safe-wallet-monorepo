import { RefObject, useEffect, useRef, useState } from 'react'

type useElementHeightTypes<T extends HTMLElement> = {
  height: number | undefined
  elementRef: RefObject<T | null>
}

const useElementHeight = <T extends HTMLElement>(): useElementHeightTypes<T> => {
  const elementRef = useRef<T | null>(null)

  const [height, setHeight] = useState<number | undefined>()

  useEffect(() => {
    // hack to calculate properly the height of a container
    setTimeout(() => {
      const height = elementRef?.current?.clientHeight
      setHeight(height)
    }, 10)
  }, [elementRef])

  return { height, elementRef }
}

export default useElementHeight
