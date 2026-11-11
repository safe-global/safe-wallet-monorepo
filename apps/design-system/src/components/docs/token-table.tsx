import { getTokens } from '@/lib/generated'
import type { TokenGroup } from '@/lib/types'

export function TokenTable({ group }: { group?: TokenGroup }) {
  const tokens = getTokens().tokens.filter((token) => !group || token.group === group)
  return (
    <div className="not-prose overflow-x-auto rounded-xl border" data-token-table={group ?? 'all'}>
      <table className="w-full text-left text-sm">
        <thead className="bg-fd-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Variable</th>
            <th className="px-3 py-2 font-medium">Light</th>
            <th className="px-3 py-2 font-medium">Dark</th>
            <th className="px-3 py-2 font-medium">Utility</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr key={token.name} className="border-t" data-token={token.name}>
              <td className="px-3 py-1.5 font-mono text-xs">{token.name}</td>
              <td className="px-3 py-1.5 font-mono text-xs">{token.light ?? '—'}</td>
              <td className="px-3 py-1.5 font-mono text-xs">{token.dark ?? token.light}</td>
              <td className="px-3 py-1.5 font-mono text-xs">{token.tailwind ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="m-0 border-t px-3 py-2 text-xs text-fd-muted-foreground">{tokens.length} variables</p>
    </div>
  )
}
