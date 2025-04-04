import { faker } from '@faker-js/faker/locale/af_ZA'
import { getDeviatingSetups, getSafeSetups, getSharedSetup, isMultiChainSafeItem } from './utils'
import { PendingSafeStatus } from '@safe-global/utils/features/counterfactual/store/types'

import { PayMethod } from '@safe-global/utils/features/counterfactual/types'

describe('multiChain/utils', () => {
  describe('isMultiChainSafeItem', () => {
    it('should return true for MultiChainSafeIem', () => {
      expect(
        isMultiChainSafeItem({
          address: faker.finance.ethereumAddress(),
          safes: [
            {
              address: faker.finance.ethereumAddress(),
              chainId: '1',
              isReadOnly: false,
              isPinned: false,
              lastVisited: 0,
              name: undefined,
            },
          ],
          isPinned: false,
          lastVisited: 0,
          name: undefined,
        }),
      ).toBeTruthy()
    })

    it('should return false for SafeItem', () => {
      expect(
        isMultiChainSafeItem({
          address: faker.finance.ethereumAddress(),
          chainId: '1',
          isReadOnly: false,
          isPinned: false,
          lastVisited: 0,
          name: undefined,
        }),
      ).toBeFalsy()
    })
  })

  describe('getSharedSetup', () => {
    it('should return undefined if no setup info is available', () => {
      expect(getSharedSetup([])).toBeUndefined()
      expect(getSharedSetup([undefined])).toBeUndefined()
      expect(getSharedSetup([undefined, undefined])).toBeUndefined()
    })

    it('should return undefined if some of the setups are undefined', () => {
      const safeSetups = [
        {
          owners: [faker.finance.ethereumAddress()],
          threshold: 1,
          chainId: '1',
        },
        undefined,
      ]
      expect(getSharedSetup(safeSetups)).toBeUndefined()
    })

    it('should return undefined if the owners do not match', () => {
      // 2 Safes. One with 1 and one with 2 owners.
      const owners1 = [faker.finance.ethereumAddress()]
      const owners2 = [...owners1, faker.finance.ethereumAddress()]
      const safeSetups = [
        {
          owners: owners1,
          threshold: 1,
          chainId: '1',
        },
        {
          owners: owners2,
          threshold: 1,
          chainId: '100',
        },
      ]

      expect(getSharedSetup(safeSetups)).toBeUndefined()
    })
    it('should return undefined if the threshold does not match', () => {
      const owners = [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()]

      const safeSetups = [
        {
          owners,
          threshold: 1,
          chainId: '1',
        },
        {
          owners,
          threshold: 2,
          chainId: '100',
        },
      ]

      expect(getSharedSetup(safeSetups)).toBeUndefined()
    })

    it('should return the shared setup if owners and threshold matches', () => {
      const owners = [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()]

      const safeSetups = [
        {
          owners,
          threshold: 2,
          chainId: '1',
        },
        {
          owners,
          threshold: 2,
          chainId: '100',
        },
      ]

      expect(getSharedSetup(safeSetups)).toEqual({ owners, threshold: 2 })
    })
  })

  describe('getDeviatingSetups', () => {
    it('should return empty array if no setup data is provided', () => {
      expect(getDeviatingSetups([], '1')).toEqual([])
    })

    it('should return empty array if current chainId is not defined', () => {
      const safeSetups = [
        {
          owners: [faker.finance.ethereumAddress()],
          threshold: 1,
          chainId: '1',
        },
      ]
      expect(getDeviatingSetups(safeSetups, undefined)).toEqual([])
    })

    it('should return empty array if all setups are the same', () => {
      const owner1 = faker.finance.ethereumAddress()
      const owner2 = faker.finance.ethereumAddress()

      const safeSetups = [
        {
          owners: [owner1, owner2],
          threshold: 2,
          chainId: '1',
        },
        {
          owners: [owner1, owner2],
          threshold: 2,
          chainId: '5',
        },
        {
          owners: [owner1, owner2],
          threshold: 2,
          chainId: '100',
        },
      ]
      expect(getDeviatingSetups(safeSetups, '1')).toEqual([])
    })

    it('should return all setups that are different from the current one', () => {
      const currentChainId = '1'
      const owner1 = faker.finance.ethereumAddress()
      const owner2 = faker.finance.ethereumAddress()
      const owner3 = faker.finance.ethereumAddress()

      const currentSetup = { owners: [owner1, owner2], threshold: 2 }
      const differentOwnersSetup = { owners: [owner2, owner3], threshold: 2 }
      const differentThresholdSetup = { owners: [owner1, owner2], threshold: 1 }
      const differentOwnersAndThresholdSetup = { owners: [owner1], threshold: 1 }

      const safeSetups = [
        {
          ...currentSetup,
          chainId: currentChainId,
        },
        {
          ...currentSetup,
          chainId: '4',
        },
        {
          ...differentOwnersSetup,
          chainId: '5',
        },
        {
          ...differentThresholdSetup,
          chainId: '100',
        },
        {
          ...differentOwnersAndThresholdSetup,
          chainId: '11155111',
        },
      ]
      expect(getDeviatingSetups(safeSetups, currentChainId)).toEqual([
        {
          ...differentOwnersSetup,
          chainId: '5',
        },
        {
          ...differentThresholdSetup,
          chainId: '100',
        },
        {
          ...differentOwnersAndThresholdSetup,
          chainId: '11155111',
        },
      ])
    })

    it('should return empty array if setup data for current chain is not found', () => {
      const currentChainId = '1'

      const safeSetups = [
        {
          owners: [faker.finance.ethereumAddress()],
          threshold: 1,
          chainId: '10',
        },
        {
          owners: [faker.finance.ethereumAddress()],
          threshold: 1,
          chainId: '5',
        },
        {
          owners: [faker.finance.ethereumAddress()],
          threshold: 1,
          chainId: '100',
        },
      ]
      expect(getDeviatingSetups(safeSetups, currentChainId)).toEqual([])
    })
  })

  describe('getSafeSetups', () => {
    it('should return an empty array if no setup infos available', () => {
      expect(
        getSafeSetups(
          [
            {
              address: faker.finance.ethereumAddress(),
              chainId: '1',
              isReadOnly: false,
              isPinned: false,
              lastVisited: 0,
              name: undefined,
            },
          ],
          [],
          {},
        ),
      ).toEqual([])
    })

    it('should return undefined if no setup infos available', () => {
      expect(
        getSafeSetups(
          [
            {
              address: faker.finance.ethereumAddress(),
              chainId: '1',
              isReadOnly: false,
              isPinned: false,
              lastVisited: 0,
              name: undefined,
            },
          ],
          [],
          {},
        ),
      ).toEqual([])
    })

    it('should return the setup data if deployed safes have setup data available', () => {
      const address = faker.finance.ethereumAddress()
      const ownerAddress1 = faker.finance.ethereumAddress()
      const ownerAddress2 = faker.finance.ethereumAddress()

      expect(
        getSafeSetups(
          [
            {
              address,
              chainId: '1',
              isReadOnly: false,
              isPinned: false,
              lastVisited: 0,
              name: undefined,
            },
            {
              address,
              chainId: '100',
              isReadOnly: false,
              isPinned: false,
              lastVisited: 0,
              name: undefined,
            },
          ],
          [
            {
              address: {
                value: address,
              },
              awaitingConfirmation: null,
              chainId: '1',
              fiatTotal: '0',
              owners: [{ value: ownerAddress1 }],
              queued: 0,
              threshold: 1,
            },
            {
              address: {
                value: address,
              },
              awaitingConfirmation: null,
              chainId: '100',
              fiatTotal: '0',
              owners: [{ value: ownerAddress2 }],
              queued: 0,
              threshold: 2,
            },
          ],
          {},
        ),
      ).toEqual([
        { owners: [ownerAddress1], threshold: 1, chainId: '1' },
        { owners: [ownerAddress2], threshold: 2, chainId: '100' },
      ])
    })

    it('should return the setup data if undeployed safes have setup data available', () => {
      const address = faker.finance.ethereumAddress()

      const ownerAddress1 = faker.finance.ethereumAddress()
      const ownerAddress2 = faker.finance.ethereumAddress()

      expect(
        getSafeSetups(
          [
            {
              address,
              chainId: '1',
              isReadOnly: false,
              isPinned: false,
              lastVisited: 0,
              name: undefined,
            },
            {
              address,
              chainId: '100',
              isReadOnly: false,
              isPinned: false,
              lastVisited: 0,
              name: undefined,
            },
          ],
          [],
          {
            ['1']: {
              [address]: {
                props: {
                  safeAccountConfig: {
                    owners: [ownerAddress1],
                    threshold: 1,
                  },
                },
                status: {
                  status: PendingSafeStatus.AWAITING_EXECUTION,
                  type: PayMethod.PayLater,
                },
              },
            },
            ['100']: {
              [address]: {
                props: {
                  safeAccountConfig: {
                    owners: [ownerAddress2],
                    threshold: 2,
                  },
                },
                status: {
                  status: PendingSafeStatus.AWAITING_EXECUTION,
                  type: PayMethod.PayLater,
                },
              },
            },
          },
        ),
      ).toEqual([
        { owners: [ownerAddress1], threshold: 1, chainId: '1' },
        { owners: [ownerAddress2], threshold: 2, chainId: '100' },
      ])
    })

    it('should only return setup data where if setup data is available', () => {
      const address = faker.finance.ethereumAddress()

      const ownerAddress1 = faker.finance.ethereumAddress()
      const ownerAddress2 = faker.finance.ethereumAddress()

      expect(
        getSafeSetups(
          [
            {
              address,
              chainId: '1',
              isReadOnly: false,
              isPinned: false,
              lastVisited: 0,
              name: undefined,
            },
            {
              address,
              chainId: '100',
              isReadOnly: false,
              isPinned: false,
              lastVisited: 0,
              name: undefined,
            },
            {
              address,
              chainId: '5',
              isReadOnly: false,
              isPinned: false,
              lastVisited: 0,
              name: undefined,
            },
          ],
          [
            {
              address: {
                value: address,
              },
              awaitingConfirmation: null,
              chainId: '1',
              fiatTotal: '0',
              owners: [{ value: ownerAddress1 }],
              queued: 0,
              threshold: 1,
            },
          ],
          {
            ['100']: {
              [address]: {
                props: {
                  safeAccountConfig: {
                    owners: [ownerAddress2],
                    threshold: 2,
                  },
                },
                status: {
                  status: PendingSafeStatus.AWAITING_EXECUTION,
                  type: PayMethod.PayLater,
                },
              },
            },
          },
        ),
      ).toEqual([
        { owners: [ownerAddress1], threshold: 1, chainId: '1' },
        { owners: [ownerAddress2], threshold: 2, chainId: '100' },
      ])
    })

    it('should return setup data for a mix of deployed and undeployed safes', () => {
      const address = faker.finance.ethereumAddress()

      const ownerAddress1 = faker.finance.ethereumAddress()
      const ownerAddress2 = faker.finance.ethereumAddress()

      expect(
        getSafeSetups(
          [
            {
              address,
              chainId: '1',
              isReadOnly: false,
              isPinned: false,
              lastVisited: 0,
              name: undefined,
            },
            {
              address,
              chainId: '100',
              isReadOnly: false,
              isPinned: false,
              lastVisited: 0,
              name: undefined,
            },
          ],
          [
            {
              address: {
                value: address,
              },
              awaitingConfirmation: null,
              chainId: '1',
              fiatTotal: '0',
              owners: [{ value: ownerAddress1 }],
              queued: 0,
              threshold: 1,
            },
          ],
          {
            ['100']: {
              [address]: {
                props: {
                  safeAccountConfig: {
                    owners: [ownerAddress2],
                    threshold: 2,
                  },
                },
                status: {
                  status: PendingSafeStatus.AWAITING_EXECUTION,
                  type: PayMethod.PayLater,
                },
              },
            },
          },
        ),
      ).toEqual([
        { owners: [ownerAddress1], threshold: 1, chainId: '1' },
        { owners: [ownerAddress2], threshold: 2, chainId: '100' },
      ])
    })
  })
})
