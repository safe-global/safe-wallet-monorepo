import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import type { StoryIndex } from '../src/lib/types'

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = path.join(appDir, 'content/docs')

/** Console errors that are expected, each with a reason */
const CONSOLE_ALLOWLIST: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /https:\/\/example\.com\/does-not-exist\.png/,
    reason: 'the Avatar story loads a deliberately broken image to show AvatarFallback',
  },
]

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })

const docsPages = walk(contentDir)
  .filter((file) => file.endsWith('.mdx'))
  .map((file) => {
    const slug = path
      .relative(contentDir, file)
      .replace(/\.mdx$/, '')
      .replace(/(^|\/)index$/, '')
    return slug ? `${slug}/` : ''
  })
  .sort()
const sitePages = ['', 'typeset/', 'create/']
const allPages = [...sitePages, ...docsPages]
const componentPages = docsPages.filter((page) => page.startsWith('components/') && page !== 'components/')
const NAV = ['Home', 'Docs', 'Get started', 'Components', 'Typeset', 'Create']
const storyIndex = JSON.parse(readFileSync(path.join(appDir, 'src/generated/story-index.json'), 'utf8')) as StoryIndex
const previewPages = storyIndex.flatMap(({ component, stories }) =>
  stories.map(({ slug }) => `preview/${component}/${slug}/`),
)

const trackErrors = (page: Page) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    const text = `${message.text()} (${message.location().url})`
    if (!CONSOLE_ALLOWLIST.some(({ pattern }) => pattern.test(text))) errors.push(text)
  })
  return errors
}

test.describe('site and docs pages', () => {
  for (const route of allPages) {
    test(`/${route}`, async ({ page, request, baseURL }) => {
      const errors = trackErrors(page)
      const response = await page.goto(route, { waitUntil: 'load' })
      expect(response?.status()).toBe(200)
      await expect(page.locator('h1').first()).toBeVisible()
      const nav = page.locator('[data-site-header] nav[aria-label="Main"] a')
      await expect(nav).toHaveText(NAV)
      await expect(page.locator('[data-site-header] a[href$="/create/"]', { hasText: 'New project' })).toBeVisible()
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)

      const origin = new URL(baseURL!).origin
      const hrefs = await page.$$eval('a[href]', (anchors) => anchors.map((a) => (a as HTMLAnchorElement).href))
      const internal = [...new Set(hrefs.map((href) => href.split('#')[0]).filter((href) => href.startsWith(origin)))]
      for (const href of internal) {
        const linked = await request.get(href)
        expect(linked.status(), `${route} links to ${href}`).toBe(200)
      }

      if (componentPages.includes(route)) {
        const frames = page.locator('iframe[data-story-frame]')
        const count = await frames.count()
        expect(count, 'at least one preview').toBeGreaterThan(0)
        for (let i = 0; i < count; i++) {
          const frame = frames.nth(i)
          if (!(await frame.isVisible())) continue
          await frame.scrollIntoViewIfNeeded()
          const name = await frame.getAttribute('data-story-frame')
          await expect(frame.contentFrame().locator('#story-root > *').first(), `preview ${name} renders`).toBeAttached(
            { timeout: 15_000 },
          )
        }
        await expect(page.locator('[data-props-table]').first()).toBeAttached()
      }

      if (route === 'components/') {
        await expect(page.locator('[data-component-card]')).toHaveCount(componentPages.length)
        await expect(page.getByRole('heading', { level: 2, name: 'Primitives' })).toBeVisible()
        await expect(page.getByRole('heading', { level: 2, name: 'Safe components' })).toBeVisible()
        await expect(page.locator('[data-component-section="component"] [data-component-card]')).toHaveCount(
          storyIndex.filter((entry) => entry.layer === 'component').length,
        )
        await expect(page.locator('#nd-sidebar').getByText('Primitives', { exact: true })).toBeAttached()
        await expect(page.locator('#nd-sidebar').getByText('Safe components', { exact: true })).toBeAttached()
        await page.getByLabel('Filter components').fill('calendar')
        await expect(page.locator('[data-component-card]')).toHaveCount(1)
      }

      await page.waitForTimeout(250)
      expect(errors, 'console errors').toEqual([])
    })
  }
})

test.describe('preview pages', () => {
  for (const route of previewPages) {
    test(`/${route}`, async ({ page }) => {
      const errors = trackErrors(page)
      const response = await page.goto(route, { waitUntil: 'networkidle' })
      expect(response?.status()).toBe(200)
      await expect(page.locator('#story-root > *').first()).toBeAttached()
      expect(errors, 'console errors').toEqual([])
    })
  }
})

test('there is one component page per story file', () => {
  expect(componentPages.map((page) => page.split('/')[1]).sort()).toEqual(
    storyIndex.map((entry) => entry.component).sort(),
  )
})

test('serves the registry as JSON', async ({ request }) => {
  const index = await request.get('r/registry.json')
  expect(index.status()).toBe(200)
  const registry = (await index.json()) as { items: Array<{ name: string }> }
  expect(registry.items.length).toBeGreaterThan(50)
  for (const { name } of registry.items) {
    const item = await request.get(`r/${name}.json`)
    expect(item.status(), name).toBe(200)
    expect(item.headers()['content-type']).toContain('json')
    expect(((await item.json()) as { name: string }).name).toBe(name)
  }
})

test('serves llms.txt with every page', async ({ request }) => {
  const response = await request.get('llms.txt')
  expect(response.status()).toBe(200)
  const text = await response.text()
  for (const route of allPages) expect(text).toContain(`/${route})`)
})

test.describe('features', () => {
  test('⌘K search finds the Button page', async ({ page }) => {
    await page.goto('', { waitUntil: 'networkidle' })
    await page.keyboard.press('ControlOrMeta+k')
    const input = page.getByRole('dialog').locator('input')
    await expect(input).toBeVisible()
    await input.fill('button')
    await expect(page.getByRole('option', { name: /Components.*Button$/ }).first()).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/components\/button\/$/)
  })

  test('the theme toggle switches the page and the open previews', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('components/button/', { waitUntil: 'networkidle' })
    const frame = page.locator('iframe[data-story-frame]').first()
    await expect(frame.contentFrame().locator('#story-root > *').first()).toBeAttached()
    const html = page.locator('html')
    const frameHtml = frame.contentFrame().locator('html')
    await expect(html).not.toHaveClass(/\bdark\b/)
    await page.locator('button[data-theme-toggle]:visible').first().click()
    await expect(html).toHaveClass(/\bdark\b/)
    await expect(frameHtml).toHaveClass(/\bdark\b/)
    await page.locator('button[data-theme-toggle]:visible').first().click()
    await expect(html).not.toHaveClass(/\bdark\b/)
    await expect(frameHtml).not.toHaveClass(/\bdark\b/)
  })

  test('the copy button on a Code tab writes to the clipboard', async ({ page, context, baseURL }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(baseURL!).origin })
    await page.goto('components/button/', { waitUntil: 'networkidle' })
    const tabs = page.locator('[data-story-tabs]').first()
    await tabs.getByRole('tab', { name: 'Code' }).click()
    await tabs.getByRole('button', { name: 'Copy Text' }).first().click()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toContain("from '@safe-global/ui/primitives/button'")
  })

  test('the mobile header collapses into a menu sheet and the page does not scroll sideways', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    for (const route of ['', 'components/button/']) {
      await page.goto(route, { waitUntil: 'load' })
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, `/${route} scrolls sideways`).toBeLessThanOrEqual(0)
    }
    await expect(page.locator('[data-site-header] nav[aria-label="Main"]')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open Sidebar' }).first()).toBeVisible()
    await page.getByRole('button', { name: 'Open menu' }).click()
    const menu = page.locator('[data-mobile-menu]')
    await expect(menu).toBeVisible()
    await expect(menu.locator('nav[aria-label="Main"] a')).toHaveText(NAV)
    await menu.getByRole('link', { name: 'Typeset' }).click()
    await expect(page).toHaveURL(/typeset\/$/)
  })

  test('the Create output follows the options', async ({ page }) => {
    await page.goto('create/', { waitUntil: 'load' })
    const output = (id: string) => page.locator(`[data-output="${id}"]`)
    await expect(output('add')).toContainText('npx shadcn@latest add @safe/theme @safe/button')
    await expect(output('components-json')).toContainText('"rsc": false')
    await expect(page.getByRole('radiogroup', { name: 'Framework' })).toBeVisible()
    await expect(page.getByRole('radiogroup', { name: 'Install path' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Next.js' })).not.toBeChecked()
    await expect(page.getByRole('checkbox', { name: 'Button', exact: true })).toBeChecked()
    await page.getByRole('checkbox', { name: 'Calendar', exact: true }).click()
    await expect(output('add')).toContainText('@safe/calendar')
    await expect(output('css')).toContainText("@import 'tailwindcss';")
    await page.getByRole('radio', { name: 'Next.js' }).click()
    await expect(page.getByRole('radio', { name: 'Next.js' })).toBeChecked()
    await expect(output('components-json')).toContainText('"rsc": true')
    await expect(output('components-json')).toContainText('src/app/globals.css')
    await page.locator('[data-preset="Overlays"]').click()
    await expect(output('add')).toContainText('@safe/sheet')
    await page.getByRole('radio', { name: 'npm package' }).click()
    await expect(page.locator('[data-npm-note]')).toContainText('not published to npm yet')
    await expect(output('install')).toContainText('npm install @safe-global/ui')
    await expect(output('next-config')).toContainText('transpilePackages')
    await expect(output('usage')).toContainText("from '@safe-global/ui/primitives/sheet'")
    await expect(output('components-json')).toHaveCount(0)
  })

  test('the Typeset sample text updates every specimen', async ({ page }) => {
    await page.goto('typeset/', { waitUntil: 'load' })
    const samples = page.locator('[data-sample]')
    const count = await samples.count()
    expect(count).toBeGreaterThan(10)
    await page.locator('[data-typeset-input]').fill('Hello from Safe')
    await expect(samples).toHaveText(Array(count).fill('Hello from Safe'))
    await expect(page.locator('[data-specimen="h1"] [data-metric="size"]')).toHaveText(/\d+(\.\d+)?px/)
  })
})

const SHOTS = ['', 'components/', 'components/button/', 'typeset/', 'create/', 'docs/']

const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)
  for (const frame of await page.locator('iframe[data-story-frame]').all()) {
    if (!(await frame.isVisible())) continue
    await frame.scrollIntoViewIfNeeded()
    await frame.contentFrame().locator('#story-root > *').first().waitFor({ state: 'attached' })
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(800)
}

test.describe('screenshots', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const route of SHOTS) {
      test(`${scheme} /${route}`, async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 1000 })
        await page.emulateMedia({ colorScheme: scheme })
        await page.goto(route, { waitUntil: 'load' })
        await settle(page)
        const name = (route.replace(/\/$/, '').replace(/\//g, '-') || 'home') + `-${scheme}`
        await page.screenshot({ path: `test-results/shots/${name}.png`, fullPage: true })
      })
    }
  }
  test('dark mobile / with the menu open', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('', { waitUntil: 'load' })
    await settle(page)
    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(page.locator('[data-mobile-menu]')).toBeVisible()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'test-results/shots/home-mobile-menu-dark.png' })
  })
})
