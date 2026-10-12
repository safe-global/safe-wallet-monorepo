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
  define: { 'process.env.NODE_ENV': '"production"' },
})
await writeFile(path.join(site, 'host.js'), host.outputFiles[0].text)
await writeFile(path.join(site, 'index.html'), '<div id="root"></div><script src="/host.js"></script>')

const siteServer = await listen(async (req, res) => {
  try {
    const file = path.join(site, req.url === '/' ? 'index.html' : req.url)
    res.setHeader('content-type', file.endsWith('.html') ? 'text/html' : 'text/javascript')
    res.end(await readFile(file))
  } catch {
    res.statusCode = 404
    res.end()
  }
})

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH })
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${siteServer.address().port}/`)
await page.locator('#root button').last().click()
await page.waitForTimeout(1500)

const log = await page.evaluate(() => window.__log)
const drawn = await page.locator('#root').evaluate((root) => ({
  forbiddenElements: root.querySelectorAll('img, a, script, style').length,
  styleAttributes: root.querySelectorAll('[style]').length,
}))
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
  ...(drawn.styleAttributes ? ['the page drew an inline style'] : []),
  ...leaks.map((url) => `request left the sandbox: ${url}`),
]
if (failures.length) {
  console.error('\nFAILED:\n' + failures.join('\n'))
  process.exit(1)
}
console.log('\nAll attacks were blocked.')
