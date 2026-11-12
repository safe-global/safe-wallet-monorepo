import type * as PageTree from 'fumadocs-core/page-tree'

export const GITHUB_URL = 'https://github.com/safe-global/safe-wallet-monorepo'

export interface NavItem {
  title: string
  href: string
  /** Pathname prefix that marks the item active; `null` for an exact match */
  match: string | null
}

export const NAV_ITEMS: NavItem[] = [
  { title: 'Home', href: '/', match: null },
  { title: 'Docs', href: '/docs/', match: '/docs/' },
  { title: 'Get started', href: '/docs/installation/', match: null },
  { title: 'Components', href: '/components/', match: '/components/' },
  { title: 'Typeset', href: '/typeset/', match: '/typeset/' },
  { title: 'Create', href: '/create/', match: '/create/' },
]

const trimSlash = (path: string) => path.replace(/\/+$/, '') || '/'

export const isActive = (item: NavItem, pathname: string): boolean => {
  const current = trimSlash(pathname)
  if (item.match === null) return current === trimSlash(item.href)
  if (item.match === '/docs/' && current === trimSlash('/docs/installation/')) return false
  return current === trimSlash(item.match) || current.startsWith(item.match)
}

/** The page tree of one top-level content folder, so each section gets its own sidebar */
export const sectionTree = (root: PageTree.Root, folder: 'docs' | 'components'): PageTree.Root => {
  const node = root.children.find(
    (child): child is PageTree.Folder => child.type === 'folder' && child.$ref?.folder === folder,
  )
  if (!node) throw new Error(`No "${folder}" folder in the page tree`)
  return { name: node.name, children: node.index ? [node.index, ...node.children] : node.children }
}

/** Pages outside the Fumadocs source, for search suggestions and llms.txt */
export const SITE_PAGES = [
  { title: 'Home', url: '/', description: "Safe UI, Safe's design system for building Safe apps." },
  { title: 'Typeset', url: '/typeset/', description: 'The Safe type scale, rendered with your own sample text.' },
  {
    title: 'Create',
    url: '/create/',
    description: 'Generate the setup for a new project: framework, components and install path.',
  },
]
