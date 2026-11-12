import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc'
import { getProps, getRules } from '@/lib/generated'
import { withCode } from './inline-code'

const hasStylingProps = (component: string) =>
  getProps(component).components.some((doc) =>
    doc.props.some((prop) => prop.name === 'variant' || prop.name === 'size'),
  )

export function ComponentRules({ component }: { component: string }) {
  const rules = getRules().filter((rule) => rule.component === component)
  if (rules.length === 0) {
    if (!hasStylingProps(component)) return <p>No design-system lint rule covers this component.</p>
    return (
      <p>
        Pass <code>className</code> for layout only (width, margins, flex and grid). Use the <code>variant</code> and{' '}
        <code>size</code> props for the look.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-4" data-rules={component}>
      <p className="m-0">
        These come from the design-system ESLint rules (<code>@safe-global/ui/eslint</code>), so lint enforces them.
      </p>
      {rules.map((rule) => (
        <div key={rule.element} className="not-prose grid gap-3 rounded-xl border p-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="m-0 text-sm font-semibold text-fd-error">Don&apos;t</p>
            <p className="m-0 text-sm">{withCode(rule.dont)}</p>
            <ServerCodeBlock code={rule.example} lang="tsx" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="m-0 text-sm font-semibold text-fd-success">Do</p>
            <p className="m-0 text-sm">{withCode(rule.do)}</p>
            <p className="m-0 text-xs text-fd-muted-foreground">
              Escape hatch for a real one-off: <code>{rule.escapeHatch}</code>
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
