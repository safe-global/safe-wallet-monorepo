import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { render, waitFor } from '@/tests/test-utils'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import SafeModules from '..'
import { zeroPadValue } from 'ethers'
import type { ReactNode } from 'react'

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (isOk: boolean) => ReactNode }) => children(true),
}))

const MOCK_MODULE_1 = zeroPadValue('0x01', 20)
const MOCK_MODULE_2 = zeroPadValue('0x02', 20)

describe('SafeModules', () => {
  const extendedSafeInfo = extendedSafeInfoBuilder().build()

  it('should render placeholder label without any modules', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: extendedSafeInfo,
      safeAddress: '0x123',
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    const utils = render(<SafeModules />)
    await waitFor(() => expect(utils.getByText('No modules enabled')).toBeDefined())
    expect(utils.getByText('Safe modules').closest('[data-slot="card"]')).toHaveClass('p-8')
  })

  it('should render placeholder label if safe is loading', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: extendedSafeInfo,
      safeAddress: '',
      safeError: undefined,
      safeLoading: true,
      safeLoaded: false,
    }))

    const utils = render(<SafeModules />)
    await waitFor(() => expect(utils.getByText('No modules enabled')).toBeDefined())
  })
  it('should render module addresses for defined modules', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: {
        ...extendedSafeInfo,
        modules: [
          {
            value: MOCK_MODULE_1,
          },
          {
            value: MOCK_MODULE_2,
          },
        ],
      },
      safeAddress: '0x123',
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    const utils = render(<SafeModules />)
    await waitFor(() => expect(utils.getByText(MOCK_MODULE_1)).toBeDefined())
    await waitFor(() => expect(utils.getByText(MOCK_MODULE_2)).toBeDefined())
  })
})
