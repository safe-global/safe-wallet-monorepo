'use client'

import { useEffect, useState } from 'react'
import { Code } from '../site/code'
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
    <div data-registry-url={url}>
      <Code code={snippet(url)} lang="json" title="components.json" />
    </div>
  )
}
