import { faker } from '@faker-js/faker'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { mockSetTxFlow, safeScopeContextFor, TxModalWithScope, unwrapScopedFlow } from '@/tests/mocks/safeScope'
import type { SafeScopeContextValue } from '@safe-global/views/components/tx-flow/safe-scope/types'
import TokenTransferFlow from '../TokenTransfer'
import NewTxFlow from '.'

jest.mock('@/components/tx-flow/common/TxButton', () => ({
  SendTokensButton: ({ onClick }: { onClick: () => void }) => <button onClick={onClick}>Send tokens</button>,
  MakeASwapButton: () => null,
  TxBuilderButton: () => null,
}))

jest.mock('../TokenTransfer', () => ({ __esModule: true, default: () => null }))

jest.mock('@/components/common/ChainIndicator', () => ({ __esModule: true, default: () => null }))

jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: () => ({ HnMiniTxBanner: () => null }),
}))

const renderFlow = (scope?: SafeScopeContextValue) => {
  const setTxFlow = mockSetTxFlow()
  render(
    <TxModalWithScope setTxFlow={setTxFlow} scope={scope}>
      <NewTxFlow />
    </TxModalWithScope>,
  )
  fireEvent.click(screen.getByText('Send tokens'))
  return setTxFlow
}

describe('NewTxFlow', () => {
  it('opens the token transfer flow as is on a Safe page', () => {
    const setTxFlow = renderFlow()

    expect(setTxFlow).toHaveBeenCalledTimes(1)
    const { flow, target } = unwrapScopedFlow(setTxFlow.mock.calls[0][0])
    expect(flow?.type).toBe(TokenTransferFlow)
    expect(target).toBeUndefined()
  })

  it('keeps the token transfer flow in the Safe a Space flow is scoped to', () => {
    const scopedSafe = { chainId: '137', safeAddress: faker.finance.ethereumAddress() }
    const setTxFlow = renderFlow(safeScopeContextFor(scopedSafe))

    expect(setTxFlow).toHaveBeenCalledTimes(1)
    const { flow, target } = unwrapScopedFlow(setTxFlow.mock.calls[0][0])
    expect(flow?.type).toBe(TokenTransferFlow)
    expect(target).toEqual(scopedSafe)
  })
})
