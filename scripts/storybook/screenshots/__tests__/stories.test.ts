import { branchSlug, resolveBase, selectStories, statusOf, type StoryEntry } from '../stories'

const story = (id: string, title: string, name = 'Default'): StoryEntry => ({ id, title, name, type: 'story' })

describe('branchSlug', () => {
  it('matches the preview subdomain naming of the branch-slug action', () => {
    expect(branchSlug('design/policies-m2-edit-panels')).toBe('design-policies-m2-edit-panels')
    expect(branchSlug('refs/heads/Someone/feature--Design_Pass')).toBe('someone-feature-design-pass')
  })

  it('caps the slug at 50 characters without a trailing dash', () => {
    const slug = branchSlug(`feat/${'a'.repeat(44)}-bcd`)
    expect(slug.length).toBeLessThanOrEqual(50)
    expect(slug.endsWith('-')).toBe(false)
  })
})

describe('resolveBase', () => {
  it('maps dev to the dev environment', () => {
    expect(resolveBase('dev')).toEqual({
      site: 'https://safe-wallet-web.dev.5afe.dev',
      storybook: 'https://safe-wallet-web.dev.5afe.dev/storybook',
      branch: 'dev',
    })
  })

  it('maps a branch name to its preview', () => {
    expect(resolveBase('design/policies-m2').storybook).toBe(
      'https://design-policies-m2--walletweb.review.5afe.dev/storybook',
    )
  })

  it('accepts preview URLs pointing at the site, Storybook or a story', () => {
    const site = 'https://design-policies-m2--walletweb.review.5afe.dev'
    for (const input of [site, `${site}/storybook/`, `${site}/storybook/iframe.html`]) {
      expect(resolveBase(input)).toEqual({ site, storybook: `${site}/storybook`, branch: null })
    }
  })

  it('serves a local Storybook from its root', () => {
    expect(resolveBase('http://localhost:6006').storybook).toBe('http://localhost:6006')
  })

  it.each([
    'https://app.safe.global',
    'https://evilreview.5afe.dev',
    'https://preview.review.5afe.dev.example.com',
    'https://safe-wallet-web.staging.5afe.dev',
  ])('refuses %s', (input) => {
    expect(() => resolveBase(input)).toThrow(/Refusing/)
  })
})

describe('selectStories', () => {
  const entries = [
    story('pages-core-home--default', 'Pages/Core/Home'),
    story('pages-core-settings-data--default', 'Pages/Core/Settings/Data'),
    story('prototype-policies-m2-full-flow--flow', 'Prototype/Policies M2 – full flow', 'Flow'),
    { ...story('docs-intro--docs', 'Docs/Intro'), type: 'docs' },
  ]
  const ids = (patterns: string[]) => selectStories(entries, patterns).map((e) => e.id)

  it('lets ** cross title segments and * stay inside one', () => {
    expect(ids(['Pages/**'])).toEqual(['pages-core-home--default', 'pages-core-settings-data--default'])
    expect(ids(['Pages/Core/*'])).toEqual(['pages-core-home--default'])
  })

  it('matches titles that continue after a space, case-insensitively', () => {
    expect(ids(['prototype/policies m2*'])).toEqual(['prototype-policies-m2-full-flow--flow'])
  })

  it('matches exact story ids and skips docs entries', () => {
    expect(ids(['pages-core-home--default', 'Docs/**'])).toEqual(['pages-core-home--default'])
  })
})

describe('statusOf', () => {
  it('treats Pages as live and everything else as preview', () => {
    expect(statusOf(story('a', 'Pages/Core/Home'))).toBe('live')
    expect(statusOf(story('b', 'Features/SafeShield'))).toBe('preview')
  })
})
