import type { ReactNode } from 'react'

export type JsonViewViewProps = {
  json: string
  copyButton: ReactNode
}

export const JsonViewView = ({ json, copyButton }: JsonViewViewProps) => {
  return (
    <div className="flex flex-col rounded bg-[var(--color-background-paper)] p-4">
      <div className="-m-2 self-end">{copyButton}</div>

      <code className="font-mono text-xs leading-4 break-words whitespace-pre-wrap">{json}</code>
    </div>
  )
}
