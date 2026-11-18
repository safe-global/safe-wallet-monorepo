import { getTokens } from '@/lib/generated'

export function RadiusScale() {
  const { theme, tokens } = getTokens()
  const scale = theme.filter((mapping) => mapping.name.startsWith('--radius-'))
  const base = tokens.find((token) => token.name === '--radius')
  return (
    <div className="not-prose flex flex-col gap-4" data-radius-scale>
      {base ? (
        <p className="m-0 text-sm">
          <code>--radius</code> is <code>{base.light}</code>; the scale below is set in the Tailwind theme.
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {scale.map((mapping) => (
          <div key={mapping.name} className="flex flex-col items-center gap-2">
            <div className="size-20 border-2 border-primary bg-muted" style={{ borderRadius: mapping.value }} />
            <code className="text-xs">rounded-{mapping.name.slice('--radius-'.length)}</code>
            <span className="font-mono text-[11px] text-fd-muted-foreground">{mapping.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
