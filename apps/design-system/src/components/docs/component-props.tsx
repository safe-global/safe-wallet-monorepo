import { TypeTable, type TypeNode } from 'fumadocs-ui/components/type-table'
import { getProps } from '@/lib/generated'
import type { CvaVariantsDoc, PropDoc } from '@/lib/types'

const toTypeNode = (prop: PropDoc): TypeNode => ({
  type: prop.type.length > 60 ? `${prop.type.slice(0, 57)}…` : prop.type,
  ...(prop.type.length > 60 ? { typeDescription: prop.type } : {}),
  ...(prop.description ? { description: prop.description } : {}),
  ...(prop.default !== undefined ? { default: prop.default } : {}),
  required: prop.required,
})

function VariantsTable({ doc }: { doc: CvaVariantsDoc }) {
  return (
    <TypeTable
      data-props-table={doc.name}
      type={Object.fromEntries(
        Object.entries(doc.variants).map(([key, values]) => [
          key,
          {
            type: values.map((value) => `"${value}"`).join(' | '),
            ...(doc.defaultVariants[key] ? { default: `"${doc.defaultVariants[key]}"` } : {}),
          },
        ]),
      )}
    />
  )
}

export function ComponentProps({ component }: { component: string }) {
  const { components, cva } = getProps(component)
  if (components.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {cva.map((doc) => (
          <section key={doc.name}>
            <h3 className="mt-0 font-mono text-base">{doc.name}()</h3>
            <p>
              A <code>cva</code> function, not a component: call it with these variants to get the class names.
            </p>
            <VariantsTable doc={doc} />
          </section>
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      {components.map((doc) => (
        <section key={doc.displayName}>
          <h3 className="mt-0 font-mono text-base">{doc.displayName}</h3>
          {doc.props.length ? (
            <TypeTable
              data-props-table={doc.displayName}
              type={Object.fromEntries(doc.props.map((prop) => [prop.name, toTypeNode(prop)]))}
            />
          ) : (
            <p data-props-table={doc.displayName}>No props of its own.</p>
          )}
          <p className="text-sm text-fd-muted-foreground">
            Also accepts the props of the element or Base UI part it renders.
          </p>
        </section>
      ))}
    </div>
  )
}
