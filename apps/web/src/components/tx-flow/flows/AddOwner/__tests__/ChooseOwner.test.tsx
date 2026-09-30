import { faker } from '@faker-js/faker'

import { render } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { ZERO_ADDRESS, SENTINEL_ADDRESS } from '@safe-global/utils/utils/constants'
import { getContractErrorMessage } from '@safe-global/utils/services/exceptions/contractErrors'
import { ChooseOwner, ChooseOwnerMode } from '../ChooseOwner'
import type { AddOwnerFlowProps } from '..'

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  __esModule: true,
  useSafeShieldForAddressPoisoning: () => undefined,
}))

jest.mock('@/hooks/useAddressResolver', () => ({
  __esModule: true,
  useAddressResolver: () => ({ name: undefined, ens: undefined, resolving: false }),
}))

// Captures the validate callback the address field is given, so the shared
// GS203/GS204 rules can be asserted without driving the autocomplete.
let capturedValidate: ((address: string) => string | undefined) | undefined

jest.mock('@/components/common/AddressBookInput', () => ({
  __esModule: true,
  default: ({ validate }: { validate?: (address: string) => string | undefined }) => {
    capturedValidate = validate
    return null
  },
}))

const OWNERS = [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()]
const SAFE_ADDRESS = faker.finance.ethereumAddress()

const mockSafeInfo = (owners: string[] = OWNERS) => {
  jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
    safe: {
      ...extendedSafeInfoBuilder().build(),
      owners: owners.map((value) => ({ value })),
      threshold: 1,
      chainId: '1',
    },
    safeAddress: SAFE_ADDRESS,
    safeError: undefined,
    safeLoading: false,
    safeLoaded: true,
  })
}

const renderChooseOwner = (params: Partial<AddOwnerFlowProps> = {}) =>
  render(
    <ChooseOwner
      params={{ newOwner: { address: '' }, threshold: 1, ...params }}
      onSubmit={jest.fn()}
      mode={ChooseOwnerMode.ADD}
    />,
  )

describe('ChooseOwner (WA-3005 Bucket A)', () => {
  beforeEach(() => {
    capturedValidate = undefined
    mockSafeInfo()
  })

  afterEach(() => jest.restoreAllMocks())

  describe('new signer address', () => {
    it('rejects the reserved addresses that pass checksum validation', () => {
      renderChooseOwner()

      expect(capturedValidate?.(ZERO_ADDRESS)).toBe(getContractErrorMessage('GS203'))
      expect(capturedValidate?.(SENTINEL_ADDRESS)).toBe(getContractErrorMessage('GS203'))
    })

    it('rejects an address that is already a signer', () => {
      renderChooseOwner()

      expect(capturedValidate?.(OWNERS[0])).toBe(getContractErrorMessage('GS204'))
    })

    it('rejects the Safe account itself', () => {
      renderChooseOwner()

      expect(capturedValidate?.(SAFE_ADDRESS)).toBe('Cannot use Safe account itself as signer.')
    })

    it('accepts a new, unique signer', () => {
      renderChooseOwner()

      expect(capturedValidate?.(faker.finance.ethereumAddress())).toBeUndefined()
    })
  })

  describe('threshold bounds', () => {
    it('accepts a threshold within the new signer count', () => {
      // 2 owners + the one being added -> 3 is in bounds
      const { getByTestId, queryByText } = renderChooseOwner({ threshold: 3 })

      expect(queryByText(getContractErrorMessage('GS201'))).not.toBeInTheDocument()
      expect(getByTestId('add-owner-next-btn')).not.toBeDisabled()
    })

    // The threshold rule used to have no rendered message at all, so the
    // submit was blocked with nothing shown to the user.
    it('shows the GS201 message and blocks submission when the threshold is too high', () => {
      const { getByTestId, getByText } = renderChooseOwner({ threshold: 4 })

      expect(getByText(getContractErrorMessage('GS201'))).toBeInTheDocument()
      expect(getByTestId('add-owner-next-btn')).toBeDisabled()
    })

    it('shows the GS202 message and blocks submission when the threshold is below 1', () => {
      const { getByTestId, getByText } = renderChooseOwner({ threshold: 0 })

      expect(getByText(getContractErrorMessage('GS202'))).toBeInTheDocument()
      expect(getByTestId('add-owner-next-btn')).toBeDisabled()
    })

    it('reflects a signer set that shrank on-chain while the flow was open', () => {
      // Threshold 3 was valid for 2 owners + 1; one owner left the Safe since
      mockSafeInfo([OWNERS[0]])

      const { getByTestId, getByText } = renderChooseOwner({ threshold: 3 })

      expect(getByText(getContractErrorMessage('GS201'))).toBeInTheDocument()
      expect(getByTestId('add-owner-next-btn')).toBeDisabled()
    })
  })
})

describe('ChooseOwner in Replace mode (WA-3005 Bucket A)', () => {
  beforeEach(() => {
    capturedValidate = undefined
    mockSafeInfo()
  })

  afterEach(() => jest.restoreAllMocks())

  const renderReplace = (threshold: number) =>
    render(
      <ChooseOwner
        params={{ newOwner: { address: '' }, removedOwner: { address: OWNERS[0] }, threshold }}
        onSubmit={jest.fn()}
        mode={ChooseOwnerMode.REPLACE}
      />,
    )

  it('does not render the threshold selector', () => {
    const { queryByTestId } = renderReplace(2)

    expect(queryByTestId('owner-number-dropdown')).not.toBeInTheDocument()
  })

  // Replace has no threshold selector, so a stale threshold must still be
  // explained rather than silently disabling the button.
  it('surfaces the threshold error even though the selector is hidden', () => {
    const { getByTestId, getByText } = renderReplace(5)

    expect(getByText(getContractErrorMessage('GS201'))).toBeInTheDocument()
    expect(getByTestId('add-owner-next-btn')).toBeDisabled()
  })

  it('stays clean for a threshold within bounds', () => {
    const { queryByText } = renderReplace(2)

    expect(queryByText(getContractErrorMessage('GS201'))).not.toBeInTheDocument()
  })
})
