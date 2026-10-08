import type { ReactElement, ReactNode } from 'react'

export type SanctionWrapperViewProps = {
  blockedAddress: ReactNode
}

export function SanctionWrapperView({ blockedAddress }: SanctionWrapperViewProps): ReactElement {
  return <div className="flex flex-1 flex-col items-center justify-center">{blockedAddress}</div>
}
