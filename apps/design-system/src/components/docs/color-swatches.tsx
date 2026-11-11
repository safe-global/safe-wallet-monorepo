import { getTokens } from '@/lib/generated'
import type { TokenGroup } from '@/lib/types'
import { modeValues, resolveValue } from './tokens'

function Swatch({ label, raw, resolved }: { label: string; raw?: string; resolved?: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div
        className="h-12 rounded-lg border"
        style={{ background: resolved ?? 'transparent' }}
        title={resolved ?? 'not set'}
      />
      <span className="text-[11px] text-fd-muted-foreground">{label}</span>
      <span className="truncate font-mono text-[11px]">{raw ?? '—'}</span>
      {resolved && resolved !== raw ? (
        <span className="truncate font-mono text-[11px] text-fd-muted-foreground">{resolved}</span>
      ) : null}
    </div>
  )
}

export function ColorSwatches({ group = 'color' }: { group?: Extract<TokenGroup, 'color' | 'palette'> }) {
  const all = getTokens().tokens
  const values = modeValues(all)
  const tokens = all.filter((token) => token.group === group)
  return (
    <div className="not-prose flex flex-col gap-3" data-swatches={group}>
      <p className="m-0 text-sm text-fd-muted-foreground">{tokens.length} variables</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tokens.map((token) => {
          const dark = token.dark ?? token.light
          return (
            <div key={token.name} className="flex flex-col gap-2 rounded-xl border p-3" data-token={token.name}>
              <div className="flex items-baseline justify-between gap-2">
                <code className="truncate text-xs font-semibold">{token.name}</code>
                {token.tailwind ? <code className="text-[11px] text-fd-muted-foreground">{token.tailwind}</code> : null}
              </div>
              <div className="flex gap-2">
                <Swatch label="Light" raw={token.light} resolved={resolveValue(token.light, values.light)} />
                <Swatch label="Dark" raw={dark} resolved={resolveValue(dark, values.dark)} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
