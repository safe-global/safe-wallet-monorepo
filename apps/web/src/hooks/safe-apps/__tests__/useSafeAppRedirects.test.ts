import { faker } from '@faker-js/faker'
import type { NextRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useSafeAppRedirects } from '@/hooks/safe-apps/useSafeAppRedirects'
import { fakerChecksummedAddress, renderHook } from '@/tests/test-utils'

type RedirectParams = Parameters<typeof useSafeAppRedirects>[0]

const CHAIN_ID = '1'
const OTHER_CHAIN_ID = '137'
const LOADED_SAFE = `eth:${fakerChecksummedAddress()}`

const renderRedirects = (overrides: Partial<RedirectParams>, router: Partial<NextRouter> = {}) => {
  const params: RedirectParams = {
    safeAppData: undefined,
    chainId: CHAIN_ID,
    isSafeAppsEnabled: true,
    appUrl: undefined,
    remoteSafeAppsLoading: false,
    goToList: jest.fn(),
    ...overrides,
  }
  const push = jest.fn(() => Promise.resolve(true))
  const { result } = renderHook(() => useSafeAppRedirects(params), {
    routerProps: { isReady: true, query: {}, push, ...router },
  })
  return { goToList: params.goToList, push, shouldShowApp: result.current }
}

describe('useSafeAppRedirects', () => {
  describe('redirect to the Safe Apps list', () => {
    it('goes to the list when the remote app does not support the current chain', () => {
      const { goToList } = renderRedirects({ safeAppData: { chainIds: [OTHER_CHAIN_ID] }, chainId: CHAIN_ID })

      expect(goToList).toHaveBeenCalledTimes(1)
    })

    it('waits for the remote apps to finish loading before going to the list', () => {
      const { goToList } = renderRedirects({
        safeAppData: { chainIds: [OTHER_CHAIN_ID] },
        chainId: CHAIN_ID,
        remoteSafeAppsLoading: true,
      })

      expect(goToList).not.toHaveBeenCalled()
    })

    it('stays on a remote app that supports the current chain', () => {
      const { goToList } = renderRedirects({ safeAppData: { chainIds: [OTHER_CHAIN_ID, CHAIN_ID] }, chainId: CHAIN_ID })

      expect(goToList).not.toHaveBeenCalled()
    })

    it('stays on a custom app that is not in the remote list', () => {
      const { goToList } = renderRedirects({ safeAppData: undefined, chainId: CHAIN_ID })

      expect(goToList).not.toHaveBeenCalled()
    })
  })

  describe('redirect to the share page', () => {
    it('sends an app link without a Safe to the share page of that app', () => {
      const appUrl = faker.internet.url()

      const { push } = renderRedirects({ appUrl }, { isReady: true, query: {} })

      expect(push).toHaveBeenCalledWith({ pathname: AppRoutes.share.safeApp, query: { appUrl } })
    })

    it('waits for the router to be ready before sending an app link to the share page', () => {
      const { push } = renderRedirects({ appUrl: faker.internet.url() }, { isReady: false, query: {} })

      expect(push).not.toHaveBeenCalled()
    })

    it('keeps an app link with a loaded Safe on the app', () => {
      const { push } = renderRedirects(
        { appUrl: faker.internet.url() },
        { isReady: true, query: { safe: LOADED_SAFE } },
      )

      expect(push).not.toHaveBeenCalled()
    })
  })

  describe('whether to show the app', () => {
    it('shows the app when Safe Apps are enabled and a Safe is loaded', () => {
      const { shouldShowApp } = renderRedirects(
        { isSafeAppsEnabled: true, appUrl: faker.internet.url() },
        { isReady: true, query: { safe: LOADED_SAFE } },
      )

      expect(shouldShowApp).toBe(true)
    })

    it('hides the app when Safe Apps are disabled on the chain', () => {
      const { shouldShowApp } = renderRedirects(
        { isSafeAppsEnabled: false, appUrl: faker.internet.url() },
        { isReady: true, query: { safe: LOADED_SAFE } },
      )

      expect(shouldShowApp).toBe(false)
    })
  })
})
