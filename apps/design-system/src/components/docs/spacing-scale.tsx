import { getTokens } from '@/lib/generated'

export function SpacingScale() {
  const tokens = getTokens().tokens.filter((token) => token.group === 'spacing')
  return (
    <div className="not-prose flex flex-col gap-2" data-spacing-scale>
      {tokens.map((token) => (
        <div key={token.name} className="flex items-center gap-4">
          <code className="w-24 shrink-0 text-xs">{token.name}</code>
          <span className="w-12 shrink-0 font-mono text-xs text-fd-muted-foreground">{token.light}</span>
          <div className="h-4 rounded-sm bg-primary" style={{ width: `var(${token.name})` }} />
        </div>
      ))}
    </div>
  )
}
