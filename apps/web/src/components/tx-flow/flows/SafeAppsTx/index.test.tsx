import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { fireEvent, render, screen } from '@/tests/test-utils'
import SafeAppsTxFlow from '.'

jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/services/tx/tx-sender', () => ({
  createTx: jest.fn(),
  createMultiSendCallOnlyTx: jest.fn(),
}))
jest.mock('@/hooks/useHighlightHiddenTab', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const app = { name: 'Transaction Builder', iconUrl: faker.image.url() }

const renderFlow = () =>
  render(
    <SafeAppsTxFlow
      data={{
        app,
        requestId: faker.string.uuid(),
        txs: [{ to: faker.finance.ethereumAddress(), value: '0', data: '0x' }],
      }}
    />,
  )

describe('SafeAppsTxFlow', () => {
  it('shows the name and the icon of the app that requested the transaction', async () => {
    renderFlow()

    expect(await screen.findByText(app.name)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: app.name })).toHaveAttribute('src', app.iconUrl)
  })

  it('shows the placeholder icon when the icon of the app fails to load', async () => {
    renderFlow()

    const icon = await screen.findByRole('img', { name: app.name })
    fireEvent.error(icon)

    expect(icon).toHaveAttribute('src', '/images/apps/app-placeholder.svg')
  })
})
