import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { NamedAddress } from '@/components/new-safe/create/types'
import { CLOUD_COSIGNER_NAME } from '../../constants'
import {
  addCloudCosigner,
  hasCloudCosigner,
  isCloudCosignerAddress,
  removeCloudCosigner,
  toCosignerOwner,
} from '../owners'

const address = (): string => checksumAddress(faker.finance.ethereumAddress())
const owner = (): NamedAddress => ({ name: faker.person.firstName(), address: address() })

describe('cloud cosigner owner utils', () => {
  const cosigner = address()

  describe('isCloudCosignerAddress', () => {
    it('matches case-insensitively', () => {
      expect(isCloudCosignerAddress(cosigner.toLowerCase(), cosigner)).toBe(true)
    })

    it('is false without a cosigner address or without an address', () => {
      expect(isCloudCosignerAddress(cosigner, undefined)).toBe(false)
      expect(isCloudCosignerAddress(undefined, cosigner)).toBe(false)
      expect(isCloudCosignerAddress(address(), cosigner)).toBe(false)
    })
  })

  describe('toCosignerOwner', () => {
    it('names the owner after the cosigner', () => {
      expect(toCosignerOwner(cosigner)).toEqual({ name: CLOUD_COSIGNER_NAME, address: cosigner })
    })
  })

  describe('addCloudCosigner', () => {
    it('appends the cosigner and raises the threshold by one', () => {
      const owners = [owner(), owner()]

      expect(addCloudCosigner(owners, 2, cosigner)).toEqual({
        owners: [...owners, toCosignerOwner(cosigner)],
        threshold: 3,
      })
    })

    it('is a no-op when the cosigner is already an owner', () => {
      const owners = [owner(), toCosignerOwner(cosigner)]

      expect(addCloudCosigner(owners, 2, cosigner)).toEqual({ owners, threshold: 2 })
    })
  })

  describe('removeCloudCosigner', () => {
    it('drops the cosigner and lowers the threshold by one', () => {
      const human = owner()
      const owners = [human, toCosignerOwner(cosigner)]

      expect(removeCloudCosigner(owners, 2, cosigner)).toEqual({ owners: [human], threshold: 1 })
    })

    it('never lowers the threshold below one or above the remaining owners', () => {
      const human = owner()

      expect(removeCloudCosigner([human, toCosignerOwner(cosigner)], 1, cosigner)).toEqual({
        owners: [human],
        threshold: 1,
      })
      expect(removeCloudCosigner([human, toCosignerOwner(cosigner)], 5, cosigner)).toEqual({
        owners: [human],
        threshold: 1,
      })
    })

    it('is a no-op when the cosigner is not an owner', () => {
      const owners = [owner()]

      expect(removeCloudCosigner(owners, 1, cosigner)).toEqual({ owners, threshold: 1 })
      expect(hasCloudCosigner(owners, cosigner)).toBe(false)
    })
  })
})
