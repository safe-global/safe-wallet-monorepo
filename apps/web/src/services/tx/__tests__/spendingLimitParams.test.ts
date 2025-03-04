import type { NewSpendingLimitFlowProps } from '@/components/tx-flow/flows/NewSpendingLimit'
import { chainBuilder } from '@/tests/builders/chains'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import * as safeCoreSDK from '@/hooks/coreSDK/safeCoreSDK'
import * as txSender from '@/services/tx/tx-sender/create'
import * as spendingLimitParams from '@/services/tx/spendingLimitParams'
import type Safe from '@safe-global/protocol-kit'
import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import { createNewSpendingLimitTx } from '@/services/tx/tx-sender'

const mockData: NewSpendingLimitFlowProps = {
  beneficiary: ZERO_ADDRESS,
  tokenAddress: ZERO_ADDRESS,
  amount: '1',
  resetTime: '0',
}

const mockChain = chainBuilder().build()

const mockModules = [{ value: '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134' }]

describe('createNewSpendingLimitTx', () => {
  let mockCreateEnableModuleTx: any
  let mockSDK: Safe

  beforeEach(() => {
    jest.resetAllMocks()

    mockCreateEnableModuleTx = jest.fn(() => ({
      data: {
        data: '0x',
        to: '0x',
      },
    }))

    mockSDK = {
      isModuleEnabled: jest.fn(() => false),
      createEnableModuleTx: mockCreateEnableModuleTx,
      createTransaction: jest.fn(() => 'asd'),
    } as unknown as Safe

    jest.spyOn(txSender, 'createMultiSendCallOnlyTx').mockImplementation(jest.fn())
    jest.spyOn(safeCoreSDK, 'getSafeSDK').mockReturnValue(mockSDK)
  })

  it('returns undefined if there is no sdk instance', async () => {
    jest.spyOn(safeCoreSDK, 'getSafeSDK').mockReturnValue(undefined)
    const result = await createNewSpendingLimitTx(mockData, [], '4', mockChain, mockModules, true, 18)

    expect(result).toBeUndefined()
  })

  it('returns undefined if there is no contract address', async () => {
    jest.spyOn(safeCoreSDK, 'getSafeSDK').mockReturnValue(mockSDK)
    const result = await createNewSpendingLimitTx(mockData, [], '4', mockChain, mockModules, true, 18)

    expect(result).toBeUndefined()
  })

  it('creates a tx to enable the spending limit module if its not registered yet', async () => {
    await createNewSpendingLimitTx(mockData, [], '4', mockChain, [], true, 18)

    expect(mockCreateEnableModuleTx).toHaveBeenCalledTimes(1)
  })

  it('creates a tx to add a delegate if beneficiary is not a delegate yet', async () => {
    const spy = jest.spyOn(spendingLimitParams, 'createAddDelegateTx')
    await createNewSpendingLimitTx(mockData, [], '4', mockChain, mockModules, true, 18)

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('does not create a tx to add a delegate if beneficiary is already a delegate', async () => {
    const mockSpendingLimits: SpendingLimitState[] = [
      {
        beneficiary: ZERO_ADDRESS,
        token: { address: '0x10', decimals: 18, symbol: 'TST' },
        amount: '1',
        resetTimeMin: '0',
        lastResetMin: '0',
        nonce: '0',
        spent: '1',
      },
    ]

    const spy = jest.spyOn(spendingLimitParams, 'createAddDelegateTx')
    await createNewSpendingLimitTx(mockData, mockSpendingLimits, '4', mockChain, mockModules, true, 18)

    expect(spy).not.toHaveBeenCalled()
  })

  it('creates a tx to reset an existing allowance if some of the allowance was already spent', async () => {
    const existingSpendingLimitMock = {
      beneficiary: ZERO_ADDRESS,
      token: { address: '0x10', decimals: 18, symbol: 'TST' },
      amount: '1',
      resetTimeMin: '0',
      lastResetMin: '0',
      nonce: '0',
      spent: '1',
    }

    const spy = jest.spyOn(spendingLimitParams, 'createResetAllowanceTx')
    await createNewSpendingLimitTx(mockData, [], '4', mockChain, mockModules, true, 18, existingSpendingLimitMock)

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('does not create a tx to reset an existing allowance if none was spent', async () => {
    const existingSpendingLimitMock = {
      beneficiary: ZERO_ADDRESS,
      token: { address: '0x10', decimals: 18, symbol: 'TST' },
      amount: '1',
      resetTimeMin: '0',
      lastResetMin: '0',
      nonce: '0',
      spent: '0',
    }

    const spy = jest.spyOn(spendingLimitParams, 'createResetAllowanceTx')
    await createNewSpendingLimitTx(mockData, [], '4', mockChain, mockModules, true, 18, existingSpendingLimitMock)

    expect(spy).not.toHaveBeenCalled()
  })

  it('creates a tx to set the allowance', async () => {
    const spy = jest.spyOn(spendingLimitParams, 'createSetAllowanceTx')
    await createNewSpendingLimitTx(mockData, [], '4', mockChain, mockModules, true, 18)

    expect(spy).toHaveBeenCalled()
  })
  it('encodes all txs as a single multiSend tx', async () => {
    const spy = jest.spyOn(txSender, 'createMultiSendCallOnlyTx')
    await createNewSpendingLimitTx(mockData, [], '4', mockChain, mockModules, true, 18)

    expect(spy).toHaveBeenCalled()
  })
})
