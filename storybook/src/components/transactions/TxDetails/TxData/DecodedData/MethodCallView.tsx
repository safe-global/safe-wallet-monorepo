import type { ReactNode } from 'react'

export type MethodCallViewProps = {
  method: string
  contract: ReactNode
}

export const MethodCallView = ({ method, contract }: MethodCallViewProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 font-bold md:flex-nowrap">
      Call
      <code className="bg-[var(--color-background-main)] whitespace-nowrap rounded-sm px-2 py-1 font-mono text-sm font-normal">
        {method}
      </code>{' '}
      on
      {contract}
    </div>
  )
}
