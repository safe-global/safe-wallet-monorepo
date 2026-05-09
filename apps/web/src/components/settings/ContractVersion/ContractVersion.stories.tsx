import type { Meta, StoryObj } from '@storybook/react'
import { createMinimalDecorator } from '@/stories/mocks'
import { ContractVersion } from './index'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'

const decorator = createMinimalDecorator({
  wallet: 'owner',
  layout: 'paper',
  store: {
    safeInfo: {
      data: {
        address: { value: '0x1234567890123456789012345678901234567890' },
        chainId: '1',
        version: '1.4.1',
        implementation: { value: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552' },
        implementationVersionState: ImplementationVersionState.UP_TO_DATE,
        deployed: true,
      },
      loading: false,
      loaded: true,
    },
  },
})

const meta: Meta<typeof ContractVersion> = {
  title: 'Components/Settings/ContractVersion',
  component: ContractVersion,
  parameters: { layout: 'padded' },
  decorators: [decorator],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const LatestVersion: Story = {}

export const OutdatedVersion: Story = {
  decorators: [
    createMinimalDecorator({
      wallet: 'owner',
      layout: 'paper',
      store: {
        safeInfo: {
          data: {
            address: { value: '0x1234567890123456789012345678901234567890' },
            chainId: '1',
            version: '1.3.0',
            implementation: { value: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552' },
            implementationVersionState: ImplementationVersionState.OUTDATED,
            deployed: true,
          },
          loading: false,
          loaded: true,
        },
      },
    }),
  ],
}

export const Loading: Story = {
  decorators: [
    createMinimalDecorator({
      wallet: 'owner',
      layout: 'paper',
      store: {
        safeInfo: {
          data: {
            address: { value: '0x1234567890123456789012345678901234567890' },
            chainId: '1',
          },
          loading: true,
          loaded: false,
        },
      },
    }),
  ],
}
