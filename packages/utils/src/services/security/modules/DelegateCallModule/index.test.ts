import { OperationType } from '@safe-global/types-kit'
import { getMultiSendCallOnlyDeployment } from '@safe-global/safe-deployments'
import { toBeHex } from 'ethers'

import { DelegateCallModule } from './index'
import { createMockSafeTransaction, getMockMultiSendCalldata } from '@safe-global/utils/tests/transactions'
import { chainBuilder } from '@safe-global/utils/tests/builders/chains'
import { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'

describe('DelegateCallModule', () => {
  const DelegateCallModuleInstance = new DelegateCallModule()

  const chainInfo = chainBuilder().with({ chainId: '1', chainLogoUri: null }).build() as unknown as ChainInfo

  it('should not warn about Call operation transactions', async () => {
    const recipient = toBeHex('0x1', 20)

    const safeTransaction = createMockSafeTransaction({
      to: recipient,
      data: '0x',
      operation: OperationType.Call,
    })

    const result = await DelegateCallModuleInstance.scanTransaction({
      safeTransaction,
      chain: chainInfo,
      safeVersion: '1.3.0',
    })

    expect(result).toEqual({
      severity: 0,
    })
  })

  it('should not warn about MultiSendCallOnly DelegateCall operation transactions', async () => {
    const CHAIN_ID = '1'
    const SAFE_VERSION = '1.3.0'

    const multiSend = getMultiSendCallOnlyDeployment({
      network: CHAIN_ID,
      version: SAFE_VERSION,
    })!.defaultAddress

    const recipient1 = toBeHex('0x2', 20)
    const recipient2 = toBeHex('0x3', 20)

    const data = getMockMultiSendCalldata([recipient1, recipient2])

    const safeTransaction = createMockSafeTransaction({
      to: multiSend,
      data,
      operation: OperationType.DelegateCall,
    })

    const result = await DelegateCallModuleInstance.scanTransaction({
      safeTransaction,
      chain: chainInfo,
      safeVersion: SAFE_VERSION,
    })

    expect(result).toEqual({
      severity: 0,
    })
  })

  it('should warn about non-MultiSendCallOnly DelegateCall operation transactions', async () => {
    const recipient = toBeHex('0x1', 20)

    const safeTransaction = createMockSafeTransaction({
      to: recipient,
      data: '0x',
      operation: OperationType.DelegateCall,
    })

    const result = await DelegateCallModuleInstance.scanTransaction({
      safeTransaction,
      chain: chainInfo,
      safeVersion: '1.3.0',
    })

    expect(result).toEqual({
      severity: 3,
      payload: {
        description: {
          long: 'This transaction is a DelegateCall. It calls a smart contract that will be able to modify your Safe Account.',
          short: 'Unexpected DelegateCall',
        },
      },
    })
  })
})
