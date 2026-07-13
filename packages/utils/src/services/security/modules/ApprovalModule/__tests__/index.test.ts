import { faker } from '@faker-js/faker'
import { parseUnits } from 'ethers'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType } from '@safe-global/types-kit'
import { Multi_send__factory } from '@safe-global/utils/types/contracts'
import { ERC20_INTERFACE } from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { ApprovalModule } from '../index'

const MULTISEND_INTERFACE = Multi_send__factory.createInterface()

describe('ApprovalModule', () => {
  const approvalModule = new ApprovalModule()

  it('scans a plain transaction data object for an approve call', () => {
    const spender = faker.finance.ethereumAddress()
    const tokenAddress = faker.finance.ethereumAddress()
    const amount = parseUnits('100', 18)

    const result = approvalModule.scanTransaction({
      safeTransaction: {
        data: {
          to: tokenAddress,
          data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, amount]),
        },
      },
    })

    expect(result.payload).toHaveLength(1)
    expect(result.payload?.[0]).toMatchObject({
      tokenAddress,
      amount,
      method: 'approve',
      transactionIndex: 0,
    })
    expect(result.payload?.[0].spender.toLowerCase()).toEqual(spender.toLowerCase())
  })

  it('scans multiSend data and keeps the inner transaction index', () => {
    const spender = faker.finance.ethereumAddress()
    const tokenAddress = faker.finance.ethereumAddress()
    const amount = parseUnits('1', 6)
    const multiSendData = encodeMultiSendData([
      { to: faker.finance.ethereumAddress(), value: '0', data: '0xbaddad', operation: OperationType.Call },
      {
        to: tokenAddress,
        value: '0',
        data: ERC20_INTERFACE.encodeFunctionData('increaseAllowance', [spender, amount]),
        operation: OperationType.Call,
      },
    ])

    const result = approvalModule.scanTransaction({
      safeTransaction: {
        data: {
          to: faker.finance.ethereumAddress(),
          data: MULTISEND_INTERFACE.encodeFunctionData('multiSend', [multiSendData]),
        },
      },
    })

    expect(result.payload).toHaveLength(1)
    expect(result.payload?.[0]).toMatchObject({
      amount,
      method: 'increaseAllowance',
      transactionIndex: 1,
    })
    expect(result.payload?.[0].tokenAddress.toLowerCase()).toEqual(tokenAddress.toLowerCase())
  })

  it('returns no payload for a transaction without approvals', () => {
    const result = approvalModule.scanTransaction({
      safeTransaction: {
        data: {
          to: faker.finance.ethereumAddress(),
          data: '0xbaddad',
        },
      },
    })

    expect(result.payload).toBeUndefined()
  })
})
