import type { ReactNode } from 'react'

export type SafeUpdateViewProps = {
  decodedData: ReactNode
}

export function SafeUpdateView({ decodedData }: SafeUpdateViewProps) {
  return (
    <div className="mr-10 flex flex-col gap-4">
      <div className="bg-[var(--color-border-background)] w-full rounded-lg p-3 text-center text-lg font-bold">
        Safe version update
      </div>

      {decodedData}
    </div>
  )
}
