import ReviewTransaction from '../index'
import { render } from '@/tests/test-utils'
import type { TransactionPreview } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { createSafeTx } from '@/tests/builders/safeTx'
import * as useTxPreviewHooks from '@/components/tx/confirmation-views/useTxPreview'

describe('ReviewTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display a loading component', () => {
    const { container } = render(<ReviewTransaction onSubmit={jest.fn()} />)

    expect(container).toMatchSnapshot()
  })

  it('should display a confirmation screen', async () => {
    jest.spyOn(useTxPreviewHooks, 'default').mockReturnValue([
      {
        txInfo: {},
        txData: {},
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
        <ReviewTransaction onSubmit={jest.fn()} />
      </SafeTxContext.Provider>,
    )

    expect(getByTestId('continue-sign-btn')).toBeInTheDocument()
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
        <ReviewTransaction onSubmit={jest.fn()} />
      </SafeTxContext.Provider>,
    )

    expect(container.querySelector('continue-sign-btn')).not.toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })
})
