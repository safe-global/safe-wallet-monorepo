import SignOrExecute from '../index'
import { render } from '@/tests/test-utils'
import type { TransactionPreview } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { createSafeTx } from '@/tests/builders/safeTx'
import * as useTxPreviewHooks from '@/components/tx/confirmation-views/useTxPreview'

let isSafeOwner = true
// mock useIsSafeOwner
jest.mock('@/hooks/useIsSafeOwner', () => ({
  __esModule: true,
  default: jest.fn(() => isSafeOwner),
}))

// Mock proposeTx
jest.mock('@/services/tx/proposeTransaction', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({ txId: '123' })),
}))

jest.mock('@/hooks/useValidateTxData', () => ({
  __esModule: true,
  useValidateTxData: jest.fn().mockReturnValue([undefined, undefined, false]),
}))

describe('SignOrExecute', () => {
  beforeEach(() => {
    isSafeOwner = true
    jest.clearAllMocks()
  })

  it('should display a loading component', () => {
    const { container } = render(<SignOrExecute onSubmit={jest.fn()} isExecutable={true} />)

    expect(container).toMatchSnapshot()
  })

  it('should display a confirmation screen', async () => {
    jest.spyOn(useTxPreviewHooks, 'default').mockReturnValue([
      {
        txInfo: {},
        txData: { to: { value: '0xE20CcFf2c38Ef3b64109361D7b7691ff2c7D5f67' } },
      } as TransactionPreview,
      undefined,
      false,
    ])

    const { container, getByTestId } = render(
      <SafeTxContext.Provider
        value={
          {
            safeTx: createSafeTx(),
          } as SafeTxContextParams
        }
      >
        <SignOrExecute onSubmit={jest.fn()} isExecutable={true} />
      </SafeTxContext.Provider>,
    )

    expect(getByTestId('sign-btn')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  it('should display an error screen', async () => {
    jest
      .spyOn(useTxPreviewHooks, 'default')
      .mockReturnValue([undefined, new Error('This is a mock error message'), false])

    const { container } = render(
      <SafeTxContext.Provider
        value={
          {
            safeTx: createSafeTx(),
          } as SafeTxContextParams
        }
      >
        <SignOrExecute onSubmit={jest.fn()} isExecutable={true} />
      </SafeTxContext.Provider>,
    )

    expect(container.querySelector('sign-btn')).not.toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })
})
