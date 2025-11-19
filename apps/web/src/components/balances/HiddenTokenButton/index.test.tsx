import * as useChainId from '@/hooks/useChainId'
import { fireEvent, render } from '@/tests/test-utils'
import { toBeHex } from 'ethers'
import HiddenTokenButton from '.'
import { useState } from 'react'
import { TOKEN_LISTS } from '@/store/settingsSlice'

const TestComponent = () => {
  const [showHidden, setShowHidden] = useState(false)
  return (
    <HiddenTokenButton showHiddenAssets={showHidden} toggleShowHiddenAssets={() => setShowHidden((prev) => !prev)} />
  )
}

describe('HiddenTokenToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
    jest.spyOn(useChainId, 'default').mockReturnValue('5')
  })

  test('button disabled if hidden assets are visible', async () => {
    const mockHiddenAssets = {
      '5': [toBeHex('0x3', 20)],
    }

    const result = render(<TestComponent />, {
      initialReduxState: {
        settings: {
          currency: 'usd',
          hiddenTokens: mockHiddenAssets,
          tokenList: TOKEN_LISTS.ALL,
          shortName: {
            copy: true,
            qr: true,
          },
          theme: {
            darkMode: true,
          },
          env: {
            tenderly: {
              url: '',
              accessToken: '',
            },
            rpc: {},
          },
          signing: {
            onChainSigning: false,
            blindSigning: false,
          },
          transactionExecution: true,
        },
      },
    })
    fireEvent.click(result.getByTestId('toggle-hidden-assets'))

    // Now it is disabled
    expect(result.getByTestId('toggle-hidden-assets')).toBeDisabled()
  })
})
