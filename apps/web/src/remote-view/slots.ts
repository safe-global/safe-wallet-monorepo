import { createContext, useContext, type ReactNode } from 'react'

export const SlotContext = createContext<Map<string, ReactNode>>(new Map())

export const useSlot = (name: unknown): ReactNode => {
  const slots = useContext(SlotContext)
  return typeof name === 'string' ? (slots.get(name) ?? null) : null
}

// Origins of https URLs the app passed to a view: the view may link there, and nowhere else outside the allowlist.
export const PropUrlsContext = createContext<Set<string>>(new Set())

export const usePropUrls = () => useContext(PropUrlsContext)

// Identifies one RemoteView, so event forwarding can tell its elements from those of views nested in its slots.
export const ViewTokenContext = createContext<object>({})

export const useViewToken = () => useContext(ViewTokenContext)
