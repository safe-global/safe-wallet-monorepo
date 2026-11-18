import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc'
import { Callout } from 'fumadocs-ui/components/callout'
import { getLayer, getProps } from '@/lib/generated'
import { importPath } from '@/lib/import-path'
import { RegistrySnippet } from './registry-snippet'

export const importLine = (component: string): string => {
  const { components, cva } = getProps(component)
  const names = components.length ? components.map((doc) => doc.displayName) : cva.map((doc) => doc.name)
  return `import { ${names.join(', ')} } from '${importPath(component, getLayer(component))}'`
}

export function ComponentInstall({ component }: { component: string }) {
  return (
    <Tabs items={['npm', 'shadcn registry']} className="not-prose">
      <Tab value="npm">
        <div className="flex flex-col gap-3">
          <ServerCodeBlock code="yarn add @safe-global/ui" lang="bash" />
          <ServerCodeBlock code={importLine(component)} lang="tsx" />
          <Callout type="info">
            The package is not published to npm yet; inside the monorepo it is the workspace{' '}
            <code>@safe-global/ui</code>. See Installation for the CSS setup.
          </Callout>
        </div>
      </Tab>
      <Tab value="shadcn registry">
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm">
            Add the Safe registry to <code>components.json</code> once, then copy the component into your app:
          </p>
          <RegistrySnippet />
          <ServerCodeBlock code={`npx shadcn@latest add @safe/${component}`} lang="bash" />
        </div>
      </Tab>
    </Tabs>
  )
}
