import { useCallback, useState, type ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { mswLoader } from 'msw-storybook-addon'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { createMockStory } from '@/stories/mocks'
import { RouterDecorator } from '@/stories/routerDecorator'
import NewTxFlow from './index'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  shadcn: true,
})

const NewTransactionJourney = (): ReactElement => {
  const [txFlow, setTxFlow] = useState<TxModalContextType['txFlow']>()

  const handleSetTxFlow = useCallback<TxModalContextType['setTxFlow']>((flow) => {
    setTxFlow(flow)
  }, [])

  return (
    <TxModalContext.Provider value={{ txFlow, setTxFlow: handleSetTxFlow, setFullWidth: () => {} }}>
      {txFlow ?? <NewTxFlow />}
    </TxModalContext.Provider>
  )
}

const meta = {
  title: 'Components/TxFlow/NewTransaction',
  component: NewTransactionJourney,
  loaders: [mswLoader],
  decorators: [
    setup.decorator,
    (Story) => (
      <RouterDecorator>
        <Story />
      </RouterDecorator>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
  },
} satisfies Meta<typeof NewTransactionJourney>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SendTokensJourney: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('heading', { name: 'New transaction' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Send tokens' }))

    const tokenSelector = within(canvas.getByTestId('token-selector'))
    await userEvent.click(await tokenSelector.findByRole('combobox'))
    await userEvent.click((await within(document.body).findAllByRole('option'))[0])

    const recipient = await canvas.findByRole('combobox', { name: /Recipient address/ })
    await userEvent.type(recipient, '0x000000000000000000000000000000000000dEaD')
    await userEvent.type(canvas.getByTestId('token-amount-field'), '1')

    const nextButton = canvas.getByRole('button', { name: 'Next' })
    await waitFor(() => expect(nextButton).toBeEnabled())
    await userEvent.click(nextButton)

    await expect(await canvas.findByRole('heading', { name: 'Confirm transaction' })).toBeVisible()
  },
}
