import { useEffect, useEffectEvent, useState } from 'react'
import { SIDEBAR } from '../constants'
import type { TourStep } from '../types'
import { toStopLayout } from '../utils'
import { useElementRect } from './useElementRect'

export const ANCHOR_TIMEOUT_MS = 5000

const WATCHED_ATTRIBUTES = ['aria-selected', 'data-testid', 'data-tour', 'hidden']

type StopElements = {
  anchor: Element | null
  emptyState: Element | null
  sidebarItem: Element | null
  sidebar: Element | null
  tabToClick: Element | null
}

const NO_ELEMENTS: StopElements = { anchor: null, emptyState: null, sidebarItem: null, sidebar: null, tabToClick: null }

const query = (selector?: string) => (selector ? document.querySelector(selector) : null)

const isSameElements = (a: StopElements, b: StopElements) =>
  (Object.keys(a) as (keyof StopElements)[]).every((key) => a[key] === b[key])

const findStopElements = (step: TourStep, isOnStepRoute: boolean): StopElements => {
  const anchor = isOnStepRoute ? query(step.anchor) : null
  return {
    anchor,
    emptyState: anchor ? query(step.emptyState) : null,
    sidebarItem: query(step.sidebarItem),
    sidebar: step.sidebarItem ? query(SIDEBAR) : null,
    tabToClick: isOnStepRoute ? query(step.tabToClick) : null,
  }
}

export const useStopLayout = (step: TourStep, isOnStepRoute: boolean, onMissingTarget: () => void) => {
  const [elements, setElements] = useState<StopElements>(NO_ELEMENTS)
  const reportMissing = useEffectEvent(onMissingTarget)

  useEffect(() => {
    const targetSelector = step.anchor ? (isOnStepRoute ? step.anchor : undefined) : step.sidebarItem
    const sync = () => {
      const next = findStopElements(step, isOnStepRoute)
      setElements((current) => (isSameElements(current, next) ? current : next))
    }
    // Anchors render after their page's data loads and are replaced when tabs switch, so keep following the selectors.
    const observer = new MutationObserver(sync)
    const timeout = targetSelector
      ? window.setTimeout(() => {
          if (!document.querySelector(targetSelector)) {
            reportMissing()
          }
        }, ANCHOR_TIMEOUT_MS)
      : undefined

    sync()
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: WATCHED_ATTRIBUTES,
    })

    return () => {
      observer.disconnect()
      window.clearTimeout(timeout)
    }
  }, [step, isOnStepRoute])

  const anchorRect = useElementRect(elements.anchor)
  const emptyStateRect = useElementRect(elements.emptyState)
  const sidebarItemRect = useElementRect(elements.sidebarItem)
  const sidebarRect = useElementRect(elements.sidebar)

  return {
    target: step.anchor ? elements.anchor : elements.sidebarItem,
    tabToClick: elements.tabToClick,
    layout: toStopLayout({
      anchor: anchorRect,
      emptyState: emptyStateRect,
      sidebarItem: sidebarItemRect,
      sidebar: sidebarRect,
    }),
  }
}
