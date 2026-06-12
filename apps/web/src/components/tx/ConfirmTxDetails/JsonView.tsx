import { useMemo } from 'react'
import CopyButton from '@/components/common/CopyButton'

export const JsonView = ({ data }: { data: unknown }) => {
  const json = useMemo(() => JSON.stringify(data, null, 2), [data])

  return (
    <div className="flex flex-col rounded bg-[var(--color-background-paper)] p-4">
      <div className="-m-2 self-end">
        <CopyButton text={json} />
      </div>

      <code className="font-mono text-xs leading-4 break-words whitespace-pre-wrap">{json}</code>
    </div>
  )
}
