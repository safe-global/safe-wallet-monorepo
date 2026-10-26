/** @jest-environment-options {"url": "https://app.safe.global/"} */
import { faker } from '@faker-js/faker'
import { act, fireEvent, waitFor } from '@testing-library/react'
import { fakerChecksummedAddress, render, screen } from '@/tests/test-utils'
import { CopyDeeplinkLabels, TX_LIST_EVENTS, trackEvent } from '@/services/analytics'
import TxShareLink from './TxShareLink'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const writeText = jest.fn().mockResolvedValue(undefined)

const renderShareLink = (query: Record<string, string>) => {
  const txId = faker.string.alphanumeric(20)
  render(
    <TxShareLink id={txId} eventLabel={CopyDeeplinkLabels.shareBlock}>
      <button>Copy</button>
    </TxShareLink>,
    { routerProps: { query } },
  )
  return txId
}

describe('TxShareLink', () => {
  const safe = `sep:${fakerChecksummedAddress()}`

  beforeEach(() => {
    jest.clearAllMocks()
    Object.assign(navigator, { clipboard: { writeText } })
  })

  it('copies the link to the transaction page of the Safe', async () => {
    const txId = renderShareLink({ safe })

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`https://app.safe.global/transactions/tx?safe=${safe}&id=${txId}`)
    })
  })

  it('keeps the Workspace in the copied link', async () => {
    const spaceId = faker.string.uuid()
    renderShareLink({ safe, spaceId })

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`&spaceId=${spaceId}$`)))
    })
  })

  it('tracks the copy as a deeplink copy from the share block', async () => {
    renderShareLink({ safe })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    })

    expect(trackEvent).toHaveBeenCalledWith(
      { ...TX_LIST_EVENTS.COPY_DEEPLINK, label: CopyDeeplinkLabels.shareBlock },
      undefined,
    )
  })
})
