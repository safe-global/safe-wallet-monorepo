import { render, screen } from '@/tests/test-utils'
import ActivateAccountButton from './index'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as store from '@/store'
import { PendingSafeStatus } from '@safe-global/utils/features/counterfactual/store/types'
import type { ReactElement } from 'react'

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactElement }) => children(true),
}))

describe('ActivateAccountButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .spyOn(useSafeInfoHook, 'default')
      .mockReturnValue({ safe: { chainId: '1' }, safeAddress: '0x123' } as ReturnType<typeof useSafeInfoHook.default>)
  })

  it('renders the "Activate now" label with a rocket icon when awaiting execution', () => {
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ status: { status: PendingSafeStatus.AWAITING_EXECUTION } })

    render(<ActivateAccountButton />)

    const button = screen.getByTestId('activate-account-btn-cf')
    expect(button).toHaveTextContent('Activate now')
    expect(button).not.toBeDisabled()
    expect(button.querySelector('svg.lucide-rocket')).toBeInTheDocument()
  })

  it('shows the processing state and disables the button while activating', () => {
    jest.spyOn(store, 'useAppSelector').mockReturnValue({ status: { status: PendingSafeStatus.PROCESSING } })

    render(<ActivateAccountButton />)

    const button = screen.getByTestId('activate-account-btn-cf')
    expect(button).toHaveTextContent('Processing')
    expect(button).toBeDisabled()
  })
})
