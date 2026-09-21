import React from 'react'
import { router } from 'expo-router'
import { render, screen, fireEvent } from '@/src/tests/test-utils'
import { TxActionsList } from './TxActionsList'
import { Operation } from '@safe-global/store/gateway/types'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { faker } from '@faker-js/faker'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { multiSendDefaultsToSelf } from '@safe-global/utils/utils/multiSend'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ txId: 'multisig_0x_0x' }),
  router: { push: jest.fn() },
}))

jest.mock('@/src/store/hooks/activeSafe', () => ({
  useDefinedActiveSafe: () => ({ address: '0x0000000000000000000000000000000000000001', chainId: '1' }),
}))

jest.mock('@safe-global/utils/utils/multiSend', () => ({
  ...jest.requireActual('@safe-global/utils/utils/multiSend'),
  multiSendDefaultsToSelf: jest.fn(),
}))

const buildTxDetails = (safeAddress: string, to: string): TransactionDetails =>
  ({
    safeAddress,
    txId: 'multisig_0x_0x',
    txData: {
      to: { value: faker.finance.ethereumAddress() },
      addressInfoIndex: {},
      dataDecoded: {
        method: 'multiSend',
        parameters: [
          {
            name: 'transactions',
            type: 'bytes',
            value: '0x',
            valueDecoded: [
              {
                operation: Operation.CALL,
                to,
                value: '0',
                data: '0x610b5925',
                dataDecoded: { method: 'enableModule', parameters: [] },
              },
            ],
          },
        ],
      },
    },
  }) as unknown as TransactionDetails

describe('TxActionsList', () => {
  beforeEach(() => {
    // Default: the batch's MultiSend version defaults a zero `to` to the Safe (v1.5.0+)
    ;(multiSendDefaultsToSelf as jest.Mock).mockReturnValue(true)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('resolves a zero-address sub-transaction to the executing Safe', () => {
    const safeAddress = faker.finance.ethereumAddress()
    render(<TxActionsList txDetails={buildTxDetails(safeAddress, ZERO_ADDRESS)} />)

    fireEvent.press(screen.getByTestId('tx-action-item-0'))

    // The action handed to the details screen targets the Safe, not the zero address
    const pushArg = (router.push as jest.Mock).mock.calls[0][0]
    expect(pushArg.params.action).toContain(safeAddress)
    expect(pushArg.params.action).not.toContain(ZERO_ADDRESS)
  })

  it('leaves a non-zero sub-transaction target unchanged', () => {
    const safeAddress = faker.finance.ethereumAddress()
    const contract = faker.finance.ethereumAddress()
    render(<TxActionsList txDetails={buildTxDetails(safeAddress, contract)} />)

    fireEvent.press(screen.getByTestId('tx-action-item-0'))

    // A real target is passed through verbatim, not rewritten to the Safe
    const pushArg = (router.push as jest.Mock).mock.calls[0][0]
    expect(pushArg.params.action).toContain(contract)
    expect(pushArg.params.action).not.toContain(safeAddress)
  })

  it('does NOT resolve the zero address for a pre-1.5.0 MultiSend', () => {
    ;(multiSendDefaultsToSelf as jest.Mock).mockReturnValue(false)
    const safeAddress = faker.finance.ethereumAddress()
    render(<TxActionsList txDetails={buildTxDetails(safeAddress, ZERO_ADDRESS)} />)

    fireEvent.press(screen.getByTestId('tx-action-item-0'))

    // The raw zero address is preserved (older MultiSend does not default it to the Safe)
    const pushArg = (router.push as jest.Mock).mock.calls[0][0]
    expect(pushArg.params.action).toContain(ZERO_ADDRESS)
    expect(pushArg.params.action).not.toContain(safeAddress)
  })
})
