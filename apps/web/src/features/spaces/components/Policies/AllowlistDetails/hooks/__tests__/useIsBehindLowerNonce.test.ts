import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { useSafesGetNoncesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { fakerChecksummedAddress, renderHook, waitFor } from '@/tests/test-utils'
import { useIsBehindLowerNonce } from '../useIsBehindLowerNonce'

const queuedTransaction = () => ({
  safe: { chainId: faker.string.numeric({ length: 3, allowLeadingZeros: false }), address: fakerChecksummedAddress() },
  nonce: faker.number.int({ min: 10, max: 100 }),
})

const serveSafeNonce = (currentNonce: number) =>
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/nonces`, () =>
      HttpResponse.json({ currentNonce, recommendedNonce: currentNonce + 1 }),
    ),
  )

const renderWithNonces = (transaction: ReturnType<typeof queuedTransaction>, isExecutable: boolean) =>
  renderHook(() => ({
    isBehind: useIsBehindLowerNonce(transaction, isExecutable),
    nonces: useSafesGetNoncesV1Query({ chainId: transaction.safe.chainId, safeAddress: transaction.safe.address }),
  }))

describe('useIsBehindLowerNonce', () => {
  it('should, when the Safe has not reached the nonce of the transaction, say it is behind a lower nonce', async () => {
    const transaction = queuedTransaction()
    serveSafeNonce(transaction.nonce - faker.number.int({ min: 1, max: 5 }))

    const { result } = renderWithNonces(transaction, true)

    await waitFor(() => expect(result.current.isBehind).toBe(true))
  })

  it('should, when the transaction has the Safe nonce, say it is next in the queue', async () => {
    const transaction = queuedTransaction()
    serveSafeNonce(transaction.nonce)

    const { result } = renderWithNonces(transaction, true)

    await waitFor(() => expect(result.current.nonces.isSuccess).toBe(true))
    expect(result.current.isBehind).toBe(false)
  })

  it('should, when the transaction still waits for signatures, not say it is behind a lower nonce', async () => {
    const transaction = queuedTransaction()
    serveSafeNonce(transaction.nonce - faker.number.int({ min: 1, max: 5 }))

    const { result } = renderWithNonces(transaction, false)

    await waitFor(() => expect(result.current.nonces.isSuccess).toBe(true))
    expect(result.current.isBehind).toBe(false)
  })
})
