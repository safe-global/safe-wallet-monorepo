import { act, fireEvent, render, waitFor } from '@/tests/test-utils'

import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useTxBuilderHook from '@/hooks/safe-apps/useTxBuilderApp'
import { FallbackHandler } from '..'

const GOERLI_FALLBACK_HANDLER = '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4'

describe('FallbackHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(useTxBuilderHook, 'useTxBuilderApp').mockImplementation(() => ({
      link: { href: 'https://mock.link/tx-builder' },
    }))
  })

  it('should render the Fallback Handler when one is set', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(
      () =>
        ({
          safe: {
            version: '1.3.0',
            chainId: '5',
            fallbackHandler: {
              value: GOERLI_FALLBACK_HANDLER,
              name: 'FallbackHandlerName',
            },
          },
        } as unknown as ReturnType<typeof useSafeInfoHook.default>),
    )

    const fbHandler = render(<FallbackHandler />)

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
        } as unknown as ReturnType<typeof useSafeInfoHook.default>),
    )

    const fbHandler = render(<FallbackHandler />)

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
        } as unknown as ReturnType<typeof useSafeInfoHook.default>),
    )

    const fbHandler = render(<FallbackHandler />)

    await waitFor(() => {
      expect(fbHandler.getByText('CompatibilityFallbackHandler')).toBeDefined()
    })
  })

  describe('No Fallback Handler', () => {
    it('should render the Fallback Handler and warning tooltip when no Fallback Handler is set', async () => {
      jest.spyOn(useSafeInfoHook, 'default').mockImplementation(
        () =>
          ({
            safe: {
              version: '1.3.0',
              chainId: '5',
            },
          } as unknown as ReturnType<typeof useSafeInfoHook.default>),
      )

      const fbHandler = render(<FallbackHandler />)

      await waitFor(() => {
        expect(fbHandler.getByText('No fallback handler set')).toBeDefined()
      })

      const icon = fbHandler.getByTestId('fallback-handler-warning')

      await act(() => {
        fireEvent(
          icon,
          new MouseEvent('mouseover', {
            bubbles: true,
          }),
        )
      })

      await waitFor(() => {
        expect(
          fbHandler.queryByText(
            new RegExp('The BNB Safe{Wallet} may not work correctly as no fallback handler is currently set.'),
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
          } as unknown as ReturnType<typeof useSafeInfoHook.default>),
      )

      const fbHandler = render(<FallbackHandler />)

      const icon = fbHandler.getByTestId('fallback-handler-warning')

      await act(() => {
        fireEvent(
          icon,
          new MouseEvent('mouseover', {
            bubbles: true,
          }),
        )
      })

      await waitFor(() => {
        expect(
          fbHandler.queryByText(
            new RegExp('The BNB Safe{Wallet} may not work correctly as no fallback handler is currently set.'),
          ),
        ).toBeInTheDocument()
        expect(fbHandler.queryByText('Transaction Builder')).not.toBeInTheDocument()
      })
    })
  })

  describe('Unofficial Fallback Handler', () => {
    it('should render placeholder and warning tooltip when an unofficial Fallback Handler is set', async () => {
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
          } as unknown as ReturnType<typeof useSafeInfoHook.default>),
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

      const icon = fbHandler.getByTestId('fallback-handler-warning')

      await act(() => {
        fireEvent(
          icon,
          new MouseEvent('mouseover', {
            bubbles: true,
          }),
        )
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
          } as unknown as ReturnType<typeof useSafeInfoHook.default>),
      )

      const fbHandler = render(<FallbackHandler />)

      const icon = fbHandler.getByTestId('fallback-handler-warning')

      await act(() => {
        fireEvent(
          icon,
          new MouseEvent('mouseover', {
            bubbles: true,
          }),
        )
      })

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
        } as unknown as ReturnType<typeof useSafeInfoHook.default>),
    )

    const fbHandler = render(<FallbackHandler />)

    expect(fbHandler.container).toBeEmptyDOMElement()
  })
})
