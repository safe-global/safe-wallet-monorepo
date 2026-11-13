import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import type { SafeApp } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { SafeAppAccessPolicyTypes } from '@safe-global/store/gateway/types'
import { GATEWAY_URL } from '@/config/gateway'
import * as useChainIdHook from '@/hooks/useChainId'
import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'
import { server } from '@/tests/server'
import { renderHook, waitFor } from '@/tests/test-utils'

const CHAIN_ID = '1'

const safeApp = (name: string, url: string): SafeApp => ({
  id: faker.number.int(),
  name,
  url,
  iconUrl: faker.image.url(),
  description: faker.lorem.sentence(),
  chainIds: [CHAIN_ID],
  accessControl: { type: SafeAppAccessPolicyTypes.NoRestrictions },
  tags: [],
  features: [],
  socialProfiles: [],
  developerWebsite: '',
  featured: false,
})

const renderUseSafeAppsWith = async (remoteSafeApps: SafeApp[]) => {
  server.use(http.get(`${GATEWAY_URL}/v1/chains/:chainId/safe-apps`, () => HttpResponse.json(remoteSafeApps)))
  const rendered = renderHook(() => useSafeApps())
  await waitFor(() => expect(rendered.result.current.allSafeApps).toHaveLength(remoteSafeApps.length))
  return rendered.result
}

describe('useSafeApps', () => {
  beforeEach(() => {
    jest.spyOn(useChainIdHook, 'default').mockReturnValue(CHAIN_ID)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getSafeAppByUrl', () => {
    it('prefers the app whose URL matches exactly over an earlier app on the same origin', async () => {
      const sameOriginApp = safeApp('A same origin app', 'https://apps.example.com/other')
      const exactApp = safeApp('B exact app', 'https://apps.example.com/exact')
      const result = await renderUseSafeAppsWith([sameOriginApp, exactApp])

      const found = result.current.getSafeAppByUrl('https://apps.example.com/exact')

      expect(found).toEqual(exactApp)
    })

    it('falls back to an app on the same origin when no URL matches exactly', async () => {
      const app = safeApp('Swap', 'https://swap.example.com/app')
      const result = await renderUseSafeAppsWith([app])

      const found = result.current.getSafeAppByUrl('https://swap.example.com/app/orders?id=1')

      expect(found).toEqual(app)
    })

    it('returns undefined when no app shares the origin of the URL', async () => {
      const result = await renderUseSafeAppsWith([safeApp('Swap', 'https://swap.example.com/app')])

      const found = result.current.getSafeAppByUrl('https://other.example.com/app')

      expect(found).toBeUndefined()
    })
  })
})
