'use client'

import { useEffect, useState } from 'react'
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock'
import { REGISTRY_NAMESPACE, resolveRegistryUrl } from '@/lib/env'

const snippet = (url: string) =>
  JSON.stringify({ registries: { [REGISTRY_NAMESPACE]: url } }, null, 2).replace(/^\{\n|\n\}$/g, '')

/** The `registries` entry for components.json, pointing at the registry on the host that serves this page */
export function RegistrySnippet() {
  const [url, setUrl] = useState(() => resolveRegistryUrl({}))

  useEffect(() => {
    setUrl(resolveRegistryUrl({ origin: window.location.origin }))
  }, [])

  return (
    <CodeBlock title="components.json" data-registry-url={url}>
      <Pre>
        <code>{snippet(url)}</code>
      </Pre>
    </CodeBlock>
  )
}
