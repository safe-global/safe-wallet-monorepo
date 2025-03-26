import React from 'react'
import { render, fireEvent } from '@/src/tests/test-utils'
import { AlreadySigned } from './AlreadySigned'
import { Linking } from 'react-native'
import { GATEWAY_URL, SAFE_WEB_TRANSACTIONS_URL } from '@/src/config/constants'
import { http, HttpResponse } from 'msw'
import { server } from '@/src/tests/server'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway/chains'
import { makeStore } from '@/src/store'

// Mock Linking
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}))

describe('AlreadySigned', () => {
  const mockProps = {
    txId: 'test-tx-id',
    safeAddress: '0x123',
    chainId: '1',
  }

  const mockChain = {
    shortName: 'eth',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains`, () => {
        return HttpResponse.json({
          results: [
            {
              chainId: '1',
              shortName: 'eth',
            },
          ],
        })
      }),
    )
  })

  const renderWithStore = async (ui: React.ReactElement) => {
    const store = makeStore()
    await store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())
    return render(ui, { initialStore: store.getState() })
  }

  it('renders correctly with all required elements', async () => {
    const { getByText } = await renderWithStore(<AlreadySigned {...mockProps} />)

    expect(getByText('This transaction can be executed in the web app only.')).toBeTruthy()
    expect(getByText('Go to Web app')).toBeTruthy()
    expect(getByText('Confirm')).toBeTruthy()
  })

  it('opens web app URL when "Go to Web app" is pressed', async () => {
    const { getByText } = await renderWithStore(<AlreadySigned {...mockProps} />)

    const expectedUrl = SAFE_WEB_TRANSACTIONS_URL.replace(
      ':safeAddressWithChainPrefix',
      `${mockChain.shortName}:${mockProps.safeAddress}`,
    ).replace(':txId', mockProps.txId)

    fireEvent.press(getByText('Go to Web app'))
    expect(Linking.openURL).toHaveBeenCalledWith(expectedUrl)
  })

  it('matches snapshot', async () => {
    const { toJSON } = await renderWithStore(<AlreadySigned {...mockProps} />)
    expect(toJSON()).toMatchSnapshot()
  })
})
