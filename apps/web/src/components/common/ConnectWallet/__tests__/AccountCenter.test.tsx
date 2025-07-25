import { render } from '@/tests/test-utils'
import { AccountCenter } from '@/components/common/ConnectWallet/AccountCenter'
import { type EIP1193Provider } from '@web3-onboard/core'
import { act, waitFor } from '@testing-library/react'

const mockWallet = {
  address: '0x1234567890123456789012345678901234567890',
  chainId: '5',
  label: '',
  provider: null as unknown as EIP1193Provider,
}

// TODO: This test is flaky and randomly fails sometimes
describe('AccountCenter', () => {
  it('should open and close the account center on click', async () => {
    const { getByText, getByTestId } = render(<AccountCenter wallet={mockWallet} />)

    const openButton = getByTestId('open-account-center')

    act(() => {
      openButton.click()
    })

    const disconnectButton = getByText('Disconnect')

    expect(disconnectButton).toBeInTheDocument()

    act(() => {
      disconnectButton.click()
    })

    await waitFor(() => {
      expect(disconnectButton).not.toBeInTheDocument()
    })
  })
})
