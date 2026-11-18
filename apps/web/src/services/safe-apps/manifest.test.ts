import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { fetchSafeAppFromManifest, type AppManifest } from './manifest'

const CHAIN_ID = '11155111'

const anAppUrl = (): string => `https://${faker.internet.domainName()}/${faker.lorem.slug()}`

const aManifest = (overrides: Partial<AppManifest> = {}): AppManifest => ({
  name: faker.company.name(),
  description: faker.lorem.sentence(),
  icons: [{ src: 'logo.svg', sizes: 'any', type: 'image/svg+xml' }],
  ...overrides,
})

const serveManifest = (appUrl: string, manifest: Partial<AppManifest>): void => {
  server.use(http.get(`${appUrl}/manifest.json`, () => HttpResponse.json(manifest)))
}

describe('fetchSafeAppFromManifest', () => {
  it('reads the name and the description from the manifest', async () => {
    const appUrl = anAppUrl()
    const manifest = aManifest()
    serveManifest(appUrl, manifest)

    const safeApp = await fetchSafeAppFromManifest(appUrl, CHAIN_ID)

    expect(safeApp).toMatchObject({ name: manifest.name, description: manifest.description, chainIds: [CHAIN_ID] })
  })

  it('resolves a relative icon path against the app URL', async () => {
    const appUrl = anAppUrl()
    serveManifest(appUrl, aManifest({ icons: [{ src: 'logo.svg', sizes: 'any' }] }))

    const safeApp = await fetchSafeAppFromManifest(appUrl, CHAIN_ID)

    expect(safeApp.iconUrl).toBe(`${appUrl}/logo.svg`)
  })

  it('keeps an absolute icon URL', async () => {
    const appUrl = anAppUrl()
    const iconUrl = `https://${faker.internet.domainName()}/icon.png`
    serveManifest(appUrl, aManifest({ icons: [{ src: iconUrl, sizes: '256x256' }] }))

    const safeApp = await fetchSafeAppFromManifest(appUrl, CHAIN_ID)

    expect(safeApp.iconUrl).toBe(iconUrl)
  })

  it('fetches the manifest without the query string and keeps the original URL', async () => {
    const appUrl = anAppUrl()
    const urlWithQuery = `${appUrl}/?network=${CHAIN_ID}`
    serveManifest(appUrl, aManifest())

    const safeApp = await fetchSafeAppFromManifest(urlWithQuery, CHAIN_ID)

    expect(safeApp).toMatchObject({ url: appUrl, originalUrl: urlWithQuery })
  })

  it('rejects a manifest without icons', async () => {
    const appUrl = anAppUrl()
    const { icons: _icons, ...manifestWithoutIcons } = aManifest()
    serveManifest(appUrl, manifestWithoutIcons)

    await expect(fetchSafeAppFromManifest(appUrl, CHAIN_ID)).rejects.toThrow('Invalid Safe App manifest')
  })

  it('rejects when the manifest request fails', async () => {
    const appUrl = anAppUrl()
    server.use(http.get(`${appUrl}/manifest.json`, () => new HttpResponse(null, { status: 404 })))

    await expect(fetchSafeAppFromManifest(appUrl, CHAIN_ID)).rejects.toThrow(
      `Failed to fetch manifest from ${appUrl}/manifest.json`,
    )
  })
})
