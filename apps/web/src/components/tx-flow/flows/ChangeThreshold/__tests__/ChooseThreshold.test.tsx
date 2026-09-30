import { faker } from '@faker-js/faker'

import { render } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { getContractErrorMessage } from '@safe-global/utils/services/exceptions/contractErrors'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { ChooseThreshold } from '../ChooseThreshold'
import { ChangeThresholdFlowFieldNames, type ChangeThresholdFlowProps } from '..'

jest.mock('@/services/tx/tx-sender', () => ({
  __esModule: true,
  createUpdateThresholdTx: jest.fn().mockResolvedValue({}),
}))

const mockSafeInfo = (ownerCount: number, threshold = 1, safeLoaded = true) => {
  jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
    safe: {
      ...extendedSafeInfoBuilder().build(),
      owners: Array.from({ length: ownerCount }, () => ({ value: faker.finance.ethereumAddress() })),
      threshold,
      chainId: '1',
    },
    safeAddress: faker.finance.ethereumAddress(),
    safeError: undefined,
    safeLoading: !safeLoaded,
    safeLoaded,
  })
}

const renderChooseThreshold = (threshold: number) => {
  const context: TxFlowContextType<ChangeThresholdFlowProps> = {
    ...initialContext,
    data: { [ChangeThresholdFlowFieldNames.threshold]: threshold },
  }

  return render(
    <TxFlowContext.Provider value={context as TxFlowContextType}>
      <ChooseThreshold />
    </TxFlowContext.Provider>,
  )
}

describe('ChooseThreshold (WA-3005 Bucket A / GS201-GS202)', () => {
  afterEach(() => jest.restoreAllMocks())

  it('accepts a threshold within the signer count', () => {
    mockSafeInfo(3)

    const { getByTestId, queryByText } = renderChooseThreshold(2)

    expect(queryByText(getContractErrorMessage('GS201'))).not.toBeInTheDocument()
    expect(getByTestId('threshold-next-btn')).not.toBeDisabled()
  })

  it('blocks a threshold higher than the number of signers', () => {
    // Threshold 3 was valid until an owner left the Safe while the flow was open
    mockSafeInfo(2)

    const { getByTestId, getByText } = renderChooseThreshold(3)

    expect(getByText(getContractErrorMessage('GS201'))).toBeInTheDocument()
    expect(getByTestId('threshold-next-btn')).toBeDisabled()
  })

  it('blocks a threshold below 1', () => {
    mockSafeInfo(3)

    const { getByTestId, getByText } = renderChooseThreshold(0)

    expect(getByText(getContractErrorMessage('GS202'))).toBeInTheDocument()
    expect(getByTestId('threshold-next-btn')).toBeDisabled()
  })

  it('blocks submission while the threshold still matches the current policy', () => {
    mockSafeInfo(3, 2)

    const { getByTestId, getByText, queryByText } = renderChooseThreshold(2)

    expect(getByText(/Current policy is/)).toBeInTheDocument()
    expect(queryByText(getContractErrorMessage('GS201'))).not.toBeInTheDocument()
    expect(queryByText(getContractErrorMessage('GS202'))).not.toBeInTheDocument()
    expect(getByTestId('threshold-next-btn')).toBeDisabled()
  })

  // The flow has no safeLoaded guard, so the owner list is briefly empty
  it('does not flash a threshold error while the Safe is still loading', () => {
    mockSafeInfo(0, 0, false)

    const { queryByText } = renderChooseThreshold(0)

    expect(queryByText(getContractErrorMessage('GS201'))).not.toBeInTheDocument()
    expect(queryByText(getContractErrorMessage('GS202'))).not.toBeInTheDocument()
  })
})
