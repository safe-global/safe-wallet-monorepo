import { type RefObject, useCallback, useEffect, useRef } from 'react'

const SEARCH_ITEM_SELECTOR = '[data-search-item]'
const FOCUSED_ATTR = 'data-focused'

/**
 * Manages ArrowUp / ArrowDown / Enter keyboard navigation across all
 * `[data-search-item]` elements inside a scrollable container.
 *
 * Focused items receive a `data-focused` attribute so sections can
 * style them with Tailwind's `data-[focused]:` or `group-data-[focused]:` variants.
 *
 * @param containerRef - the scrollable area that holds the search items
 * @param query - current search string (focus resets on change)
 * @returns `onKeyDown` handler to attach to the dialog / wrapper element
 */
const useSearchKeyboardNavigation = (containerRef: RefObject<HTMLElement | null>, query: string) => {
  const indexRef = useRef(-1)

  // Reset focus when the query changes
  useEffect(() => {
    indexRef.current = -1
    containerRef.current?.querySelector(`[${FOCUSED_ATTR}]`)?.removeAttribute(FOCUSED_ATTR)
  }, [query, containerRef])

  const getItems = useCallback(
    () => containerRef.current?.querySelectorAll<HTMLElement>(SEARCH_ITEM_SELECTOR) ?? [],
    [containerRef],
  )

  const setFocus = useCallback(
    (next: number) => {
      const items = getItems()

      // Clear previous
      items.forEach((el) => el.removeAttribute(FOCUSED_ATTR))

      if (next >= 0 && next < items.length) {
        indexRef.current = next
        items[next].setAttribute(FOCUSED_ATTR, '')
        items[next].scrollIntoView({ block: 'nearest' })
      } else {
        indexRef.current = -1
      }
    },
    [getItems],
  )

  // Returned as a React onKeyDown so it works inside focus-trapped dialogs
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = getItems()
      if (items.length === 0) return

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          setFocus(Math.min(indexRef.current + 1, items.length - 1))
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          setFocus(Math.max(indexRef.current - 1, 0))
          break
        }
        case 'Enter': {
          if (indexRef.current < 0) return
          e.preventDefault()

          const focused = items[indexRef.current]
          // Buttons are directly clickable; wrapper divs delegate to their first child
          const target = focused.tagName === 'BUTTON' ? focused : (focused.firstElementChild as HTMLElement | null)
          target?.click()
          break
        }
      }
    },
    [getItems, setFocus],
  )

  return { onKeyDown }
}

export default useSearchKeyboardNavigation
