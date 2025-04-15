import React, { act } from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { ClearPendingTxs } from '../ClearPendingTxs'
import { render } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { PendingStatus, PendingTxType } from '@/store/pendingTxsSlice'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

const safeAddress = faker.finance.ethereumAddress()

describe('ClearPendingTxs', () => {
  it('clears a single transaction', () => {
    render(<ClearPendingTxs />, {
      initialReduxState: {
        pendingTxs: {
          ['0x123']: {
            chainId: '1',
            safeAddress,
            nonce: 0,
            data: faker.string.hexadecimal({ length: 64 }),
            to: faker.finance.ethereumAddress(),
            status: PendingStatus.PROCESSING,
            txHash: faker.string.hexadecimal({ length: 64 }),
            signerAddress: faker.finance.ethereumAddress(),
            submittedAt: Date.now(),
            signerNonce: 0,
            txType: PendingTxType.CUSTOM_TX,
          },
        },
        safeInfo: {
          data: extendedSafeInfoBuilder()
            .with({ address: { value: safeAddress } })
            .with({ chainId: '1' })
            .build(),
          loading: false,
        },
      },
    })
    expect(screen.getByText('Clear 1 transaction')).toBeInTheDocument()
    act(() => {
      fireEvent.click(screen.getByText('Clear 1 transaction'))
    })
    expect(screen.getByText('No pending transactions')).toBeInTheDocument()
  })
  it('clears multiple transactions', () => {
    render(<ClearPendingTxs />, {
      initialReduxState: {
        pendingTxs: {
          ['0x123']: {
            chainId: '1',
            safeAddress,
            nonce: 0,
            data: faker.string.hexadecimal({ length: 64 }),
            to: faker.finance.ethereumAddress(),
            status: PendingStatus.PROCESSING,
            txHash: faker.string.hexadecimal({ length: 64 }),
            signerAddress: faker.finance.ethereumAddress(),
            submittedAt: Date.now(),
            signerNonce: 0,
            txType: PendingTxType.CUSTOM_TX,
          },
          ['0x234']: {
            chainId: '1',
            safeAddress,
            nonce: 1,
            data: faker.string.hexadecimal({ length: 64 }),
            to: faker.finance.ethereumAddress(),
            status: PendingStatus.PROCESSING,
            txHash: faker.string.hexadecimal({ length: 64 }),
            signerAddress: faker.finance.ethereumAddress(),
            submittedAt: Date.now(),
            signerNonce: 0,
            txType: PendingTxType.CUSTOM_TX,
          },
          ['0x345']: {
            chainId: '100',
            safeAddress,
            nonce: 0,
            data: faker.string.hexadecimal({ length: 64 }),
            to: faker.finance.ethereumAddress(),
            status: PendingStatus.PROCESSING,
            txHash: faker.string.hexadecimal({ length: 64 }),
            signerAddress: faker.finance.ethereumAddress(),
            submittedAt: Date.now(),
            signerNonce: 0,
            txType: PendingTxType.CUSTOM_TX,
          },
        },
        safeInfo: {
          data: extendedSafeInfoBuilder()
            .with({ address: { value: safeAddress } })
            .with({ chainId: '1' })
            .build(),
          loading: false,
        },
      },
    })
    expect(screen.getByText('Clear 2 transactions')).toBeInTheDocument()
    act(() => {
      fireEvent.click(screen.getByText('Clear 2 transactions'))
    })
    expect(screen.getByText('No pending transactions')).toBeInTheDocument()
  })
})
