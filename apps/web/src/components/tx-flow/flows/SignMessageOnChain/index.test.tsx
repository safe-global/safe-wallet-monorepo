import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { hexlify, toUtf8Bytes } from 'ethers'
import { Methods } from '@safe-global/safe-apps-sdk'
import { transactionBuilderSafeApp } from '@safe-global/test/msw/mockSafeApps'
import { render, screen } from '@/tests/test-utils'
import SignMessageOnChainFlow from '.'

jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/services/tx/tx-sender', () => ({ createTx: jest.fn(() => new Promise(() => {})) }))
jest.mock('@/hooks/useHighlightHiddenTab', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const app = transactionBuilderSafeApp

const renderFlow = (message: string) =>
  render(
    <SignMessageOnChainFlow props={{ app, requestId: faker.string.uuid(), message, method: Methods.signMessage }} />,
  )

describe('SignMessageOnChainFlow', () => {
  it('shows the name and the icon of the Safe App that asks for the signature', async () => {
    renderFlow('Message 1')

    expect(await screen.findByText(app.name)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: app.name })).toHaveAttribute('src', app.iconUrl)
  })

  it('shows the plain-text message that the Safe App asks to sign', async () => {
    renderFlow('Message 1')

    expect(await screen.findByText('Message 1')).toBeInTheDocument()
  })

  it('shows a hex-encoded message as readable text', async () => {
    renderFlow(hexlify(toUtf8Bytes('Message 1')))

    expect(await screen.findByText('Message 1')).toBeInTheDocument()
  })
})
