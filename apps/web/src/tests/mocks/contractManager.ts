import {
  Gnosis_safe__factory,
  Multi_send__factory,
} from '@safe-global/utils/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.3.0'
import { faker } from '@faker-js/faker'
import type { ContractManager } from '@safe-global/protocol-kit'

const safeContractInterface = Gnosis_safe__factory.createInterface()
const multiSendInterface = Multi_send__factory.createInterface()

const fakeDefaultOwner = faker.finance.ethereumAddress()
const mockMultiSendCallOnlyAddress = faker.finance.ethereumAddress()
const mockMultiSendAddress = faker.finance.ethereumAddress()

export const mockContractManager = (owners: string[] = [fakeDefaultOwner], threshold: number = 1): ContractManager => {
  const safeAddress = faker.finance.ethereumAddress()

  return {
    safeContract: {
      encode: (methodName: string, params: any) => {
        if (methodName === 'execTransaction') {
          return safeContractInterface.encodeFunctionData(methodName, params)
        }
        throw new Error('Method not mocked yet')
      },
      getOwners: () => Promise.resolve(owners),
      getThreshold: () => Promise.resolve(threshold),
      getAddress: () => Promise.resolve(safeAddress),
      getNonce: () => Promise.resolve(0),
      getModules: () => Promise.resolve([]),
      isOwner: (address: string) => Promise.resolve(owners.includes(address)),
      isModuleEnabled: () => Promise.resolve(false),
      getVersion: () => Promise.resolve('1.3.0'),
    },
    contractNetworks: {},
    isL1SafeSingleton: true,
    multiSendCallOnlyContract: {
      encode: (methodName: string, params: any) => {
        if (methodName === 'multiSend') {
          return multiSendInterface.encodeFunctionData(methodName, params)
        }
        throw new Error('Method not mocked yet')
      },
      getAddress: () => Promise.resolve(mockMultiSendCallOnlyAddress),
    },
    multiSendContract: {
      encode: (methodName: string, params: any) => {
        if (methodName === 'multiSend') {
          return multiSendInterface.encodeFunctionData(methodName, params)
        }
        throw new Error('Method not mocked yet')
      },
      getAddress: () => Promise.resolve(mockMultiSendAddress),
    },
  } as unknown as ContractManager
}
