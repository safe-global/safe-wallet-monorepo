import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { fakerChecksummedAddress, fireEvent, render, screen, waitFor, within } from '@/tests/test-utils'
import * as useChains from '@/hooks/useChains'
import * as analytics from '@/services/analytics'
import { ADDRESS_POISONING_EVENTS, MixpanelEventParams } from '@/services/analytics'
import type { RootState } from '@/store'
import { loadSafeDefaultData } from '@/components/new-safe/load'
import SetAddressStep from '..'

const lookalikeOf = (address: string) =>
  getAddress(
    `0x${address.slice(2, 6)}${faker.string.hexadecimal({ length: 32, prefix: '' })}${address.slice(-4)}`.toLowerCase(),
  )

describe('SetAddressStep look-alike check', () => {
  const safe = fakerChecksummedAddress()
  const safeName = faker.company.name()
  const lookalike = lookalikeOf(safe)
  const initialReduxState = {
    addressBook: { '1': { [safe]: safeName } },
    addedSafes: { '1': { [safe]: { owners: [], threshold: 1 } } },
  } as Partial<RootState>
  const onSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, () =>
        HttpResponse.json(extendedSafeInfoBuilder().build()),
      ),
    )
  })

  const renderStep = (address: string) =>
    render(
      <SetAddressStep
        data={{ ...loadSafeDefaultData, address, name: 'Treasury Safe 2' }}
        onSubmit={onSubmit}
        onBack={jest.fn()}
        setStep={jest.fn()}
      />,
      { initialReduxState },
    )

  const clickNext = async () => {
    const next = screen.getByTestId('load-safe-next-btn')
    await waitFor(() => expect(next).not.toBeDisabled())
    fireEvent.click(next)
  }

  const confirmDialog = () => screen.findByRole('dialog', { name: 'Similar address detected' })

  it('says which Safe in my accounts the address looks like', async () => {
    renderStep(lookalike)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      `This Safe account is similar to ${safeName} in your accounts.`,
    )
  })

  it('goes to the next step only after the user confirms', async () => {
    renderStep(lookalike)

    await clickNext()
    const dialog = await confirmDialog()
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByText(/I understand, continue anyway/))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ address: lookalike })))
  })

  it('stays on the step when the user cancels the confirmation', async () => {
    renderStep(lookalike)

    await clickNext()
    fireEvent.click(within(await confirmDialog()).getByText('Cancel'))

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Similar address detected' })).not.toBeInTheDocument(),
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('goes straight to the next step for an address that looks like nothing saved', async () => {
    renderStep(fakerChecksummedAddress())

    await clickNext()

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('tracks the warning and the decision to continue', async () => {
    const trackEvent = jest.spyOn(analytics, 'trackEvent')
    const params = { [MixpanelEventParams.LOCATION]: 'add_safe' }
    renderStep(lookalike)

    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith(ADDRESS_POISONING_EVENTS.WARNING_SHOWN, params))

    await clickNext()
    fireEvent.click(within(await confirmDialog()).getByText(/I understand, continue anyway/))

    await waitFor(() => expect(trackEvent).toHaveBeenCalledWith(ADDRESS_POISONING_EVENTS.WARNING_CONTINUED, params))
  })
})
