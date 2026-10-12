import { createContext, isValidElement, useContext, type ElementType, type ReactNode } from 'react'
import type { Slots } from './remoteProps'

export const SlotContext = createContext<Slots>(new Map())

export const useSlot = (name: unknown): ReactNode => {
  const content = useContext(SlotContext).get(String(name))
  return content == null || isValidElement(content) || typeof content !== 'object' ? (content as ReactNode) : null
}

export const useSlotComponent = (name: unknown): ElementType | null => {
  const component = useContext(SlotContext).get(String(name))
  return component != null && !isValidElement(component) && typeof component !== 'string'
    ? (component as ElementType)
    : null
}

// Origins of https URLs the app passed to a view: the view may link there, and nowhere else outside the allowlist.
export const PropUrlsContext = createContext<Set<string>>(new Set())

export const usePropUrls = () => useContext(PropUrlsContext)

// Identifies one RemoteView, so event forwarding can tell its elements from those of views nested in its slots.
export const ViewTokenContext = createContext<object>({})

export const useViewToken = () => useContext(ViewTokenContext)
