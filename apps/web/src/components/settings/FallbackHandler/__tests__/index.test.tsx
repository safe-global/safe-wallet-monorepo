import { TWAP_FALLBACK_HANDLER } from '@/features/swap/helpers/utils'
import { chainBuilder } from '@/tests/builders/chains'
import { render, waitFor } from '@/tests/test-utils'

import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useChains from '@/hooks/useChains'
import * as useTxBuilderHook from '@/hooks/safe-apps/useTxBuilderApp'
import { FallbackHandler } from '..'

const GOERLI_FALLBACK_HANDLER = '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4'

const mockChain = chainBuilder().with({ chainId: '1' }).build()

describe('FallbackHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(useTxBuilderHook, 'useTxBuilderApp').mockImplementation(() => ({
      link: { href: 'https://mock.link/tx-builder' },
    }))

    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(mockChain)
  })

  it('should render the Fallback Handler when one is set', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(
      () =>
        ({
          safe: {
            version: '1.3.0',
            chainId: '1',
            fallbackHandler: {
              value: GOERLI_FALLBACK_HANDLER,
              name: 'FallbackHandlerName',
            },
          },
        }) as unknown as ReturnType<typeof useSafeInfoHook.default>,
    )

    const fbHandler = render(<FallbackHandler />, {
      initialReduxState: { chains: { loading: false, data: [mockChain] } },
    })

    await waitFor(() => {
      expect(
        fbHandler.queryByText(
          'The fallback handler adds fallback logic for funtionality that may not be present in the Safe contract. Learn more about the fallback handler',
        ),
      ).toBeDefined()

      expect(fbHandler.getByText(GOERLI_FALLBACK_HANDLER)).toBeDefined()

      expect(fbHandler.getByText('FallbackHandlerName')).toBeDefined()
    })
  })

  it('should render the Fallback Handler without warning when one that is not a default address is set', async () => {
    const OPTIMISM_FALLBACK_HANDLER = '0x69f4D1788e39c87893C980c06EdF4b7f686e2938'

    // Optimism is not a "default" address
    expect(OPTIMISM_FALLBACK_HANDLER).not.toBe(GOERLI_FALLBACK_HANDLER)

    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(
      () =>
        ({
          safe: {
            version: '1.3.0',
            chainId: '10',
            fallbackHandler: {
              value: OPTIMISM_FALLBACK_HANDLER,
              name: 'FallbackHandlerName',
            },
          },
        }) as unknown as ReturnType<typeof useSafeInfoHook.default>,
    )

    const fbHandler = render(<FallbackHandler />, {
      initialReduxState: { chains: { loading: false, data: [mockChain] } },
    })

    await waitFor(() => {
      expect(
        fbHandler.queryByText(
          'The fallback handler adds fallback logic for funtionality that may not be present in the Safe contract. Learn more about the fallback handler',
        ),
      ).toBeDefined()

      expect(fbHandler.getByText(OPTIMISM_FALLBACK_HANDLER)).toBeDefined()

      expect(fbHandler.getByText('FallbackHandlerName')).toBeDefined()

      expect(fbHandler.queryByText('An unofficial fallback handler is currently set.')).not.toBeInTheDocument()
    })
  })

  it('should use the official deployment name if the address is official but no known name is present', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(
      () =>
        ({
          safe: {
            version: '1.3.0',
            chainId: '5',
            fallbackHandler: {
              value: GOERLI_FALLBACK_HANDLER,
            },
          },
        }) as unknown as ReturnType<typeof useSafeInfoHook.default>,
    )

    const fbHandler = render(<FallbackHandler />, {
      initialReduxState: { chains: { loading: false, data: [mockChain] } },
    })

    await waitFor(() => {
      expect(fbHandler.getByText('CompatibilityFallbackHandler')).toBeDefined()
    })
  })

  describe('No Fallback Handler', () => {
    it('should render a warning when no Fallback Handler is set', async () => {
      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(
        () =>
          ({
            safe: {
              version: '1.3.0',
              chainId: '5',
            },
          }) as unknown as ReturnType<typeof useSafeInfoHook.default>,
      )

      const fbHandler = render(<FallbackHandler />)

      await waitFor(() => {
        expect(
          fbHandler.queryByText(
            new RegExp('The Safe{Wallet} may not work correctly as no fallback handler is currently set.'),
          ),
        ).toBeInTheDocument()
        expect(fbHandler.queryByText('Transaction Builder')).toBeInTheDocument()
      })
    })

    it('should conditionally append the Transaction Builder link', async () => {
      jest.spyOn(useTxBuilderHook, 'useTxBuilderApp').mockImplementation(() => undefined)

      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(
        () =>
          ({
            safe: {
              version: '1.3.0',
              chainId: '5',
            },
          }) as unknown as ReturnType<typeof useSafeInfoHook.default>,
      )

      const fbHandler = render(<FallbackHandler />)

      await waitFor(() => {
        expect(
          fbHandler.queryByText(
            new RegExp('The Safe{Wallet} may not work correctly as no fallback handler is currently set.'),
          ),
        ).toBeInTheDocument()
        expect(fbHandler.queryByText('Transaction Builder')).not.toBeInTheDocument()
      })
    })
  })

  describe('Unofficial Fallback Handler', () => {
    it('should render placeholder and warning when an unofficial Fallback Handler is set', async () => {
      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(
        () =>
          ({
            safe: {
              version: '1.3.0',
              chainId: '5',
              fallbackHandler: {
                value: '0x123',
              },
            },
          }) as unknown as ReturnType<typeof useSafeInfoHook.default>,
      )

      const fbHandler = render(<FallbackHandler />)

      await waitFor(() => {
        expect(
          fbHandler.queryByText(
            'The fallback handler adds fallback logic for funtionality that may not be present in the Safe Account contract. Learn more about the fallback handler',
          ),
        ).toBeDefined()

        expect(fbHandler.getByText('0x123')).toBeDefined()
      })

      await waitFor(() => {
        expect(fbHandler.queryByText(new RegExp('An unofficial fallback handler is currently set.')))
        expect(fbHandler.queryByText('Transaction Builder')).toBeInTheDocument()
      })
    })

    it('should conditionally append the Transaction Builder link', async () => {
      jest.spyOn(useTxBuilderHook, 'useTxBuilderApp').mockImplementation(() => undefined)

      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(
        () =>
          ({
            safe: {
              version: '1.3.0',
              chainId: '5',
              fallbackHandler: {
                value: '0x123',
              },
            },
          }) as unknown as ReturnType<typeof useSafeInfoHook.default>,
      )

      const fbHandler = render(<FallbackHandler />)

      await waitFor(() => {
        expect(fbHandler.queryByText(new RegExp('An unofficial fallback handler is currently set.')))
        expect(fbHandler.queryByText('Transaction Builder')).not.toBeInTheDocument()
      })
    })
  })

  it('should render nothing if the Safe Account version does not support Fallback Handlers', () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(
      () =>
        ({
          safe: {
            version: '1.0.0',
            chainId: '5',
          },
        }) as unknown as ReturnType<typeof useSafeInfoHook.default>,
    )

    const fbHandler = render(<FallbackHandler />)

    expect(fbHandler.container).toBeEmptyDOMElement()
  })

  it('should display a message in case it is a TWAP fallback handler', () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(
      () =>
        ({
          safe: {
            version: '1.3.0',
            chainId: '1',
            fallbackHandler: {
              value: TWAP_FALLBACK_HANDLER,
            },
          },
        }) as unknown as ReturnType<typeof useSafeInfoHook.default>,
    )

    const { getByText } = render(<FallbackHandler />)

    expect(
      getByText(
        "This is CoW's fallback handler. It is needed for this Safe to be able to use the TWAP feature for Swaps.",
      ),
    ).toBeInTheDocument()
  })

  it('should not display a message in case it is a TWAP fallback handler on an unsupported network', () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(
      () =>
        ({
          safe: {
            version: '1.3.0',
            chainId: '10',
            fallbackHandler: {
              value: TWAP_FALLBACK_HANDLER,
            },
          },
        }) as unknown as ReturnType<typeof useSafeInfoHook.default>,
    )

    const { queryByText } = render(<FallbackHandler />)

    expect(
      queryByText(
        "This is CoW's fallback handler. It is needed for this Safe to be able to use the TWAP feature for Swaps.",
      ),
    ).not.toBeInTheDocument()
  })
})
