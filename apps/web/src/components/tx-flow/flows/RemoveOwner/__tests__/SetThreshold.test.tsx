import { render } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { zeroPadValue } from 'ethers'
import { SetThreshold } from '../SetThreshold'
import type { RemoveOwnerFlowProps } from '..'

const mockSafeInfo = (ownerCount: number) => {
  const owners = Array.from({ length: ownerCount }, (_, i) => ({ value: zeroPadValue(`0x0${i + 1}`, 20) }))
  jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
    safe: { ...extendedSafeInfoBuilder().build(), owners, threshold: 2, chainId: '1' },
    safeAddress: zeroPadValue('0x0aaa', 20),
    safeError: undefined,
    safeLoading: false,
    safeLoaded: true,
  })
}

const params: RemoveOwnerFlowProps = {
  removedOwner: { address: zeroPadValue('0x01', 20) },
  threshold: 2,
}

describe('SetThreshold (WA-3005 Bucket A / GS201-GS202)', () => {
  afterEach(() => jest.restoreAllMocks())

  it('blocks submission when the threshold exceeds the remaining signer count', () => {
    // 2 owners, removing 1 -> only 1 remains, but the captured threshold is 2
    mockSafeInfo(2)

    const onSubmit = jest.fn()
    const { getByTestId, getByText } = render(<SetThreshold params={params} onSubmit={onSubmit} />)

    expect(getByText('Threshold cannot be higher than the number of signers')).toBeInTheDocument()

    const nextButton = getByTestId('next-btn')
    expect(nextButton).toBeDisabled()
  })

  it('submits normally when the threshold is valid', () => {
    // 3 owners, removing 1 -> 2 remain, threshold 2 is fine
    mockSafeInfo(3)

    const onSubmit = jest.fn()
    const { getByTestId, queryByText } = render(<SetThreshold params={params} onSubmit={onSubmit} />)

    expect(queryByText('Threshold cannot be higher than the number of signers')).not.toBeInTheDocument()
    expect(getByTestId('next-btn')).not.toBeDisabled()
  })
})
