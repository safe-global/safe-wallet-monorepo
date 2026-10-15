import type { ReactElement, ReactNode } from 'react'

export const DrawerFooter = ({
  children,
  safeArea = false,
}: {
  children?: ReactNode
  safeArea?: boolean
}): ReactElement => (
  <div
    className="px-6 pb-6"
    style={safeArea ? { paddingBottom: 'max(calc(var(--spacing) * 6), env(safe-area-inset-bottom))' } : undefined}
  >
    {children}
  </div>
)
