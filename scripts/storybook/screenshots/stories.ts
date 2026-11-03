export type Status = 'live' | 'preview'

export interface StoryEntry {
  id: string
  title: string
  name: string
  type: string
}

export const PREVIEW_DOMAIN = 'review.5afe.dev'
export const DEV_SITE = 'https://safe-wallet-web.dev.5afe.dev'
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]']

// Same rule as .github/actions/branch-slug, which names the preview subdomains
export function branchSlug(branch: string): string {
  return branch
    .replace(/^refs\/heads\//, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 50)
    .replace(/-$/, '')
}

export function resolveBase(input: string): { site: string; storybook: string; branch: string | null } {
  if (!/^https?:\/\//.test(input)) {
    // dev deploys to its own environment rather than a branch preview
    const site = input === 'dev' ? DEV_SITE : `https://${branchSlug(input)}--walletweb.${PREVIEW_DOMAIN}`
    return { site, storybook: `${site}/storybook`, branch: input }
  }
  const url = new URL(input)
  const isLocal = LOCAL_HOSTS.includes(url.hostname)
  if (!isLocal && !url.hostname.endsWith(`.${PREVIEW_DOMAIN}`) && url.origin !== DEV_SITE) {
    throw new Error(
      `Refusing ${url.hostname}: only branch previews (*.${PREVIEW_DOMAIN}), the dev environment or a local Storybook. Never production.`,
    )
  }
  const pathname = url.pathname.replace(/\/(index\.json|iframe\.html|index\.html)?$/, '')
  const sbAt = pathname.indexOf('/storybook')
  let storybook: string
  if (sbAt >= 0) storybook = url.origin + pathname.slice(0, sbAt) + '/storybook'
  else if (isLocal)
    storybook = url.origin + pathname // `yarn storybook` serves at the root
  else storybook = url.origin + '/storybook'
  return { site: url.origin, storybook, branch: null }
}

export function globToRegExp(glob: string): RegExp {
  const escape = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  const body = glob
    .split('**')
    .map((part) => part.split('*').map(escape).join('[^/]*'))
    .join('.*')
  return new RegExp(`^${body}$`, 'i')
}

export function selectStories(entries: StoryEntry[], patterns: string[]): StoryEntry[] {
  const matchers = patterns.map((p) => ({ id: p, re: globToRegExp(p) }))
  return entries.filter(
    (e) =>
      e.type === 'story' &&
      matchers.some((m) => m.id === e.id || m.re.test(e.title) || m.re.test(`${e.title}/${e.name}`)),
  )
}

export function statusOf(story: StoryEntry): Status {
  return story.title.startsWith('Pages/') ? 'live' : 'preview'
}
