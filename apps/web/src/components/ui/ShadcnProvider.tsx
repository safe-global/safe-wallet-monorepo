'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { cn } from '@/utils/cn'

interface PortalContainerValue {
  ref: RefObject<HTMLDivElement | null>
  element: HTMLDivElement | null
}

type PortalContainerContextType = React.Context<PortalContainerValue | null>

// Singleton context: survives bundler module duplication (e.g. Storybook resolving
// the same file via both relative and alias paths). Both the Provider (in the
// decorator) and usePortalContainer (in component files) must share the exact
// same React context object, so we stash it on globalThis.
const CONTEXT_KEY = Symbol.for('shadcn-portal-container-context')

function getOrCreateContext(): PortalContainerContextType {
  const g = globalThis as Record<symbol, PortalContainerContextType | undefined>
  if (!g[CONTEXT_KEY]) {
    g[CONTEXT_KEY] = createContext<PortalContainerValue | null>(null)
  }
  return g[CONTEXT_KEY]
}

const PortalContainerContext = getOrCreateContext()

/**
 * Returns a ref to the portal container for shadcn components that use portals.
 * When used inside a ShadcnProvider, portals render into the .shadcn-scope div
 * so they inherit the scoped CSS variables. Returns undefined outside of a provider
 * (falls back to document.body).
 *
 * Returns the RefObject (not .current) so base-ui Portal can read it lazily —
 * this avoids timing issues when the portal component renders in the same
 * commit as the ShadcnProvider (before the ref is attached to the DOM).
 */
export function usePortalContainer(): RefObject<HTMLDivElement | null> | undefined {
  const ctx = useContext(PortalContainerContext)
  return ctx?.ref ?? undefined
}

/**
 * Like usePortalContainer but resolves the ref to an element.
 * Use this for libraries (e.g. Vaul) that don't accept RefObject as a container.
 * The element is stored via state so consumers re-render once the DOM node mounts.
 */
export function usePortalContainerElement(): HTMLDivElement | null {
  const ctx = useContext(PortalContainerContext)
  return ctx?.element ?? null
}

export function ShadcnProvider({ children, dark }: { children: ReactNode; dark?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [element, setElement] = useState<HTMLDivElement | null>(null)

  // Callback ref: fires when the DOM node mounts/unmounts, keeping both
  // the ref object and the state-based element in sync.
  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
    setElement(node)
  }, [])

  const value = useMemo<PortalContainerValue>(() => ({ ref: containerRef, element }), [element])

  return (
    <PortalContainerContext.Provider value={value}>
      <div className={cn('shadcn-scope', dark && 'dark')} ref={callbackRef}>
        {children}
      </div>
    </PortalContainerContext.Provider>
  )
}
