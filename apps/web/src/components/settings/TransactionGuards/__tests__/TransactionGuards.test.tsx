import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { render, waitFor } from '@/tests/test-utils'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { zeroPadValue } from 'ethers'
import TransactionGuards from '..'
import type { ReactNode } from 'react'

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (isOk: boolean) => ReactNode }) => children(true),
}))

const MOCK_GUARD = zeroPadValue('0x01', 20)
const EMPTY_LABEL = 'No transaction guard set'

describe('TransactionGuards', () => {
  const extendedSafeInfo = extendedSafeInfoBuilder().build()

  it('should render placeholder label without an tx guard', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: extendedSafeInfo,
      safeAddress: '0x123',
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    const utils = render(<TransactionGuards />)
    await waitFor(() => expect(utils.getByText(EMPTY_LABEL)).toBeDefined())
    expect(utils.getByText('Transaction guards').closest('[data-slot="card"]')).toHaveClass('p-8')
  })

  it('should render null if safe is loading', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: extendedSafeInfo,
      safeAddress: '',
      safeError: undefined,
      safeLoading: true,
      safeLoaded: false,
    }))

    const utils = render(<TransactionGuards />)
    expect(utils.container.children.length).toEqual(0)
  })

  it('should render null if safe version < 1.3.0', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: {
        ...extendedSafeInfo,
        guard: null,
        chainId: '4',
        version: '1.2.0',
      },
      safeAddress: '0x123',
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    const utils = render(<TransactionGuards />)
    expect(utils.container.children.length).toEqual(0)
  })

  it('should render tx guard address if defined', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: {
        ...extendedSafeInfo,
        guard: {
          value: MOCK_GUARD,
        },
      },
      safeAddress: '0x123',
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    const utils = render(<TransactionGuards />)
    await waitFor(() => expect(utils.getByText(MOCK_GUARD)).toBeDefined())
  })
})
