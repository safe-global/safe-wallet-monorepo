import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { fireEvent, render } from '@/tests/test-utils'
import SingleTx from '@/pages/transactions/tx'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'

jest.mock('@/features/hypernative', () => ({
  ...jest.requireActual('@/features/hypernative'),
  useHnQueueAssessment: () => ({
    assessments: {},
    isLoading: false,
    setPages: jest.fn(),
    setTx: jest.fn(),
  }),
}))

const MOCK_SAFE_ADDRESS = '0x0000000000000000000000000000000000005AFE'
const SAFE_ADDRESS = '0x87a57cBf742CC1Fc702D0E9BF595b1E056693e2f'

// Minimum mock to render <SingleTx />
const txDetails = {
  txId: 'multisig_0x87a57cBf742CC1Fc702D0E9BF595b1E056693e2f_0x236da79434c398bf98b204e6f3d93d',
  safeAddress: SAFE_ADDRESS,
  txInfo: {
    type: 'Custom',
    to: {
      value: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
    },
  },
} as TransactionDetails

jest.mock('next/router', () => ({
  useRouter() {
    return {
      pathname: '/transactions/tx',
      query: {
        safe: `gor:${SAFE_ADDRESS}`,
        id: 'multisig_0x87a57cBf742CC1Fc702D0E9BF595b1E056693e2f_0x236da79434c398bf98b204e6f3d93d',
      },
    }
  },
}))

const extendedSafeInfo = extendedSafeInfoBuilder().build()

jest.spyOn(useSafeInfo, 'default').mockImplementation(() => ({
  safeAddress: SAFE_ADDRESS,
  safe: {
    ...extendedSafeInfo,
    chainId: '5',
  },
  safeError: undefined,
  safeLoading: false,
  safeLoaded: true,
}))

describe('SingleTx', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders <SingleTx />', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`, () => {
        return HttpResponse.json(txDetails)
      }),
    )

    const screen = render(<SingleTx />)

    const button = screen.queryByText('Details')
    expect(button).not.toBeInTheDocument()

    expect(await screen.findByText('Contract interaction')).toBeInTheDocument()
  })

  it('shows an error when the transaction has failed to load', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )

    const screen = render(<SingleTx />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load transaction')).toBeInTheDocument()
    })

    await waitFor(() => {
      fireEvent.click(screen.getByText('Details'))
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('shows an error when transaction is not from the opened Safe', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`, () => {
        return HttpResponse.json({
          ...txDetails,
          safeAddress: MOCK_SAFE_ADDRESS,
        })
      }),
    )

    const screen = render(<SingleTx />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load transaction')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Details'))

    await waitFor(() => {
      expect(screen.getByText('Transaction with this id was not found in this Safe Account')).toBeInTheDocument()
    })
  })
})
