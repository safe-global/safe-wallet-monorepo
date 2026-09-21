import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { faker } from '@faker-js/faker'
import shuffle from 'lodash/shuffle'

import { ZERO_ADDRESS, SENTINEL_ADDRESS } from '@safe-global/utils/utils/constants'
import { getContractErrorMessage } from '@safe-global/utils/services/exceptions/contractErrors'

import { fireEvent } from '@testing-library/react'

import { render } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { RecoverAccountFlowFields, type RecoverAccountFlowProps } from '..'
import { _isSameSetup, _validateNewOwner, RecoverAccountFlowSetup } from '../RecoverAccountFlowSetup'

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  __esModule: true,
  useSafeShieldForAddressPoisoning: () => undefined,
}))

jest.mock('@/components/common/AddressBookInput', () => ({
  __esModule: true,
  default: () => null,
}))

describe('RecoverAccountFlowSetup', () => {
  describe('validateNewOwner (WA-3005 Bucket A / GS203-GS204)', () => {
    const safeAddress = faker.finance.ethereumAddress()

    it('rejects the reserved addresses that pass checksum validation', () => {
      const expected = getContractErrorMessage('GS203')

      expect(_validateNewOwner({ value: ZERO_ADDRESS, safeAddress, newOwners: [] })).toBe(expected)
      expect(_validateNewOwner({ value: SENTINEL_ADDRESS, safeAddress, newOwners: [] })).toBe(expected)
    })

    it('rejects the Safe account itself', () => {
      expect(_validateNewOwner({ value: safeAddress, safeAddress, newOwners: [] })).toBe(
        'Cannot use Safe account itself as signer.',
      )
    })

    it('rejects a duplicate signer regardless of address casing', () => {
      const duplicate = faker.finance.ethereumAddress()
      const newOwners = [{ value: duplicate }, { value: duplicate.toUpperCase().replace('0X', '0x') }]

      expect(_validateNewOwner({ value: duplicate, safeAddress, newOwners })).toBe(getContractErrorMessage('GS204'))
    })

    it('accepts a new, unique signer', () => {
      const newOwners = [{ value: faker.finance.ethereumAddress() }]

      expect(_validateNewOwner({ value: faker.finance.ethereumAddress(), safeAddress, newOwners })).toBeUndefined()
    })
  })

  describe('isSameSetup', () => {
    it('should return true if the owners and threshold are the same', () => {
      const oldOwners: Array<AddressInfo> = [
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
      ]
      const oldThreshold = faker.number.int({ min: 1, max: oldOwners.length })

      const newOwners = shuffle(oldOwners)

      expect(
        _isSameSetup({
          oldOwners,
          oldThreshold,
          newOwners,
          newThreshold: oldThreshold,
        }),
      ).toBe(true)
    })

    it('should return false if the owners are the same but the threshold is different', () => {
      const oldOwners: Array<AddressInfo> = [
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
      ]
      const oldThreshold = 1

      const newOwners = shuffle(oldOwners)
      const newThreshold = 2

      expect(
        _isSameSetup({
          oldOwners,
          oldThreshold,
          newOwners,
          newThreshold,
        }),
      ).toBe(false)
    })

    it('should return false if the threshold is the same but the owners are different', () => {
      const oldOwners: Array<AddressInfo> = [
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
      ]
      const oldThreshold = 2

      const newOwners = [
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
      ]

      expect(
        _isSameSetup({
          oldOwners,
          oldThreshold,
          newOwners,
          newThreshold: oldThreshold,
        }),
      ).toBe(false)
    })
  })
})

describe('RecoverAccountFlowSetup threshold bounds (WA-3005 Bucket A / GS201)', () => {
  const safeAddress = faker.finance.ethereumAddress()

  const renderSetup = (params: RecoverAccountFlowProps) =>
    render(<RecoverAccountFlowSetup params={params} onSubmit={jest.fn()} />)

  beforeEach(() => {
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safe: {
        ...extendedSafeInfoBuilder().build(),
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        chainId: '1',
      },
      safeAddress,
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    })
  })

  afterEach(() => jest.restoreAllMocks())

  it('accepts a threshold within the signer count', () => {
    const { getByTestId, queryByText } = renderSetup({
      [RecoverAccountFlowFields.owners]: [
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
      ],
      [RecoverAccountFlowFields.threshold]: '2',
    })

    expect(queryByText(getContractErrorMessage('GS201'))).not.toBeInTheDocument()
    expect(getByTestId('next-btn')).not.toBeDisabled()
  })

  it('blocks a threshold higher than the number of signers', () => {
    const { getByTestId, getByText } = renderSetup({
      [RecoverAccountFlowFields.owners]: [{ value: faker.finance.ethereumAddress() }],
      [RecoverAccountFlowFields.threshold]: '2',
    })

    expect(getByText(getContractErrorMessage('GS201'))).toBeInTheDocument()
    expect(getByTestId('next-btn')).toBeDisabled()
  })

  // The regression this covers: useFieldArray.remove leaves `threshold` alone,
  // so the stale value used to reach signing and revert on execution.
  it('blocks the stale threshold left behind when a signer row is removed', async () => {
    const { getByTestId, getAllByTestId, queryByText, findByText } = renderSetup({
      [RecoverAccountFlowFields.owners]: [
        { value: faker.finance.ethereumAddress() },
        { value: faker.finance.ethereumAddress() },
      ],
      [RecoverAccountFlowFields.threshold]: '2',
    })

    expect(queryByText(getContractErrorMessage('GS201'))).not.toBeInTheDocument()
    expect(getByTestId('next-btn')).not.toBeDisabled()

    fireEvent.click(getAllByTestId('remove-signer-btn')[0])

    expect(await findByText(getContractErrorMessage('GS201'))).toBeInTheDocument()
    expect(getByTestId('next-btn')).toBeDisabled()
  })
})
