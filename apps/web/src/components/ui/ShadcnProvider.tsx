'use client'

import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react'
import { cn } from '@/utils/cn'

type PortalContainerContextType = React.Context<RefObject<HTMLDivElement | null> | null>

// Singleton context: survives bundler module duplication (e.g. Storybook resolving
// the same file via both relative and alias paths). Both the Provider (in the
// decorator) and usePortalContainer (in component files) must share the exact
// same React context object, so we stash it on globalThis.
const CONTEXT_KEY = Symbol.for('shadcn-portal-container-context')

function getOrCreateContext(): PortalContainerContextType {
  const g = globalThis as Record<symbol, PortalContainerContextType | undefined>
  if (!g[CONTEXT_KEY]) {
    g[CONTEXT_KEY] = createContext<RefObject<HTMLDivElement | null> | null>(null)
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
  const ref = useContext(PortalContainerContext)
  return ref ?? undefined
}

/**
 * Like usePortalContainer but resolves the ref to an element.
 * Use this for libraries (e.g. Vaul) that don't accept RefObject as a container.
 * NOTE: returns null on the first render if ShadcnProvider hasn't committed yet.
 */
export function usePortalContainerElement(): HTMLDivElement | null {
  const ref = useContext(PortalContainerContext)
  return ref?.current ?? null
}

export function ShadcnProvider({ children, dark }: { children: ReactNode; dark?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <PortalContainerContext.Provider value={containerRef}>
      <div className={cn('shadcn-scope', dark && 'dark')} ref={containerRef}>
        {children}
      </div>
    </PortalContainerContext.Provider>
  )
}
