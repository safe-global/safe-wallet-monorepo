import type { ReactElement } from 'react'
import { faker } from '@faker-js/faker'
import { render, screen } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { chainBuilder } from '@/tests/builders/chains'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useChains from '@/hooks/useChains'
import { PendingSafeStatus } from '@safe-global/utils/features/counterfactual/store/types'
import CheckBalance from './index'

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactElement }) => children(true),
}))

const SAFE_ADDRESS = faker.finance.ethereumAddress()
const CHAIN_ID = '1'

const renderCheckBalance = ({ deployed }: { deployed: boolean }) => {
  jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chainBuilder().with({ chainId: CHAIN_ID }).build())
  jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
    safe: extendedSafeInfoBuilder().with({ deployed, chainId: CHAIN_ID }).build(),
    safeAddress: SAFE_ADDRESS,
    safeError: undefined,
    safeLoading: false,
    safeLoaded: true,
  })

  const undeployedSafes = {
    [CHAIN_ID]: {
      [SAFE_ADDRESS]: {
        props: {
          safeAccountConfig: { threshold: 1, owners: [], fallbackHandler: '0x0', to: '0x0', data: '0x' },
          saltNonce: '0',
        },
        status: { status: PendingSafeStatus.AWAITING_EXECUTION, type: 'later' as const },
      },
    },
  }

  return render(<CheckBalance />, { initialReduxState: { undeployedSafes } as never })
}

describe('CheckBalance', () => {
  afterEach(() => jest.restoreAllMocks())

  it('tells the user tokens may be missing and offers activation while the Safe is not deployed', () => {
    renderCheckBalance({ deployed: false })

    expect(screen.getByText("Don't see your tokens?")).toBeInTheDocument()
    expect(screen.getByTestId('activate-account-btn-cf')).toHaveTextContent('Activate now')
  })

  it('renders nothing once the Safe is deployed', () => {
    renderCheckBalance({ deployed: true })

    expect(screen.queryByTestId('no-tokens-alert')).not.toBeInTheDocument()
  })
})
