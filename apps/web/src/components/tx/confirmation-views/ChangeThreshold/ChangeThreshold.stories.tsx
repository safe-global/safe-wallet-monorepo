import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { SettingsInfoType, TransactionInfoType } from '@safe-global/store/gateway/types'
import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import ChangeThreshold from './index'

const meta = {
  title: 'Components/TxFlow/ConfirmationViews/ChangeThreshold',
  component: ChangeThreshold,
  args: {
    txInfo: {
      type: TransactionInfoType.SETTINGS_CHANGE,
      settingsInfo: {
        type: SettingsInfoType.CHANGE_THRESHOLD,
        threshold: 1,
      },
    } as TransactionInfo,
  },
  decorators: [
    (Story) => {
      return (
        <StoreDecorator
          // Seed the Safe with signers so the "1 out of N signers" copy shows a real total.
          initialState={{
            safeInfo: {
              data: {
                address: { value: '0xE20e9C5Fb0FD24Ae4423Fc1eeD1088BCe1934630' },
                chainId: '1',
                threshold: 2,
                owners: [
                  { value: '0xEfC188BFc4FFFaAb53Fde6EF0FcFA4eC9cfCC9D9' },
                  { value: '0xCe6C0c783c4fFdAf5EDC7f1DCDA4aCdbe32d8EFa' },
                  { value: '0xE3f9b2Ee7F311BC2Aeeb64Aa3F78FE87833EF12b' },
                ],
                deployed: true,
              },
            },
          }}
        >
          <div className="p-4">
            <Story />
          </div>
        </StoreDecorator>
      )
    },
  ],

  tags: ['autodocs'],
} satisfies Meta<typeof ChangeThreshold>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}
