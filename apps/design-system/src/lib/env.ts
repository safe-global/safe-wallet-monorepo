import { normaliseBasePath } from './base-path.mjs'

export { normaliseBasePath }

export const REGISTRY_NAMESPACE = '@safe'

export const normaliseUrl = (value: string | undefined): string => (value ?? '').trim().replace(/\/+$/, '')

export const basePath = normaliseBasePath(process.env.NEXT_PUBLIC_BASE_PATH)
export const siteUrl = normaliseUrl(process.env.NEXT_PUBLIC_SITE_URL)
export const registryUrlTemplate = (process.env.NEXT_PUBLIC_REGISTRY_URL ?? '').trim()

export const withBasePath = (path: string, base: string = basePath): string =>
  `${base}${path.startsWith('/') ? path : `/${path}`}`

export const PLACEHOLDER_ORIGIN = 'https://<docs-host>'

/** The `{name}` URL for components.json: the build-time template, the served origin, or a placeholder before hydration */
export const resolveRegistryUrl = ({
  template = registryUrlTemplate,
  origin,
  base = basePath,
}: {
  template?: string
  origin?: string
  base?: string
}): string => {
  if (template) return template
  return `${normaliseUrl(origin) || PLACEHOLDER_ORIGIN}${base}/r/{name}.json`
}
