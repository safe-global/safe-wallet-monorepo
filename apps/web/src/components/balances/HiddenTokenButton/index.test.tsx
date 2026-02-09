import * as useChainId from '@/hooks/useChainId'
import { fireEvent, render } from '@/tests/test-utils'
import { toBeHex } from 'ethers'
import { TokenType } from '@safe-global/store/gateway/types'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'
import HiddenTokenButton from '.'
import { useState } from 'react'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { type Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import * as useBalances from '@/hooks/useBalances'

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
    const mockBalances: Balances = {
      fiatTotal: '300',
      items: [
        {
          balance: safeParseUnits('100', 18)!.toString(),
          fiatBalance: '100',
          fiatConversion: '1',
          tokenInfo: {
            address: toBeHex('0x2', 20),
            decimals: 18,
            logoUri: '',
            name: 'DAI',
            symbol: 'DAI',
            type: TokenType.ERC20,
          },
        },
        {
          balance: safeParseUnits('200', 18)!.toString(),
          fiatBalance: '200',
          fiatConversion: '1',
          tokenInfo: {
            address: toBeHex('0x3', 20),
            decimals: 18,
            logoUri: '',
            name: 'SPAM',
            symbol: 'SPM',
            type: TokenType.ERC20,
          },
        },
      ],
    }

    jest
      .spyOn(useBalances, 'default')
      .mockReturnValue({ balances: mockBalances, loaded: true, loading: false, error: undefined })

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
          curatedNestedSafes: {},
        },
      },
    })
    fireEvent.click(result.getByTestId('toggle-hidden-assets'))

    // Now it is disabled
    expect(result.getByTestId('toggle-hidden-assets')).toBeDisabled()
  })
})
