// Renders attack views through RemoteView in headless Chromium and fails if any of them gets out.
import { build } from 'esbuild'
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { copyFile, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildFrame } from '../build-remote-view.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const web = path.join(here, '../..')
const site = await mkdtemp(path.join(tmpdir(), 'remote-view-probe-'))

const listen = (handler) =>
  new Promise((resolve) => {
    const server = createServer(handler).listen(0, '127.0.0.1', () => resolve(server))
  })

const leaks = []
const leakServer = await listen((req, res) => {
  leaks.push(req.url)
  res.end('leaked')
})
const leakUrl = `http://127.0.0.1:${leakServer.address().port}`

await buildFrame({
  out: path.join(site, 'remote-view/frame.js'),
  viewsEntry: path.join(here, 'views.ts'),
  define: { LEAK_URL: JSON.stringify(leakUrl) },
})
await copyFile(path.join(web, 'public/remote-view/frame.html'), path.join(site, 'remote-view/frame.html'))
const host = await build({
  entryPoints: [path.join(here, 'host.tsx')],
  bundle: true,
  write: false,
  jsx: 'automatic',
  logLevel: 'error',
  define: { 'process.env.NODE_ENV': process.env.PROBE_DEV ? '"development"' : '"production"' },
})
await writeFile(path.join(site, 'host.js'), host.outputFiles[0].text)
await writeFile(path.join(site, 'index.html'), '<div id="root"></div><script src="/host.js"></script>')

const SITE_FILES = {
  '/': ['index.html', 'text/html'],
  '/host.js': ['host.js', 'text/javascript'],
  '/remote-view/frame.html': ['remote-view/frame.html', 'text/html'],
  '/remote-view/frame.js': ['remote-view/frame.js', 'text/javascript'],
}
const siteServer = await listen(async (req, res) => {
  const entry = SITE_FILES[req.url]
  if (!entry) {
    res.statusCode = 404
    res.end()
    return
  }
  res.setHeader('content-type', entry[1])
  res.end(await readFile(path.join(site, entry[0])))
})

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
page.on('worker', (worker) =>
  worker.on('console', (message) => message.type() === 'error' && errors.push(`worker: ${message.text()}`)),
)
await page.goto(`http://127.0.0.1:${siteServer.address().port}/`)
await page
  .locator('#root button')
  .last()
  .click({ timeout: 15000 })
  .catch((error) => {
    console.error(errors.join('\n'))
    throw error
  })
await page.waitForTimeout(1500)

const log = await page.evaluate(() => window.__log)
const drawn = await page.locator('#root').evaluate(
  (root, leak) => ({
    forbiddenElements: root.querySelectorAll('script, style, iframe, object, embed, form[action]').length,
    leakingUrls: [...root.querySelectorAll('[href], [src]')]
      .map((element) => element.getAttribute('href') ?? element.getAttribute('src'))
      .filter((url) => url?.startsWith(leak)),
    unsafeStyles: [...root.querySelectorAll('[style]')].filter((element) =>
      /url\(/i.test(element.getAttribute('style')),
    ).length,
    missing: ['primitive link', 'render link', 'styled button', 'Accept all'].filter(
      (text) => !root.innerText.includes(text),
    ),
  }),
  leakUrl,
)
await browser.close()
leakServer.close()
siteServer.close()

console.log(log.sort().join('\n'))
console.log('drawn on the page:', drawn)
console.log('requests that reached the leak server:', leaks)

const failures = [
  ...log.filter((line) => line.includes('ESCAPED')),
  ...(log.some((line) => line.startsWith('callback:')) ? [] : ['callback from the view never reached the page']),
  ...(drawn.forbiddenElements ? ['the page drew an element outside the allowlist'] : []),
  ...drawn.leakingUrls.map((url) => `the page drew a link or image to ${url}`),
  ...(drawn.unsafeStyles ? ['the page drew a style that loads a URL'] : []),
  ...drawn.missing.map((text) => `the attack view did not render "${text}", so its attack was not tested`),
  ...leaks.map((url) => `request left the sandbox: ${url}`),
]
if (failures.length) {
  console.error('\nFAILED:\n' + failures.join('\n'))
  process.exit(1)
}
console.log('\nAll attacks were blocked.')
