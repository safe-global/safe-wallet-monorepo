import { act, useContext, type RefObject } from 'react'
import { render, waitFor } from '@/tests/test-utils'
import { TxModalContext, type TxModalContextType, TxModalProvider } from '..'
import { useIsTxFlowOpenRef } from '../useIsTxFlowOpen'

jest.mock('@/hooks/useTopbarElevation', () => ({
  useTopbarElevation: jest.fn(),
}))

describe('useIsTxFlowOpenRef', () => {
  it('tracks whether a flow is on screen', async () => {
    let isTxFlowOpenRef: RefObject<boolean> | undefined
    let setTxFlow: TxModalContextType['setTxFlow'] | undefined

    const Subscriber = () => {
      isTxFlowOpenRef = useIsTxFlowOpenRef()
      setTxFlow = useContext(TxModalContext).setTxFlow
      return null
    }

    render(
      <TxModalProvider>
        <Subscriber />
      </TxModalProvider>,
    )

    expect(isTxFlowOpenRef?.current).toBe(false)

    act(() => setTxFlow?.(<div>Flow content</div>, undefined, false))
    await waitFor(() => expect(isTxFlowOpenRef?.current).toBe(true))

    act(() => setTxFlow?.(undefined))
    await waitFor(() => expect(isTxFlowOpenRef?.current).toBe(false))
  })
})
