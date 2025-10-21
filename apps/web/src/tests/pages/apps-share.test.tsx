import React from 'react'
import { render, screen, waitFor } from '../test-utils'
import ShareSafeApp from '@/pages/share/safe-app'
import { CONFIG_SERVICE_CHAINS } from '@/tests/mocks/chains'
import * as useWalletHook from '@/hooks/wallets/useWallet'
import * as useOwnedSafesHook from '@/hooks/useOwnedSafes'
import * as manifest from '@/services/safe-apps/manifest'
import { SafeAppAccessPolicyTypes } from '@safe-global/store/gateway/types'
import { txBuilderShareApp } from '@safe-global/test/msw/mockSafeApps'
import { http, HttpResponse } from 'msw'
import { server } from '../server'
import { GATEWAY_URL } from '@/config/gateway'
import crypto from 'crypto'
import type { EIP1193Provider } from '@web3-onboard/core'

const TX_BUILDER = 'https://apps-portal.safe.global/tx-builder'

describe('Share Safe App Page', () => {
  let fetchSafeAppFromManifestSpy: jest.SpyInstance<Promise<unknown>>

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.useFakeTimers()
    window.localStorage.clear()

    fetchSafeAppFromManifestSpy = jest.spyOn(manifest, 'fetchSafeAppFromManifest').mockResolvedValue({
      id: Math.random(),
      url: TX_BUILDER,
      name: 'Transaction Builder',
      description: 'A Safe app to compose custom transactions',
      accessControl: { type: SafeAppAccessPolicyTypes.NoRestrictions },
      tags: [],
      features: [],
      socialProfiles: [],
      developerWebsite: '',
      chainIds: ['1'],
      iconUrl: `${TX_BUILDER}/tx-builder.png`,
      safeAppsPermissions: [],
      featured: false,
    })

    // Override the default safe-apps handler for this specific test suite
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safe-apps`, ({ request }) => {
        const url = new URL(request.url)
        const appUrl = url.searchParams.get('url')

        // If filtering by URL, return the matching app
        if (appUrl && appUrl === TX_BUILDER) {
          return HttpResponse.json([txBuilderShareApp])
        }

        // Return the TX builder app by default for this test suite
        return HttpResponse.json([txBuilderShareApp])
      }),
    )
  })

  it('Should show the app name, description and URL', async () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        pathname: '/share/safe-app',
        search: '?appUrl=https://apps-portal.safe.global/tx-builder&chain=eth',
      },
    })

    render(<ShareSafeApp />, {
      routerProps: {
        query: {
          appUrl: TX_BUILDER,
          chain: 'eth',
        },
      },
      initialReduxState: {
        chains: {
          data: CONFIG_SERVICE_CHAINS,
          error: undefined,
          loading: false,
          loaded: true,
        },
      },
    })

    await waitFor(() => {
      expect(fetchSafeAppFromManifestSpy).toHaveBeenCalledWith(TX_BUILDER, '1')

      expect(screen.getByText('Transaction Builder')).toBeInTheDocument()
      expect(
        screen.getByText('Compose custom contract interactions and batch them into a single transaction'),
      ).toBeInTheDocument()
      expect(screen.getByText(TX_BUILDER)).toBeInTheDocument()
    })
  })

  it("Should suggest to connect a wallet when user hasn't connected one", async () => {
    render(<ShareSafeApp />, {
      routerProps: {
        query: {
          appUrl: TX_BUILDER,
          chain: 'eth',
        },
      },
      initialReduxState: {
        chains: {
          data: CONFIG_SERVICE_CHAINS,
          error: undefined,
          loading: false,
          loaded: true,
        },
      },
    })

    await waitFor(() => {
      expect(fetchSafeAppFromManifestSpy).toHaveBeenCalledWith(TX_BUILDER, '1')

      expect(screen.getByText('Connect wallet')).toBeInTheDocument()
    })
  })

  it('Should show a link to the demo on mainnet', async () => {
    render(<ShareSafeApp />, {
      routerProps: {
        query: {
          appUrl: TX_BUILDER,
          chain: 'eth',
        },
      },
      initialReduxState: {
        chains: {
          data: CONFIG_SERVICE_CHAINS,
          error: undefined,
          loading: false,
          loaded: true,
        },
      },
    })

    await waitFor(() => {
      expect(fetchSafeAppFromManifestSpy).toHaveBeenCalledWith(TX_BUILDER, '1')

      expect(screen.getByText('Try demo')).toBeInTheDocument()
    })
  })

  it('Should link to Safe Creation flow when the connected wallet has no owned Safes', async () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        pathname: '/share/safe-app',
        search: '?appUrl=https://apps-portal.safe.global/tx-builder&chain=gor',
      },
    })

    const address = `0x${crypto.randomBytes(20).toString('hex')}`
    jest.spyOn(useWalletHook, 'default').mockImplementation(() => ({
      ens: 'craicis90.eth',
      address,
      provider: jest.fn() as unknown as EIP1193Provider,
      label: 'Metamask',
      chainId: '5',
    }))

    render(<ShareSafeApp />, {
      routerProps: {
        query: {
          appUrl: TX_BUILDER,
          chain: 'gor',
        },
      },
      initialReduxState: {
        chains: {
          data: CONFIG_SERVICE_CHAINS,
          error: undefined,
          loading: false,
          loaded: true,
        },
      },
    })

    await waitFor(() => {
      expect(fetchSafeAppFromManifestSpy).toHaveBeenCalledWith(TX_BUILDER, '5')

      expect(screen.getByText('Create new Safe Account')).toBeInTheDocument()
    })
  })

  it('Should show a select input with owned safes when the connected wallet owns Safes', async () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        pathname: '/share/safe-app',
        search: '?appUrl=https://apps-portal.safe.global/tx-builder&chain=eth',
      },
    })

    const address = `0x${crypto.randomBytes(20).toString('hex')}`
    const safeAddress = `0x${crypto.randomBytes(20).toString('hex')}`
    jest.spyOn(useWalletHook, 'default').mockImplementation(() => ({
      ens: 'craicis90.eth',
      address,
      provider: jest.fn() as unknown as EIP1193Provider,
      label: 'Metamask',
      chainId: '1',
    }))
    const mockOwnedSafes = { '1': [safeAddress] }
    jest.spyOn(useOwnedSafesHook, 'default').mockImplementation(() => mockOwnedSafes)

    render(<ShareSafeApp />, {
      routerProps: {
        query: {
          appUrl: TX_BUILDER,
          chain: 'eth',
        },
      },
      initialReduxState: {
        chains: {
          data: CONFIG_SERVICE_CHAINS,
          error: undefined,
          loading: false,
          loaded: true,
        },
      },
    })

    await waitFor(() => {
      expect(fetchSafeAppFromManifestSpy).toHaveBeenCalledWith(TX_BUILDER, '1')

      expect(screen.getByLabelText('Select a Safe Account')).toBeInTheDocument()
    })
  })
})
