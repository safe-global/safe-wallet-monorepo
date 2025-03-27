import { type RefObject, useEffect, useState } from 'react'

// A hook to detect when an element is visible in the viewport for the first time
const useOnceVisible = (element: RefObject<HTMLElement | null>): boolean => {
  const [onceVisible, setOnceVisible] = useState<boolean>(false)

  useEffect(() => {
    if (!element.current) return

    const observer = new IntersectionObserver(([entry], obs) => {
      if (entry.isIntersecting) {
        setOnceVisible(true)
        obs.unobserve(entry.target)
      }
    })

    observer.observe(element.current)

    return () => {
      observer.disconnect()
    }
  }, [element])

  return onceVisible
}

export default useOnceVisible
